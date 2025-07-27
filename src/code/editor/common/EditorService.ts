import * as monaco from "monaco-editor";
import editorTheme from "../../contrib/theme/editor.json";

export type OpenTab = {
  uri: string;
  language?: string;
  initialContent?: string;
};

type Theme = "dark" | "light";

function toFileUri(path: string) {
  return monaco.Uri.file(path);
}

function convertTheme(name: string, vscodeTheme: any) {
  const type = vscodeTheme.type ?? "dark";
  const base = type === "light" ? "vs" : "vs-dark";
  const rules: monaco.editor.ITokenThemeRule[] = [];
  const tokenColors = vscodeTheme.tokenColors || [];
  for (const tc of tokenColors) {
    const scopes: string[] = Array.isArray(tc.scope)
      ? tc.scope
      : typeof tc.scope === "string"
      ? tc.scope.split(",").map((s: string) => s.trim())
      : [""];
    for (const scope of scopes) {
      const fg = tc.settings?.foreground;
      rules.push({
        token: scope,
        foreground: typeof fg === "string" ? fg.replace("#", "") : undefined,
        fontStyle: tc.settings?.fontStyle,
      });
    }
  }
  const colors = vscodeTheme.colors || {};
  return { name, definition: { base, inherit: true, rules, colors } };
}

export class EditorService {
  private static i: EditorService;
  private editor: monaco.editor.IStandaloneCodeEditor | null = null;
  private models = new Map<string, monaco.editor.ITextModel>();
  private viewStates = new Map<
    string,
    monaco.editor.ICodeEditorViewState | null
  >();
  private themeName = "customTheme";

  private constructor() {}

  static get() {
    if (!this.i) this.i = new EditorService();
    return this.i;
  }

  mount(container: HTMLElement, _theme: Theme = "dark") {
    if (this.editor) return;
    const { name, definition } = convertTheme(
      this.themeName,
      editorTheme as any
    );
    monaco.editor.defineTheme(name, definition as any);
    monaco.editor.setTheme(name);
    this.editor = monaco.editor.create(container, {
      automaticLayout: true,
      largeFileOptimizations: true,
      cursorBlinking: "smooth",
      cursorSmoothCaretAnimation: "on",
      smoothScrolling: true,
      minimap: { enabled: false },
      fontSize: 18,
    });
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

    this.editor.focus();
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
