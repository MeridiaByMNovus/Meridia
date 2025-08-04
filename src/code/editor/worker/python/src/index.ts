import { LspClient } from "./client.js";
import type {
  editor,
  Position,
  IRange,
  CancellationToken,
  languages,
  IMarkdownString,
  IDisposable,
} from "monaco-editor";
import type _monaco from "monaco-editor";

import {
  CompletionItem,
  CompletionList,
  Definition,
  Hover,
  InsertReplaceEdit,
  MarkupContent,
  ParameterInformation,
  Range,
  SignatureHelp,
  SignatureInformation,
  Location,
  DocumentUri,
  TextDocumentEdit,
  AnnotatedTextEdit,
  DiagnosticSeverity,
} from "vscode-languageserver";
import { UserFolder } from "./message.js";

type MonacoModule = typeof _monaco;

export interface MonacoPyrightProviderFeatures {
  hover: boolean;
  completion: boolean;
  signatureHelp: boolean;
  diagnostic: boolean;
  rename: boolean;
  findDefinition: boolean;
}

export interface MonacoPyrightOptions {
  features: Partial<MonacoPyrightProviderFeatures>;

  /** Type stubs for additional module */
  typeStubs?: string | UserFolder;

  /** Set a custom typeshed zipfile. Set `false` to disable typeshed */
  typeshed?: ArrayBuffer | false;

  /** Minimal time in milliseconds to wait before sending next update notification */
  diagnosticsInterval: number;
}

const defaultOptions: MonacoPyrightOptions = {
  features: {
    hover: true,
    completion: true,
    signatureHelp: true,
    diagnostic: true,
    rename: true,
    findDefinition: true,
  },
  typeStubs: undefined,
  diagnosticsInterval: 1000,
};

export class MonacoPyrightProvider {
  lspClient: LspClient;
  options: MonacoPyrightOptions;
  editorChangeListener?: IDisposable;
  monacoMod?: MonacoModule;

  public constructor(
    workerUrl?: string,
    options?: Partial<MonacoPyrightOptions>
  ) {
    this.lspClient = new LspClient(workerUrl);

    const finalOptions = Object.assign(defaultOptions, options || {});

    this.options = finalOptions;
  }

  async init(monacoModule: MonacoModule) {
    this.monacoMod = monacoModule;

    const options = this.options;
    let typeStubsFolder: UserFolder = {};
    if (typeof options?.typeStubs === "string") {
      typeStubsFolder["user_types.pyi"] = options.typeStubs;
    } else if (typeof options?.typeStubs === "object") {
      typeStubsFolder = options.typeStubs;
    }

    await this.lspClient.initialize(
      "/",
      typeStubsFolder,
      this.options.typeshed
    );
    await this.lspClient.updateSettings();

    if (options.features.hover) {
      monacoModule.languages.registerHoverProvider("python", {
        provideHover: this.onHover.bind(this),
      });
    }

    if (options.features.completion) {
      monacoModule.languages.registerCompletionItemProvider("python", {
        provideCompletionItems: this.onCompletionRequest.bind(this),
        resolveCompletionItem: this.onResolveCompletion.bind(this),
        triggerCharacters: [".", "[", '"', "'"],
      });
    }

    if (options.features.signatureHelp) {
      monacoModule.languages.registerSignatureHelpProvider("python", {
        provideSignatureHelp: this.onSignatureHelp.bind(this),
        signatureHelpTriggerCharacters: ["(", ","],
      });
    }

    if (options.features.findDefinition) {
      monacoModule.languages.registerDefinitionProvider("python", {
        provideDefinition: this.provideDefinition.bind(this),
      });
    }

    if (options.features.rename) {
      monacoModule.languages.registerRenameProvider("python", {
        provideRenameEdits: this.provideRenameEdits.bind(this),
        resolveRenameLocation: this.resolveRename.bind(this),
      });
    }
  }

  private timer = -1;
  async setupDiagnostics(editor: editor.IStandaloneCodeEditor) {
    if (this.options.features.diagnostic) {
      if (this.editorChangeListener) {
        return;
      }

      this.lspClient.setupDiagnosticsCallback((diagnostics) => {
        const markers = diagnostics.map(
          (diag) =>
            <editor.IMarkerData>{
              ...this.convertRange(diag.range),
              severity: this.convertSeverity(
                diag.severity || DiagnosticSeverity.Hint
              ),
              message: diag.message,
            }
        );

        this.monacoMod?.editor?.setModelMarkers(
          editor.getModel() as editor.ITextModel,
          "Pyright",
          markers
        );
      });

      this.editorChangeListener = editor.onDidChangeModelContent((e) => {
        if (this.timer > 0) {
          return;
        }

        this.updateDoc(editor);
        this.timer = window.setTimeout(() => {
          this.timer = -1;
          this.updateDoc(editor);
        }, this.options.diagnosticsInterval);
      });
    }
  }

  async stopDiagnostics() {
    this.editorChangeListener?.dispose();
  }

  async dispose() {
    this.stopDiagnostics();

    if (this.editorChangeListener) {
      this.editorChangeListener.dispose();
    }
  }

  async updateOptions(
    newOptions: Partial<MonacoPyrightOptions>,
    editor?: editor.IStandaloneCodeEditor
  ): Promise<void> {}

  convertSeverity(severity: DiagnosticSeverity): MarkerSeverity {
    switch (severity) {
      case DiagnosticSeverity.Error:
      default:
        return MarkerSeverity.Error;

      case DiagnosticSeverity.Warning:
        return MarkerSeverity.Warning;

      case DiagnosticSeverity.Information:
        return MarkerSeverity.Info;

      case DiagnosticSeverity.Hint:
        return MarkerSeverity.Hint;
    }
  }

  private updateDoc(editor: editor.IStandaloneCodeEditor) {
    if (editor.getModel()?.getLanguageId() != "python") {
      return;
    }
    const doc = editor.getValue();
    this.lspClient.updateDocVersion(doc);
  }

  async provideRenameEdits(
    model: editor.ITextModel,
    position: Position,
    newName: string,
    token: CancellationToken
  ): Promise<(languages.WorkspaceEdit & languages.Rejection) | null> {
    const results = await this.lspClient.rename(
      model.getValue(),
      this.convertLspPosition(position),
      newName
    );

    if (!results) return null;

    if (results.documentChanges) {
      return {
        edits: results.documentChanges
          .filter(
            (docChange) =>
              (docChange as TextDocumentEdit).textDocument?.uri ===
              LspClient.docUri
          )
          .map((edit) => edit as TextDocumentEdit)
          .flatMap((edit) => edit.edits)
          .map((edit) => ({
            resource: model.uri,
            textEdit: {
              range: this.convertRange(edit.range),
              text: edit.newText,
            },
            versionId: undefined,
          })),
      };
    }

    return null;
  }

  async resolveRename(
    model: editor.ITextModel,
    position: Position,
    token: CancellationToken
  ): Promise<languages.RenameLocation | null> {
    return null;

    type DefaultBehavior = {
      defaultBehavior: boolean;
    };
    type RangeWithPlaceHolder = {
      range: Range;
      placeholder: string;
    };
    const results = await this.lspClient.parepareRename(
      model.getValue(),
      this.convertLspPosition(position)
    );
    //

    if (!results) return null;

    if ((results as DefaultBehavior).defaultBehavior) {
      return null;
    }

    if ((results as RangeWithPlaceHolder).range) {
      return {
        range: this.convertRange((results as RangeWithPlaceHolder).range),
        text: (results as RangeWithPlaceHolder).placeholder,
      };
    }

    if ((results as Range).start) {
      return {
        range: this.convertRange(results as Range),
        text: "",
      };
    }

    return null;
  }

  async provideDefinition(
    model: editor.ITextModel,
    position: Position,
    token: CancellationToken
  ): Promise<languages.Definition | languages.LocationLink[] | null> {
    const results = (await this.lspClient.getDefinition(model.getValue(), {
      line: position.lineNumber - 1,
      character: position.column - 1,
    })) as Definition;

    if (!results) throw new Error("Invalid result");

    let location: Location;
    if (results instanceof Array) {
      location = results[0];
    } else {
      location = results as Location;
    }

    if (location.uri != LspClient.docUri) {
      return null;
    }

    return {
      uri: model.uri,
      range: this.convertRange(location.range),
    };
  }

  async onSignatureHelp(
    model: editor.ITextModel,
    position: Position
  ): Promise<languages.SignatureHelpResult | null> {
    const sigInfo = await this.lspClient.getSignatureHelp(model.getValue(), {
      line: position.lineNumber - 1,
      character: position.column - 1,
    });

    if (!sigInfo) return null;

    return {
      value: {
        signatures: sigInfo.signatures.map((sig) => {
          return {
            label: sig.label,
            documentation: sig.documentation,
            parameters: sig.parameters as ParameterInformation[],
            activeParameter: sig.activeParameter as number,
          };
        }),
        activeSignature: sigInfo.activeSignature as number,
        activeParameter: sigInfo.activeParameter as number,
      },
      dispose: () => {},
    };
  }

  async onHover(
    model: editor.ITextModel,
    position: Position
  ): Promise<languages.Hover | null> {
    const hoverInfo = await this.lspClient.getHoverInfo(model.getValue(), {
      line: position.lineNumber - 1,
      character: position.column - 1,
    });

    if (!hoverInfo) return null;

    return {
      contents: [
        {
          value: (hoverInfo.contents as MarkupContent).value,
        },
      ],
      range: this.convertRange(hoverInfo.range as Range),
    };
  }

  async onCompletionRequest(
    model: editor.ITextModel,
    position: Position
  ): Promise<languages.CompletionList> {
    const completionInfo = (await this.lspClient.getCompletion(
      model.getValue(),
      {
        line: position.lineNumber - 1,
        character: position.column - 1,
      }
    )) as CompletionList;

    return {
      suggestions: completionInfo.items.map((item) => {
        return this.convertCompletionItem(item, model);
      }),
      incomplete: completionInfo.isIncomplete,
      dispose: () => {},
    };
  }

  async onResolveCompletion(
    item: languages.CompletionItem
  ): Promise<languages.CompletionItem> {
    const model = (item as ExtendedCompletionItem).__model;
    const original = (item as ExtendedCompletionItem).__original;

    if (!model || !original) {
      return null as any;
    }

    const result = await this.lspClient.resolveCompletion(original);
    return this.convertCompletionItem(result as CompletionItem);
  }

  convertLspPosition(position: Position) {
    return {
      line: position.lineNumber - 1,
      character: position.column - 1,
    };
  }

  convertCompletionItem(
    item: CompletionItem,
    model?: editor.ITextModel
  ): languages.CompletionItem {
    const converted: languages.CompletionItem = {
      label: item.label,
      kind: this.convertCompletionItemKind(item.kind as CompletionItemKind),
      tags: item.tags,
      detail: item.detail,
      documentation: item.documentation,
      sortText: item.sortText,
      filterText: item.filterText,
      preselect: item.preselect,
      insertText: item.label,
      range: undefined as any,
    };

    if (item.textEdit) {
      converted.insertText = item.textEdit.newText;
      if (InsertReplaceEdit.is(item.textEdit)) {
        converted.range = {
          insert: this.convertRange(item.textEdit.insert),
          replace: this.convertRange(item.textEdit.replace),
        };
      } else {
        converted.range = this.convertRange(item.textEdit.range);
      }
    }

    if (item.additionalTextEdits) {
      converted.additionalTextEdits = item.additionalTextEdits.map((edit) => {
        return {
          range: this.convertRange(edit.range),
          text: edit.newText,
        };
      });
    }

    (converted as ExtendedCompletionItem).__original = item;
    if (model) {
      (converted as ExtendedCompletionItem).__model = model;
    }

    return converted;
  }

  convertRange(range: Range): IRange {
    return {
      startLineNumber: range.start.line + 1,
      startColumn: range.start.character + 1,
      endLineNumber: range.end.line + 1,
      endColumn: range.end.character + 1,
    };
  }

  convertCompletionItemKind(
    itemKind: CompletionItemKind
  ): languages.CompletionItemKind {
    switch (itemKind) {
      case CompletionItemKind.Constant:
        return CompletionItemKind.Constant;

      case CompletionItemKind.Variable:
        return CompletionItemKind.Variable;

      case CompletionItemKind.Function:
        return CompletionItemKind.Function;

      case CompletionItemKind.Field:
        return CompletionItemKind.Field;

      case CompletionItemKind.Keyword:
        return CompletionItemKind.Keyword;

      default:
        return CompletionItemKind.Reference;
    }
  }
}

export enum MarkerSeverity {
  Hint = 1,
  Info = 2,
  Warning = 4,
  Error = 8,
}

enum CompletionItemKind {
  Method = 0,
  Function = 1,
  Constructor = 2,
  Field = 3,
  Variable = 4,
  Class = 5,
  Struct = 6,
  Interface = 7,
  Module = 8,
  Property = 9,
  Event = 10,
  Operator = 11,
  Unit = 12,
  Value = 13,
  Constant = 14,
  Enum = 15,
  EnumMember = 16,
  Keyword = 17,
  Text = 18,
  Color = 19,
  File = 20,
  Reference = 21,
  Customcolor = 22,
  Folder = 23,
  TypeParameter = 24,
  User = 25,
  Issue = 26,
  Snippet = 27,
}

interface ExtendedCompletionItem extends CompletionItem {
  __original?: CompletionItem;
  __model?: editor.ITextModel;
}
