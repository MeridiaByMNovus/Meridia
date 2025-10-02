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
import { registerCompletion } from "../../../platform/mira/mira.suggestions/register.js";

const fs = window.fs;
const path = window.path;
const python = window.python;

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
  private _watchers = new Map<string, any>();
  private _isUpdatingFromExternal = false;
  private _saveActionDisposable?: monaco.IDisposable;
  private _isEditorMounted = false;

  constructor() {
    registerTheme(monaco);
    this._hoverProvider();
  }

  private _hoverProvider() {
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

  private _ensure() {
    const editorElement = document.querySelector(".monaco-editor");
    const needsMount =
      !this._editor || !this._isEditorMounted || !editorElement;

    if (needsMount) {
      this._mount();
    }
  }

  _mount() {
    if (this._editor) {
      try {
        this._saveActionDisposable?.dispose();
        this._editor.dispose();
      } catch (e) {}
    }

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

    this._isEditorMounted = true;

    this._visiblity(false);

    if (!this._languageClient) this._setupCLient();

    this._setupCursorTracking();
    this._saveAction();
  }

  private _visiblity(visible: boolean) {
    const editorElement = document.querySelector(
      ".monaco-editor"
    ) as HTMLDivElement;
    if (editorElement) {
      editorElement.style.display = visible ? "flex" : "none";
    }
  }

  private _saveAction() {
    this._saveActionDisposable?.dispose();
    this._saveActionDisposable = this._editor.addAction({
      id: "workbench.save",
      label: "Save File",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S],
      contextMenuGroupId: "file",
      contextMenuOrder: 1,
      run: async () => {
        const model = this._editor.getModel();
        if (model) await this._save(model.uri.fsPath);
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

  private _setupCLient() {
    try {
      const port = window.storage.get("pyright-port");
      const webSocket = new WebSocket(`ws://localhost:${port}`);

      listen({
        webSocket,
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
              this._editor.updateOptions({ readOnly: false });
            })
            .catch((error) => {
              this._editor.updateOptions({ readOnly: false });
            });

          try {
            const disposable = this._languageClient.start();
            connection.onClose(() => disposable.dispose());
          } catch (error) {}
        },
      });
    } catch (error) {
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

      return symbols?.length ? this._findSymbol(symbols, lineNumber) : null;
    } catch {
      return null;
    }
  }

  private _findSymbol(symbols: any[], lineNumber: number): any | null {
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
          ? this._findSymbol(symbol.children, lineNumber) || symbol
          : symbol;
      }
    }
    return null;
  }

  async _open(tab: IEditorTab) {
    this._ensure();

    this._visiblity(true);

    let model = this._models.get(tab.uri);

    if (!model) {
      const uri = monaco.Uri.file(tab.uri);
      model =
        monaco.editor.getModel(uri) ||
        monaco.editor.createModel(
          await fs.readFile(tab.uri),
          getLanguage(tab.uri),
          uri
        );

      this._models.set(tab.uri, model);
      if (!this._tabs.find((t) => t.uri === tab.uri)) this._tabs.push(tab);

      model.onDidChangeContent(() => {
        if (!this._isUpdatingFromExternal) this._update(tab.uri, true);
      });

      this._watch(tab.uri);
    }

    registerCompletion(monaco, this._editor, {
      language: getLanguage(tab.uri),
      filename: tab.name,
    });

    this._editor.setModel(model);
    this._editor.focus();
  }

  private _watch(uri: string) {
    if (this._watchers.has(uri)) return;

    try {
      const watcher = fs.watchFile(
        uri,
        { persistent: true, interval: 1000 },
        () => this._external(uri)
      );
      this._watchers.set(uri, watcher);
    } catch {}
  }

  private async _external(uri: string) {
    const model = this._models.get(uri);
    if (!model) return;

    try {
      const [newContent, currentPosition, currentSelection] = await Promise.all(
        [
          fs.readFile(uri),
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

      this._update(uri, false);
    } catch {}
  }

  private _update(uri: string, _touched: boolean) {
    this._tabs = this._tabs.map((tab) =>
      tab.uri === uri ? { ...tab, is_touched: _touched } : tab
    );

    const _updated = select((s) => s.main.editor_tabs).map((tab) =>
      tab.uri === uri ? { ...tab, is_touched: _touched } : tab
    );

    dispatch(update_editor_tabs(_updated));
  }

  private async _save(uri: string) {
    const model = this._models.get(uri);
    if (!model) return;

    try {
      fs.createFile(uri, model.getValue());
      await python.executeScript(
        path.join([path.__dirname, "scripts", "format.py"]),
        [uri]
      );
      this._update(uri, false);
    } catch {}
  }

  public _close(uri: string) {
    const model = this._models.get(uri);
    if (!model) return;

    const watcher = this._watchers.get(uri);
    if (watcher) {
      try {
        fs.unwatchFile(uri);
      } catch {}
      this._watchers.delete(uri);
    }

    this._models.delete(uri);
    model.dispose();
    this._tabs = this._tabs.filter((tab) => tab.uri !== uri);

    if (this._editor && this._editor.getModel() === model) {
      if (this._tabs.length > 0) {
        this._open(this._tabs[this._tabs.length - 1]!);
      } else {
        this._editor.setModel(null);
        this._visiblity(false);
        this._saveActionDisposable?.dispose();
        this._saveActionDisposable = undefined as any;
      }
    }

    if (this._editor && this._tabs.length > 0) {
      this._editor.focus();
    }
  }

  dispose() {
    this._models.forEach((model) => model.dispose());
    this._models.clear();

    this._watchers.forEach((_, uri) => {
      try {
        fs.unwatchFile(uri);
      } catch {}
    });
    this._watchers.clear();

    this._saveActionDisposable?.dispose();

    if (this._editor) {
      try {
        this._editor.dispose();
      } catch {}
    }

    this._tabs = [];
    this._isEditorMounted = false;
  }
}

const _editor = new Editor();
registerStandalone("editor", _editor);
