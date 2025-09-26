import * as monaco from "monaco-editor";
import "monaco-languages";
import {
  CloseAction,
  createConnection,
  ErrorAction,
  MonacoLanguageClient,
  MonacoServices,
} from "monaco-languageclient";
import { listen } from "@codingame/monaco-jsonrpc";
import { IEditorTab } from "../../workbench.types.js";
import { registerStandalone } from "../workbench.standalone.js";
import { dispatch } from "../workbench.store/workbench.store.js";
import { update_editor_tabs } from "../workbench.store/workbench.store.slice.js";
import { select } from "../workbench.store/workbench.store.selector.js";
import { getLanguage } from "../workbench.utils.js";
import { registerTheme } from "./workbench.editor.theme.js";

Object.assign(window, {
  MonacoEnvironment: {
    getWorker(_moduleId: string, label: string) {
      const base = "/workers/";
      const workers: any = {
        json: "json.worker.js",
        css: "css.worker.js",
        html: "html.worker.js",
        typescript: "ts.worker.js",
        javascript: "ts.worker.js",
      };
      return new Worker(`${base}${workers[label] || "editor.worker.js"}`, {
        type: "module",
      });
    },
  },
});

MonacoServices.install(monaco as any);

export class Editor {
  private _tabs: IEditorTab[] = [];
  public _editor!: monaco.editor.IStandaloneCodeEditor;
  private _editorLayout = document.querySelector(".editor-area") as HTMLElement;
  private _languageClient?: MonacoLanguageClient;
  private _models = new Map<string, monaco.editor.ITextModel>();
  private _fileWatchers = new Map<string, any>();
  private _isUpdatingFromExternal = false;
  private _saveActionDisposable?: monaco.IDisposable;

  constructor() {
    registerTheme(monaco);
    this._setupHoverProvider();
  }

  private _setupHoverProvider() {
    monaco.languages.registerHoverProvider("python", {
      provideHover: (model, position) => {
        const word = model.getWordAtPosition(position);
        if (!word) return null;

        const lineText = model.getLineContent(position.lineNumber);
        const beforeWord = lineText.substring(0, word.startColumn - 1);
        const afterWord = lineText.substring(word.endColumn - 1);

        return {
          range: new monaco.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn
          ),
          contents: [
            { value: `**Symbol**: ${word.word}` },
            {
              value: `**Position**: Line ${position.lineNumber}, Column ${position.column}`,
            },
            { value: `**Context**: ${beforeWord}**${word.word}**${afterWord}` },
            { value: `**Language**: Python` },
          ],
        };
      },
    });
  }

  _mount() {
    if (this._editor) return;

    this._editor = monaco.editor.create(this._editorLayout, {
      theme: "meridia-theme",
      automaticLayout: true,
      fontSize: 20,
      fontFamily: "Jetbrains Mono",
      cursorBlinking: "smooth",
      cursorSmoothCaretAnimation: true,
      minimap: { enabled: false },
      renderWhitespace: "none",
    });

    (document.querySelector(".monaco-editor") as HTMLDivElement).style.display =
      "none";

    this._setupLanguageClient();
    this._setupCursorTracking();
    this._setupSaveAction();
  }

  private _setupSaveAction() {
    this._saveActionDisposable = this._editor.addAction({
      id: "workbench.save",
      label: "Save File",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S],
      contextMenuGroupId: "file",
      contextMenuOrder: 1,
      run: async () => {
        const model = this._editor.getModel();
        if (model) await this._saveFile(model.uri.fsPath);
      },
    });
  }

  private _setupCursorTracking() {
    this._editor.onDidChangeCursorPosition(async () => {
      const model = this._editor?.getModel();
      if (!model) return;

      const symbols = await this._getDocumentSymbols(
        model,
        this._editor.getPosition()?.lineNumber!
      );
      document.dispatchEvent(
        new CustomEvent("statusbar.update.referenace.path", {
          detail: { message: symbols, userId: Date.now() },
        })
      );
    });
  }

  private _setupLanguageClient() {
    try {
      const ws = new WebSocket("ws://localhost:3000");

      ws.onopen = () => {
        console.log("WebSocket connected");
        this._editor.updateOptions({ readOnly: false });
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        this._editor.updateOptions({ readOnly: true });
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        this._editor.updateOptions({ readOnly: true });
      };

      listen({
        webSocket: ws,
        onConnection: (connection) => {
          this._languageClient = new MonacoLanguageClient({
            name: "Pyright Language Client",
            clientOptions: {
              documentSelector: ["python"],
              errorHandler: {
                error: () => ErrorAction.Continue,
                closed: () => CloseAction.DoNotRestart,
              },
              initializationOptions: {
                settings: {
                  python: {
                    pythonPath: "/usr/bin/python",
                    analysis: {
                      autoSearchPaths: true,
                      useLibraryCodeForTypes: true,
                      diagnosticMode: "openFilesOnly",
                    },
                  },
                },
              },
            },
            connectionProvider: {
              get: (errorHandler, closeHandler) =>
                Promise.resolve(
                  createConnection(connection, errorHandler, closeHandler)
                ),
            },
          });

          this._languageClient
            .onReady()
            .then(() => {
              console.log("Language client ready");
              this._editor.updateOptions({ readOnly: false });
            })
            .catch((error) => {
              console.error("Language client initialization failed:", error);
              this._editor.updateOptions({ readOnly: false });
            });

          try {
            const disposable = this._languageClient.start();
            connection.onClose(() => disposable.dispose());
          } catch (error) {
            console.error("Failed to start language client:", error);
            this._editor.updateOptions({ readOnly: false });
          }
        },
      });
    } catch (error) {
      console.error("WebSocket setup failed:", error);
      this._editor.updateOptions({ readOnly: false });
    }
  }

  private async _getDocumentSymbols(
    model: monaco.editor.ITextModel,
    lineNumber: number
  ) {
    if (!this._languageClient) return null;

    try {
      const symbols = (await this._languageClient.sendRequest(
        "textDocument/documentSymbol",
        {
          textDocument: { uri: model.uri.toString() },
        }
      )) as any[];

      return symbols?.length
        ? this._findSymbolAtLine(symbols, lineNumber)
        : null;
    } catch {
      return null;
    }
  }

  private _findSymbolAtLine(symbols: any[], lineNumber: number): any | null {
    for (const symbol of symbols) {
      const range = symbol.range || symbol.location?.range;
      if (!range) continue;

      const startLine =
        (range.start?.line ?? range.startLineNumber) +
        (typeof range.start?.line === "number" ? 1 : 0);
      const endLine =
        (range.end?.line ?? range.endLineNumber) +
        (typeof range.end?.line === "number" ? 1 : 0);

      if (lineNumber >= startLine && lineNumber <= endLine) {
        return symbol.children?.length
          ? this._findSymbolAtLine(symbol.children, lineNumber) || symbol
          : symbol;
      }
    }
    return null;
  }

  async _open(tab: IEditorTab) {
    if (!this._editor) return;

    (document.querySelector(".monaco-editor") as HTMLDivElement).style.display =
      "flex";

    let model = this._models.get(tab.uri);

    if (!model) {
      const uri = monaco.Uri.file(tab.uri);
      model =
        monaco.editor.getModel(uri) ||
        monaco.editor.createModel(
          await window.fs.readFile(tab.uri),
          getLanguage(tab.uri),
          uri
        );

      this._models.set(tab.uri, model);
      if (!this._tabs.find((t) => t.uri === tab.uri)) this._tabs.push(tab);

      model.onDidChangeContent(() => {
        if (!this._isUpdatingFromExternal) this._updateTabState(tab.uri, true);
      });

      this._startFileWatching(tab.uri);
    }

    this._editor.setModel(model);
  }

  private _startFileWatching(uri: string) {
    if (this._fileWatchers.has(uri)) return;

    try {
      const watcher = window.fs.watchFile(
        uri,
        { persistent: true, interval: 1000 },
        () => this._handleExternalFileChange(uri)
      );
      this._fileWatchers.set(uri, watcher);
    } catch {}
  }

  private async _handleExternalFileChange(uri: string) {
    const model = this._models.get(uri);
    if (!model) return;

    try {
      const [newContent, currentPosition, currentSelection] = await Promise.all(
        [
          window.fs.readFile(uri),
          Promise.resolve(this._editor.getPosition()),
          Promise.resolve(this._editor.getSelection()),
        ]
      );

      this._isUpdatingFromExternal = true;
      model.setValue(newContent);
      this._isUpdatingFromExternal = false;

      if (currentPosition && this._editor.getModel() === model) {
        this._editor.setPosition(currentPosition);
        if (currentSelection) this._editor.setSelection(currentSelection);
      }

      this._updateTabState(uri, false);
    } catch {}
  }

  private _updateTabState(uri: string, isTouched: boolean) {
    this._tabs = this._tabs.map((tab) =>
      tab.uri === uri ? { ...tab, is_touched: isTouched } : tab
    );

    const updatedTabs = select((s) => s.main.editor_tabs).map((tab) =>
      tab.uri === uri ? { ...tab, is_touched: isTouched } : tab
    );

    dispatch(update_editor_tabs(updatedTabs));
  }

  private async _saveFile(uri: string) {
    const model = this._models.get(uri);
    if (!model) return;

    try {
      await window.fs.createFile(uri, model.getValue());
      this._updateTabState(uri, false);
    } catch {}
  }

  close(uri: string) {
    const model = this._models.get(uri);
    if (!model) return;

    const watcher = this._fileWatchers.get(uri);
    if (watcher) {
      try {
        window.fs.unwatchFile(uri);
      } catch {}
      this._fileWatchers.delete(uri);
    }

    this._models.delete(uri);
    model.dispose();
    this._tabs = this._tabs.filter((tab) => tab.uri !== uri);

    if (this._editor.getModel() === model) {
      if (this._tabs.length > 0) {
        this._open(this._tabs[this._tabs.length - 1]!);
      } else {
        this._editor.setModel(null);
        this._saveActionDisposable?.dispose();
        this._saveActionDisposable = undefined as any;
      }
    }

    this._editor.focus();
  }
}

const _editor = new Editor();
registerStandalone("editor", _editor);
