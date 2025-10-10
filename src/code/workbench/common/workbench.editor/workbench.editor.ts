import * as monaco from "monaco-editor";
import "./workbench.monaco.icons.js";
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
import { registerFsSuggestion } from "./workbench.editor.utils.js";

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
  private _layout = document.querySelector(".editor-area") as HTMLElement;
  private _client?: MonacoLanguageClient;
  private _models = new Map<string, monaco.editor.ITextModel>();
  private _watchers = new Map<string, any>();
  private _updating = false;
  private _saveActionDisposable?: monaco.IDisposable;
  private _mounted = false;

  private _registeredProviders = new Map<string, monaco.IDisposable>();
  private _isProvidersRegistered = false;

  constructor() {
    registerTheme(monaco);
    this._registerProviders();
    this._hoverProvider();
  }

  private _normalizePath(p: string) {
    return p.toLowerCase().replace(/\//g, "\\");
  }

  private _registerProviders() {
    if (this._isProvidersRegistered) return;

    try {
      const fsProvider = registerFsSuggestion(monaco);
      if (fsProvider) {
        this._registeredProviders.set("fs-suggestion", fsProvider);
      }

      this._isProvidersRegistered = true;
    } catch (error) {
      
    }
  }

  private _hoverProvider() {
    if (!this._registeredProviders.has("hover-provider")) {
      const hoverProvider = monaco.languages.registerHoverProvider("python", {
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
              {
                value: `**Context**: ${beforeWord}**${word.word}**${afterWord}`,
              },
              { value: `**Language**: Python` },
            ],
          };
        },
      });

      this._registeredProviders.set("hover-provider", hoverProvider);
    }
  }

  private _ensure() {
    const editorElement = document.querySelector(".monaco-editor");
    const needsMount = !this._editor || !this._mounted || !editorElement;

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

    this._editor = monaco.editor.create(this._layout, {
      theme: "meridia-theme",
      automaticLayout: true,
      fontSize: 20,
      fontFamily: "Jetbrains Mono",
      cursorBlinking: "smooth",
      cursorSmoothCaretAnimation: true,
      minimap: { enabled: false },
      renderWhitespace: "none",
    });

    this._mounted = true;
    this._visiblity(false);

    if (!this._client) this._setupCLient();

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
          this._client = new MonacoLanguageClient({
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

          this._client
            .onReady()
            .then(() => {
              this._editor.updateOptions({ readOnly: false });
            })
            .catch((error) => {
              this._editor.updateOptions({ readOnly: false });
            });

          try {
            const disposable = this._client.start();
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
    if (!this._client) return null;

    try {
      const symbols = (await this._client.sendRequest(
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

    const key = this._normalizePath(tab.uri);
    let model = this._models.get(key);

    if (!model) {
      const uri = monaco.Uri.file(tab.uri);
      
      model =
        monaco.editor.getModel(uri) ||
        monaco.editor.createModel(
          await fs.readFile(tab.uri),
          getLanguage(tab.uri),
          uri
        );

      this._models.set(key, model);
      if (!this._tabs.find((t) => this._normalizePath(t.uri) === key)) this._tabs.push(tab);

      model.onDidChangeContent(() => {
        if (!this._updating) this._update(tab.uri, true);
      });

      this._watch(tab.uri);
    }

    this._editor.setModel(model);
    this._editor.focus();
  }

  private _watch(uriString: string) {
    const key = this._normalizePath(uriString);
    if (this._watchers.has(key)) return;

    try {
      const uri = monaco.Uri.file(uriString);
      const watcher = fs.watchFile(
        uri.fsPath, // use fsPath for Windows compatibility
        { persistent: true, interval: 1000 },
        () => this._external(uriString)
      );
      this._watchers.set(key, watcher);
    } catch {}
  }

  private async _external(uriString: string) {
    const key = this._normalizePath(uriString);
    const model = this._models.get(key);
    if (!model) return;

    try {
      const [newContent, currentPosition, currentSelection] = await Promise.all([
        fs.readFile(uriString),
        Promise.resolve(this._editor.getPosition()),
        Promise.resolve(this._editor.getSelection()),
      ]);

      this._updating = true;
      model.setValue(newContent);
      this._updating = false;

      if (currentPosition && this._editor.getModel() === model) {
        this._editor.setPosition(currentPosition);
        if (currentSelection) this._editor.setSelection(currentSelection);
      }

      this._update(uriString, false);
    } catch {}
  }

  private _update(uriString: string, _touched: boolean) {
    this._tabs = this._tabs.map((tab) =>
      this._normalizePath(tab.uri) === this._normalizePath(uriString) ? { ...tab, is_touched: _touched } : tab
    );

    
    const _updated = select((s) => s.main.editor_tabs).map((tab) =>
      this._normalizePath(tab.uri) === this._normalizePath(uriString) ? { ...tab, is_touched: _touched } : tab
    );

    dispatch(update_editor_tabs(_updated));
  }

  async _save(uriString: string) {
    const key = this._normalizePath(uriString);
    const model = this._models.get(key);
    if (!model) {
      
      return;
    }

    

    try {
      fs.createFile(uriString, model.getValue());
      if (uriString.endsWith(".py"))
        await python.executeScript(
          path.join([path.__dirname, "scripts", "format.py"]),
          [uriString]
        );

      this._update(uriString, false);
    } catch {}
  }

  public _close(uriString: string) {
    const key = this._normalizePath(uriString);
    const model = this._models.get(key);
    if (!model) return;

    const watcher = this._watchers.get(key);
    if (watcher) {
      try {
        fs.unwatchFile(uriString);
      } catch {}
      this._watchers.delete(key);
    }

    this._models.delete(key);
    model.dispose();
    this._tabs = this._tabs.filter((tab) => this._normalizePath(tab.uri) !== key);

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
    this._registeredProviders.forEach((disposable) => {
      try {
        disposable.dispose();
      } catch (error) {
        
      }
    });
    this._registeredProviders.clear();
    this._isProvidersRegistered = false;

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
    this._mounted = false;
  }
}

const _editor = new Editor();
registerStandalone("editor", _editor);
