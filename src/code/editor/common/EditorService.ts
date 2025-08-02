import * as monaco from "monaco-editor";
import { MonacoPyrightProvider } from "monaco-pyright-lsp";
import debounce from "lodash.debounce";
import { themeService } from "../../workbench/service/ThemeServiceSingleton.js";
import { dispatch, store } from "../../workbench/common/store/store.js";
import { update_editor_tabs } from "../../workbench/common/store/mainSlice.js";
import { IEditorTab } from "../../../typings/types.js";

export type OpenTab = {
  uri: string;
  language?: string;
  initialContent?: string;
};

type Theme = "dark" | "light";

function toFileUri(path: string) {
  return monaco.Uri.file(path);
}

export class EditorService {
  private static i: EditorService;
  private editor: monaco.editor.IStandaloneCodeEditor | null = null;
  private pyrightProviderRef: MonacoPyrightProvider | null = null;
  private models = new Map<string, monaco.editor.ITextModel>();
  private viewStates = new Map<
    string,
    monaco.editor.ICodeEditorViewState | null
  >();
  private themeName = "customTheme";
  private normalizePath = (path: string) =>
    path.replace(/\\/g, "/").replace(/^\/?([a-zA-Z]):\//, "$1:/");

  static get() {
    if (!this.i) this.i = new EditorService();
    return this.i;
  }

  async mount(container: HTMLElement, _theme: Theme = "dark") {
    if (this.editor) return;

    monaco.editor.defineTheme("theme", {
      base: themeService.getCurrent()?.kind === "dark" ? "vs-dark" : "vs",
      inherit: true,
      rules: [],
      colors: {
        "editor.background":
          themeService.getColor("editor.background") ?? (null as any),
        "editor.foreground":
          themeService.getColor("editor.foreground") ?? (null as any),
      },
    });
    monaco.editor.setTheme("theme");

    this.editor = monaco.editor.create(container, {
      automaticLayout: true,
      largeFileOptimizations: true,
      cursorBlinking: "smooth",
      cursorSmoothCaretAnimation: "on",
      smoothScrolling: true,
      minimap: { enabled: false },
      fontSize: 18,
    });

    this.loadPyrightProvider();
  }

  private async loadPyrightProvider() {
    if (this.pyrightProviderRef || !this.editor) return;

    const provider = new MonacoPyrightProvider(
      "./workers/python.worker.js",
      {}
    );
    await provider.init(monaco);
    await provider.setupDiagnostics(this.editor);
    this.pyrightProviderRef = provider;
  }

  setTheme(_: Theme) {
    if (!this.editor) return;
    monaco.editor.setTheme(this.themeName);
  }

  open(tab: OpenTab, preserveViewState = true) {
    if (!this.editor) return;
    const current = this.editor.getModel();
    if (preserveViewState && current)
      this.viewStates.set(current.uri.toString(), this.editor.saveViewState());

    const uri = toFileUri(tab.uri);
    const key = uri.toString();

    let model = this.models.get(key) ?? monaco.editor.getModel(uri);
    if (!model) {
      model = monaco.editor.createModel(
        tab.initialContent ?? "",
        tab.language,
        uri
      );
      this.models.set(key, model);
    } else if (!this.models.has(key)) {
      this.models.set(key, model);
    }

    this.editor.setModel(model);

    if (preserveViewState) {
      const vs = this.viewStates.get(key);
      if (vs) this.editor.restoreViewState(vs);
    }

    const markFileTouched = debounce(() => {
      const model = this.editor?.getModel();
      const uriPath = this.normalizePath(model?.uri.path || "");

      const tabs = store.getState().main.editor_tabs;
      const index = tabs.findIndex(
        (file) => this.normalizePath(file.uri) === uriPath
      );

      if (index > -1 && !tabs[index].is_touched) {
        const updatedTabs = [...tabs];
        updatedTabs[index] = {
          ...updatedTabs[index],
          is_touched: true,
        };
        dispatch(update_editor_tabs(updatedTabs));
      }
    }, 300);

    this.editor.onDidChangeModelContent(() => {
      markFileTouched();
    });

    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      this.handle_save_file({
        path: this.editor!.getModel()?.uri.path as string,
        content: this.editor!.getValue(),
      });
    });

    this.editor.focus();
  }

  handle_save_file(data: { path: string; content: string }) {
    const newDataPath = this.normalizePath(data.path);
    window.electron.save_file({ path: newDataPath, content: data.content });

    const state = store.getState();
    const model_editing_index = state.main.editor_tabs.findIndex(
      (file) => this.normalizePath(file.uri) === newDataPath
    );

    if (model_editing_index === -1) {
      return;
    }

    const updated_files = [...state.main.editor_tabs];
    updated_files[model_editing_index] = {
      ...updated_files[model_editing_index],
      is_touched: false,
    };

    dispatch(update_editor_tabs(updated_files));
  }

  close(uriString: string) {
    if (!this.editor) return;
    const uri = toFileUri(uriString);
    const key = uri.toString();
    const model = this.models.get(key);
    if (!model) return;
    if (this.editor.getModel() === model)
      this.viewStates.set(key, this.editor.saveViewState());
  }

  disposeModel(uriString: string) {
    const uri = toFileUri(uriString);
    const key = uri.toString();
    const m = this.models.get(key);
    if (!m) return;
    if (this.editor?.getModel() === m) this.editor.setModel(null);
    m.dispose();
    this.models.delete(key);
    this.viewStates.delete(key);
  }

  hasModel(uriString: string) {
    const uri = toFileUri(uriString);
    const key = uri.toString();
    return this.models.has(key) || !!monaco.editor.getModel(uri);
  }

  getModel(uriString: string) {
    const uri = toFileUri(uriString);
    const key = uri.toString();
    return this.models.get(key) ?? monaco.editor.getModel(uri) ?? null;
  }

  getEditor() {
    return this.editor;
  }

  destroy() {
    if (this.editor) {
      this.editor.dispose();
      this.editor = null;
    }
    this.models.forEach((model) => model.dispose());
    this.models.clear();
    this.viewStates.clear();
    monaco.editor.getModels().forEach((m) => !m.isDisposed() && m.dispose());
  }
}
