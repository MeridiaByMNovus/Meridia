import * as monaco from "monaco-editor";
import debounce from "lodash.debounce";
import { themeService } from "../../workbench/common/classInstances/themeInstance.js";
import { dispatch, store } from "../../workbench/common/store/store.js";
import { update_editor_tabs } from "../../workbench/common/store/mainSlice.js";
import { PyrightProvider } from "../../platform/extension/pyright-api.js";

export type OpenTab = {
  uri?: string;
  language?: string;
  editorContent?: string;
};

type Theme = "dark" | "light";

let globalPyrightProvider: PyrightProvider | null = null;

function toFileUri(path: string) {
  return monaco.Uri.file(path);
}

export class EditorCore {
  private static i: EditorCore;
  public editor: monaco.editor.IStandaloneCodeEditor | null = null;
  private models = new Map<string, monaco.editor.ITextModel>();
  private viewStates = new Map<
    string,
    monaco.editor.ICodeEditorViewState | null
  >();
  public editorDiv: HTMLDivElement | null = null;
  public fileViewerDiv: HTMLDivElement | null = null;
  private normalizePath = (path: string | undefined | null) =>
    (path ?? "").replace(/\\/g, "/").replace(/^\/?([a-zA-Z]):\//, "$1:/");
  public editorContainer: HTMLElement | null = null;
  public pathDisplayEl: HTMLDivElement | null = null;
  private settingsWatchers: (() => void)[] = [];

  private readonly imageExtensions = new Set([
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".bmp",
    ".webp",
    ".ico",
    ".tiff",
    ".tif",
    ".avif",
  ]);
  private readonly svgExtensions = new Set([".svg"]);
  private readonly nonCodeExtensions = new Set([
    ...this.imageExtensions,
    ...this.svgExtensions,
  ]);

  constructor() {}

  static get() {
    if (!this.i) this.i = new EditorCore();
    return this.i;
  }

  private getFileExtension(path: string): string {
    const lastDot = path.lastIndexOf(".");
    return lastDot === -1 ? "" : path.substring(lastDot).toLowerCase();
  }

  private isImageFile(path: string): boolean {
    return this.imageExtensions.has(this.getFileExtension(path));
  }

  private isSvgFile(path: string): boolean {
    return this.svgExtensions.has(this.getFileExtension(path));
  }

  private isNonCodeFile(path: string): boolean {
    return this.nonCodeExtensions.has(this.getFileExtension(path));
  }

  private initializePyrightProvider(): void {
    if (!this.editor) return;

    if (!globalPyrightProvider) {
      globalPyrightProvider = new PyrightProvider(this.editor);
      globalPyrightProvider.init();
    }
  }

  async mount(container: HTMLElement, _theme: Theme = "dark") {
    if (this.editor) return;

    this.editorContainer = container;
    this.setupPathDisplay(container);

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

    this.editorDiv = document.createElement("div");
    this.editorDiv.className = "editor-div";
    container.appendChild(this.editorDiv);

    this.fileViewerDiv = document.createElement("div");
    this.fileViewerDiv.className = "file-viewer-div";
    container.appendChild(this.fileViewerDiv);

    const editorOptions = this.getEditorOptions();
    this.editor = monaco.editor.create(this.editorDiv, editorOptions);

    this.setupSettingsWatchers();

    this.initializePyrightProvider();
  }

  getEditorOptions(): monaco.editor.IStandaloneEditorConstructionOptions {
    const defaultOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
      automaticLayout: true,
      largeFileOptimizations: true,
      cursorBlinking: "smooth",
      cursorSmoothCaretAnimation: "on",
      smoothScrolling: true,
      minimap: { enabled: false },
      fontSize: 18,
      glyphMargin: true,
      lineNumbers: "on",
    };

    try {
      const {
        SettingsRegistryManager,
      } = require("../../workbench/common/registrey/SettingsRegistery.js");

      return {
        ...defaultOptions,
        fontSize: parseInt(
          SettingsRegistryManager.get("editor.fontSize") ?? "14"
        ),
        fontFamily:
          SettingsRegistryManager.get("editor.fontFamily") ??
          "'Consolas', 'Courier New', monospace",
        tabSize: parseInt(SettingsRegistryManager.get("editor.tabSize") ?? "4"),
        insertSpaces:
          SettingsRegistryManager.get("editor.insertSpaces") === "true",
        wordWrap: SettingsRegistryManager.get("editor.wordWrap") ?? "off",
        minimap: {
          enabled:
            SettingsRegistryManager.get("editor.minimap.enabled") !== "false",
        },
        glyphMargin: true,
      };
    } catch (error) {
      return defaultOptions;
    }
  }

  async setupSettingsWatchers(): Promise<void> {
    try {
      const { SettingsController } = await import(
        "../../workbench/browser/layout/common/controller/SettingsController.js"
      );
      const settingsController = SettingsController.getInstance();

      const editorSettings = [
        "editor.fontSize",
        "editor.fontFamily",
        "editor.tabSize",
        "editor.insertSpaces",
        "editor.wordWrap",
        "editor.minimap.enabled",
        "workbench.colorTheme",
      ];

      editorSettings.forEach((settingKey) => {
        const watcher = settingsController.onChange(
          settingKey,
          (newValue: any) => {
            this.updateEditorOption(settingKey, newValue);
          }
        );
        this.settingsWatchers.push(watcher);
      });
    } catch (error) {
      const handleSettingsChange = (event: Event) => {
        const customEvent = event as CustomEvent;
        const { key, newValue } = customEvent.detail;

        if (key.startsWith("editor.") || key === "workbench.colorTheme") {
          this.updateEditorOption(key, newValue);
        }
      };

      window.addEventListener("settings-changed", handleSettingsChange);
      this.settingsWatchers.push(() => {
        window.removeEventListener("settings-changed", handleSettingsChange);
      });
    }
  }

  private updateEditorOption(settingKey: string, newValue: any): void {
    if (!this.editor) return;

    switch (settingKey) {
      case "editor.fontSize":
        this.editor.updateOptions({ fontSize: parseInt(newValue) || 14 });
        break;
      case "editor.fontFamily":
        this.editor.updateOptions({
          fontFamily: newValue || "'Consolas', 'Courier New', monospace",
        });
        break;
      case "editor.wordWrap":
        this.editor.updateOptions({ wordWrap: newValue || "off" });
        break;
      case "editor.minimap.enabled":
        this.editor.updateOptions({
          minimap: { enabled: newValue === true || newValue === "true" },
        });
        break;
      case "editor.tabSize":
        const tabSize = parseInt(newValue) || 4;
        this.editor.getModel()?.updateOptions({ tabSize });
        break;
      case "editor.insertSpaces":
        const insertSpaces = newValue === true || newValue === "true";
        this.editor.getModel()?.updateOptions({ insertSpaces });
        break;
      case "workbench.colorTheme":
        this.updateEditorTheme();
        this.updateFileViewerTheme();
        break;
    }
  }

  setupPathDisplay(container: HTMLElement) {
    this.pathDisplayEl = document.createElement("div");
    this.pathDisplayEl.className = "editor-path-display";

    const left = document.createElement("div");
    left.className = "editor-path-display-left";

    const right = document.createElement("div");
    right.className = "editor-path-display-right";

    const actions = [
      {
        title: "Find",
        command: "actions.find",
        svg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--icon-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>`,
      },
      {
        title: "Go to Symbol",
        command: "editor.action.quickOutline",
        svg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--icon-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="16 18 22 12 16 6"></polyline>
      <polyline points="8 6 2 12 8 18"></polyline>
    </svg>`,
      },
      {
        title: "Go to Line",
        command: "editor.action.gotoLine",
        svg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--icon-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="4" y1="17" x2="20" y2="17"></line>
      <line x1="4" y1="12" x2="20" y2="12"></line>
      <line x1="4" y1="7" x2="20" y2="7"></line>
    </svg>`,
      },
      {
        title: "Trigger Suggest",
        command: "editor.action.triggerSuggest",
        svg: `<svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
      <text x="3" y="16" font-size="12" font-family="monospace" fill="var(--icon-color)">abc</text>
    </svg>`,
      },
    ];

    for (const action of actions) {
      const btn = document.createElement("span");
      btn.className = "editor-path-display-action";
      btn.innerHTML = action.svg;
      btn.title = action.title;
      btn.addEventListener("click", () => {
        const editor = this.editor;
        if (!editor) return;
        editor.focus();
        editor.trigger("editor-path-display", action.command, null);
      });
      right.appendChild(btn);
    }

    this.pathDisplayEl.appendChild(left);
    this.pathDisplayEl.appendChild(right);

    container.className = "editor-container";
    container.appendChild(this.pathDisplayEl);
  }

  private updateEditorFilePath(path: string) {
    if (!this.pathDisplayEl) return;
    const left = this.pathDisplayEl.querySelector(".editor-path-display-left");
    if (!left) return;

    const root = store.getState().main.folder_structure?.root ?? "";
    const normalizedRoot = this.normalizePath(root).replace(/\/+$/, "");
    const normalizedPath = this.normalizePath(path);

    let relativePath = normalizedPath.startsWith(normalizedRoot + "/")
      ? normalizedPath.slice(normalizedRoot.length + 1)
      : normalizedPath;

    left.textContent = relativePath;
  }

  private updateEditorTheme(): void {
    if (!this.editor) return;

    try {
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
    } catch (error) {}
  }

  private updateFileViewerTheme(): void {
    if (!this.fileViewerDiv) return;
    this.fileViewerDiv.style.backgroundColor = "var(--editor-bg)";
  }

  private showEditor(): void {
    if (this.editorDiv) {
      this.editorDiv.style.display = "block";
    }
    if (this.fileViewerDiv) {
      this.fileViewerDiv.style.display = "none";
    }
  }

  private showFileViewer(): void {
    if (this.editorDiv) {
      this.editorDiv.style.display = "none";
    }
    if (this.fileViewerDiv) {
      this.fileViewerDiv.style.display = "block";
    }
  }

  private async displayImageFile(path: string): Promise<void> {
    if (!this.fileViewerDiv) return;

    this.fileViewerDiv.innerHTML = "";

    const container = document.createElement("div");
    container.className = "image-viewer-container scrollbar-container";

    const img = document.createElement("img");
    img.className = "image-viewer-img";

    const info = document.createElement("div");
    info.className = "image-viewer-info";
    info.textContent = `Image: ${path.split("/").pop()}`;

    const handleImageLoad = () => {
      info.textContent += ` (${img.naturalWidth} × ${img.naturalHeight})`;
    };

    const handleImageError = () => {
      img.style.display = "none";
      const errorDiv = document.createElement("div");
      errorDiv.className = "image-viewer-error";

      const mainError = document.createElement("div");
      mainError.textContent = "Unable to load image";

      const details = document.createElement("div");
      details.className = "image-viewer-error-details";
      details.innerHTML = `File: ${path.split("/").pop()}<br>Reason: Security restrictions prevent loading local files`;

      errorDiv.appendChild(mainError);
      errorDiv.appendChild(details);
      container.appendChild(errorDiv);
      return;
    };

    img.addEventListener("load", handleImageLoad, { once: true });
    img.addEventListener("error", handleImageError, { once: true });

    try {
      if (window.electron?.readFile) {
        const imageData = await window.electron.readFile(path);
        if (imageData) {
          const base64 = btoa(
            String.fromCharCode(...new Uint8Array(imageData as any))
          );
          const extension = this.getFileExtension(path).substring(1);
          const mimeType = this.getMimeType(extension);
          img.src = `data:${mimeType};base64,${base64}`;
        } else {
          throw new Error("Could not read file");
        }
      } else {
        const normalizedPath = path.replace(/\\/g, "/");
        img.src = `safe-file:///${normalizedPath}`;
      }
    } catch (error) {
      console.log(error);
      handleImageError();
      this.fileViewerDiv.appendChild(container);
      return;
    }

    container.appendChild(img);
    container.appendChild(info);
    this.fileViewerDiv.appendChild(container);
  }

  private getMimeType(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      bmp: "image/bmp",
      webp: "image/webp",
      ico: "image/x-icon",
      tiff: "image/tiff",
      tif: "image/tiff",
      svg: "image/svg+xml",
    };
    return mimeTypes[extension.toLowerCase()] || "image/png";
  }

  private async displaySvgFile(path: string, content: string): Promise<void> {
    if (!this.fileViewerDiv) return;

    this.fileViewerDiv.innerHTML = "";

    const container = document.createElement("div");
    container.className = "svg-viewer-container";

    const svgContainer = document.createElement("div");
    svgContainer.className = "svg-viewer-content scrollbar-container";
    svgContainer.innerHTML = content;

    const info = document.createElement("div");
    info.className = "svg-viewer-info";
    info.textContent = `SVG: ${path.split("/").pop()}`;

    container.appendChild(svgContainer);
    container.appendChild(info);
    this.fileViewerDiv.appendChild(container);
  }

  open(tab: OpenTab, preserveViewState = true) {
    if (!this.editor) return;

    const filePath = tab.uri as string;

    if (this.isNonCodeFile(filePath)) {
      this.showFileViewer();
      this.updateEditorFilePath(filePath);

      if (this.isSvgFile(filePath)) {
        this.displaySvgFile(filePath, tab.editorContent ?? "");
      } else if (this.isImageFile(filePath)) {
        this.displayImageFile(filePath);
      }

      return;
    }

    this.showEditor();

    const current = this.editor.getModel();
    if (preserveViewState && current)
      this.viewStates.set(current.uri.toString(), this.editor.saveViewState());

    const uri = toFileUri(filePath);
    const key = uri.toString();

    let model = this.models.get(key) ?? monaco.editor.getModel(uri);
    if (!model) {
      model = monaco.editor.createModel(
        tab.editorContent ?? "",
        tab.language,
        uri
      );
      this.models.set(key, model);
    } else if (!this.models.has(key)) {
      this.models.set(key, model);
    }

    this.editor.setModel(model);
    this.updateEditorFilePath(filePath);

    if (preserveViewState) {
      const vs = this.viewStates.get(key);
      if (vs) this.editor.restoreViewState(vs);
    }

    const markFileTouched = debounce(() => {
      const model = this.editor?.getModel();
      const uriPath = this.normalizePath(model?.uri?.path ?? "");

      const tabs = store.getState().main.editor_tabs;
      const index = tabs.findIndex(
        (file) => this.normalizePath(file.uri as string) === uriPath
      );

      if (index > -1 && !tabs[index].is_touched) {
        const updatedTabs = [...tabs];
        updatedTabs[index] = {
          ...updatedTabs[index],
          is_touched: true,
        };
        dispatch(update_editor_tabs(updatedTabs));
      }
    }, 100);

    this.editor.onDidChangeModelContent(() => {
      markFileTouched();
    });

    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      this.handle_save_file({
        path: this.editor!.getModel()?.uri.path as string,
        content: this.editor!.getValue(),
      });
    });

    this.applyModelSettings(model);
    this.editor.focus();
  }

  private applyModelSettings(model: monaco.editor.ITextModel): void {
    try {
      import(
        "../../workbench/browser/layout/common/controller/SettingsController.js"
      )
        .then(({ SettingsController }) => {
          const settingsController = SettingsController.getInstance();
          const tabSize = settingsController.get("editor.tabSize") ?? 4;
          const insertSpaces =
            settingsController.get("editor.insertSpaces") ?? true;
          model.updateOptions({ tabSize, insertSpaces });
        })
        .catch(() => {
          try {
            const {
              SettingsRegistryManager,
            } = require("../../workbench/common/registrey/SettingsRegistery.js");
            const tabSize = parseInt(
              SettingsRegistryManager.get("editor.tabSize") ?? "4"
            );
            const insertSpaces =
              SettingsRegistryManager.get("editor.insertSpaces") === "true";
            model.updateOptions({ tabSize, insertSpaces });
          } catch (error) {
            model.updateOptions({ insertSpaces: false, tabSize: 2 });
          }
        });
    } catch (error) {
      model.updateOptions({ insertSpaces: false, tabSize: 2 });
    }
  }

  handle_save_file(data: { path: string; content: string }) {
    const newDataPath = this.normalizePath(data.path);
    window.electron.save_file({ path: newDataPath, content: data.content });

    const state = store.getState();
    const model_editing_index = state.main.editor_tabs.findIndex(
      (file) => this.normalizePath(file.uri as string) === newDataPath
    );

    if (model_editing_index === -1) return;

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
    this.settingsWatchers.forEach((unwatch) => unwatch());
    this.settingsWatchers = [];

    if (this.editor) {
      this.editor.dispose();
      this.editor = null;
    }
    this.models.forEach((model) => model.dispose());
    this.models.clear();
    this.viewStates.clear();
    monaco.editor.getModels().forEach((m) => !m.isDisposed() && m.dispose());
    this.editorContainer?.replaceChildren();
    this.editorContainer = null;
    this.pathDisplayEl = null;
    this.editorDiv = null;
    this.fileViewerDiv = null;

    if (globalPyrightProvider) {
      globalPyrightProvider = null;
    }
  }

  hide() {
    if (this.editorDiv) {
      this.editorDiv.style.display = "none";
    }
    if (this.fileViewerDiv) {
      this.fileViewerDiv.style.display = "none";
    }
    if (this.pathDisplayEl) {
      this.pathDisplayEl.style.display = "none";
    }
  }

  show() {
    if (this.editorDiv) {
      this.editorDiv.style.display = "block";
    }
    if (this.pathDisplayEl) {
      this.pathDisplayEl.style.display = "flex";
    }
  }

  isInitialized(): boolean {
    return !!(
      this.editor &&
      this.editorDiv &&
      this.pathDisplayEl &&
      this.fileViewerDiv
    );
  }

  async mountSafe(container: HTMLElement, _theme: Theme = "dark") {
    try {
      if (this.editor) return;

      this.editorContainer = container;

      try {
        this.setupPathDisplay(container);
      } catch (error) {}

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

      this.editorDiv = document.createElement("div");
      this.editorDiv.className = "editor-div";
      container.appendChild(this.editorDiv);

      this.fileViewerDiv = document.createElement("div");
      this.fileViewerDiv.className = "file-viewer-div";
      container.appendChild(this.fileViewerDiv);

      const editorOptions = this.getEditorOptions();
      this.editor = monaco.editor.create(this.editorDiv, editorOptions);

      this.setupSettingsWatchers();

      this.initializePyrightProvider();
    } catch (error) {
      this.destroy();
      throw error;
    }
  }

  getLineCols() {
    const position = this.editor?.getPosition();
    if (!position) return null;

    return {
      line: position.lineNumber,
      column: position.column,
    };
  }

  getIndent() {
    return {
      spaces: this.getEditorOptions().tabSize ?? 2,
    };
  }

  public getSelectedText(): string {
    if (!this.editor) {
      console.warn("Editor not initialized");
      return "";
    }

    try {
      const selection = this.editor.getSelection();
      const model = this.editor.getModel();

      if (!selection || !model) {
        console.warn("No selection or model available");
        return "";
      }

      if (selection.isEmpty()) {
        return "";
      }

      const selectedText = model.getValueInRange(selection);

      if (!selectedText || typeof selectedText !== "string") {
        return "";
      }

      return selectedText.trim();
    } catch (error) {
      console.error("Error getting selected text:", error);
      return "";
    }
  }

  public hasSelection(): boolean {
    if (!this.editor) return false;

    try {
      const selection = this.editor.getSelection();
      return selection ? !selection.isEmpty() : false;
    } catch (error) {
      console.error("Error checking selection:", error);
      return false;
    }
  }

  public getSelectionInfo(): {
    hasSelection: boolean;
    text: string;
    range?: any;
  } {
    if (!this.editor) {
      return { hasSelection: false, text: "" };
    }

    try {
      const selection = this.editor.getSelection();
      const model = this.editor.getModel();

      if (!selection || !model) {
        return { hasSelection: false, text: "" };
      }

      const hasSelection = !selection.isEmpty();
      const text = hasSelection ? model.getValueInRange(selection) : "";

      return {
        hasSelection,
        text: text.trim(),
        range: hasSelection
          ? {
              startLine: selection.startLineNumber,
              startColumn: selection.startColumn,
              endLine: selection.endLineNumber,
              endColumn: selection.endColumn,
            }
          : undefined,
      };
    } catch (error) {
      console.error("Error getting selection info:", error);
      return { hasSelection: false, text: "" };
    }
  }
}

export class EditorService extends EditorCore {}
