import * as monaco from "monaco-editor";
import debounce from "lodash.debounce";
import { registerCompletion } from "../../platform/assist/";
import { themeService } from "../../workbench/common/classInstances/themeInstance.js";
import { dispatch, store } from "../../workbench/common/store/store.js";
import { update_editor_tabs } from "../../workbench/common/store/mainSlice.js";
import { SettingsController } from "../../workbench/browser/common/controller/SettingsController.js";
import { StructureController } from "../../workbench/browser/common/controller/StructureController.js";
import { EditorSettings } from "./editorSettings.js";
import { EditorDecorations } from "./editorDecorations.js";
import { ImageStandalone } from "./standalone/imageStandalone.js";
import { JupyterStandalone } from "./standalone/jupyterStandalone.js";
import { LanguageSupport } from "./languages/language.js";
import {
  goToLineIcon,
  quickOutlineIcon,
  searchIcon,
  triggerSuggestIcon,
} from "../../workbench/common/svgIcons.js";
import { CompletionRegistration } from "../../platform/assist/types/core";

export type OpenTab = {
  uri?: string;
  language?: string;
  editorContent?: string;
};

type Theme = "dark" | "light";

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
  public jupyterDiv: HTMLDivElement | null = null;
  private normalizePath = (path: string | undefined | null) =>
    (path ?? "").replace(/\\/g, "/").replace(/^\/?([a-zA-Z]):\//, "$1:/");
  public editorContainer: HTMLElement | null = null;
  public pathDisplayEl: HTMLDivElement | null = null;
  private parseTimeout: NodeJS.Timeout | null = null;
  private isParsingStructure = false;
  private lastParsedContent = "";
  private lastContentHash = "";
  private isSaving = false;
  private saveTimeout: NodeJS.Timeout | null = null;

  private settingsHandler: EditorSettings | null = null;
  private languageHandler: LanguageSupport | null = null;
  private decorationsHandler: EditorDecorations | null = null;
  private imageViewer: ImageStandalone | null = null;
  private jupyterViewer: JupyterStandalone | null = null;

  private completionRef: CompletionRegistration | null = null;

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
  private readonly jupyterExtensions = new Set([".ipynb"]);
  private readonly nonCodeExtensions = new Set([
    ...this.imageExtensions,
    ...this.svgExtensions,
    ...this.jupyterExtensions,
  ]);

  constructor(private structureController: StructureController) {}

  static get(structureController: StructureController) {
    if (!this.i) this.i = new EditorCore(structureController);
    return this.i;
  }

  private generateContentHash(content: string): string {
    let hash = 0;
    if (content.length === 0) return hash.toString();
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  private async parseStructureForPython(
    content: string,
    language: string
  ): Promise<void> {
    if (this.isParsingStructure) return;

    const contentHash = this.generateContentHash(content);
    if (contentHash === this.lastContentHash) return;

    this.isParsingStructure = true;

    try {
      const path = window.path;

      const result = await window.python.executeScript(
        path.join(
          path.__dirname(),
          "..",
          "..",
          "python",
          "pythonStructureParser.py"
        ),
        [content]
      );

      if (result && Array.isArray(result) && result.length > 0) {
        try {
          const jsonString = result.join("\n");
          const structureData = JSON.parse(jsonString);

          if (structureData.success) {
            this.structureController.updateStructure(structureData);
            this.lastParsedContent = content;
            this.lastContentHash = contentHash;
          }
        } catch {}
      }
    } catch {
    } finally {
      this.isParsingStructure = false;
    }
  }

  private scheduleStructureParsing(content: string, language: string): void {
    if (language !== "python") return;

    const contentHash = this.generateContentHash(content);
    if (contentHash === this.lastContentHash) return;

    if (this.isSaving) return;

    if (this.parseTimeout) clearTimeout(this.parseTimeout);

    this.parseTimeout = setTimeout(() => {
      this.parseStructureForPython(content, language);
    }, 500);
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

  private isJupyterile(path: string): boolean {
    return this.jupyterExtensions.has(this.getFileExtension(path));
  }

  private isNonCodeFile(path: string): boolean {
    return this.nonCodeExtensions.has(this.getFileExtension(path));
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
        "editor.background": themeService.getColor("editor.background") ?? "",
        "editor.foreground": themeService.getColor("editor.foreground") ?? "",
      },
    });
    monaco.editor.setTheme("theme");

    this.setupThemeWatcher();

    this.editorDiv = document.createElement("div");
    this.editorDiv.className = "editor-div";
    container.appendChild(this.editorDiv);

    this.fileViewerDiv = document.createElement("div");
    this.fileViewerDiv.className = "file-viewer-div";
    container.appendChild(this.fileViewerDiv);

    this.jupyterDiv = document.createElement("div");
    this.jupyterDiv.className = "jupyter-div";
    container.appendChild(this.jupyterDiv);

    this.editor = monaco.editor.create(this.editorDiv, {
      automaticLayout: true,
    });

    this.settingsHandler = new EditorSettings(this.editor);
    await this.settingsHandler.setupSettingsWatchers();

    this.decorationsHandler = new EditorDecorations(this.editor);

    this.imageViewer = new ImageStandalone(this.fileViewerDiv);

    this.jupyterViewer = new JupyterStandalone(this.jupyterDiv);

    this.languageHandler = new LanguageSupport(this.editor);
  }

  open(tab: OpenTab, preserveViewState = true) {
    if (!this.editor) return;

    const filePath = tab.uri as string;

    if (this.isNonCodeFile(filePath)) {
      this.updateEditorFilePath(filePath);

      if (this.isSvgFile(filePath)) {
        this.showFileViewer();
        this.imageViewer?.displaySvgFile(filePath, tab.editorContent ?? "");
      } else if (this.isImageFile(filePath)) {
        this.showFileViewer();
        this.imageViewer?.displayImageFile(filePath);
      } else if (this.isJupyterile(filePath)) {
        this.showJupyterViewer();
        this.jupyterViewer?.render(filePath);
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

    if (tab.language === "python") {
      this.structureController.reset();
      this.lastParsedContent = "";
      this.lastContentHash = "";
      this.scheduleStructureParsing(tab.editorContent ?? "", tab.language);
    } else {
      this.lastParsedContent = "";
      this.lastContentHash = "";
      this.structureController.reset();
    }

    this.completionRef = registerCompletion(monaco, this.editor, {
      language: tab.language!,
      filename: window.path.basename(tab.uri!),
    });

    this.applyModelSettings(model);

    this.decorationsHandler?.updateTabLevelDecorations();

    const markFileTouched = debounce(() => {
      const model = this.editor?.getModel();
      const uriPath = this.normalizePath(model?.uri?.path ?? "");
      const tabs = store.getState().main.editor_tabs;
      const index = tabs.findIndex(
        (file) => this.normalizePath(file.uri as string) === uriPath
      );
      if (index > -1 && !tabs[index].is_touched) {
        const updatedTabs = [...tabs];
        updatedTabs[index] = { ...updatedTabs[index], is_touched: true };
        dispatch(update_editor_tabs(updatedTabs));
      }
    }, 100);

    const debouncedContentChange = debounce((content: string) => {
      if (!this.isSaving)
        this.scheduleStructureParsing(content, tab.language ?? "text");
      this.decorationsHandler?.updateTabLevelDecorations();
    }, 100);

    this.editor.onDidChangeModelContent(() => {
      markFileTouched();

      const currentModel = this.editor?.getModel();
      if (currentModel && tab.language === "python") {
        const content = currentModel.getValue();
        debouncedContentChange(content);
      } else {
        this.decorationsHandler?.updateTabLevelDecorations();
      }
    });

    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      this.handleSaveFile({
        path: this.editor!.getModel()?.uri.path as string,
        content: this.editor!.getValue(),
      });
    });

    this.editor.focus();
  }

  private setupThemeWatcher() {
    themeService.watchVar("editor.background", () => {
      this.updateEditorTheme();
    });
  }

  private updateEditorTheme() {
    if (!this.editor) return;
    try {
      monaco.editor.defineTheme("theme", {
        base: themeService.getCurrent()?.kind === "dark" ? "vs-dark" : "vs",
        inherit: true,
        rules: [],
        colors: {
          "editor.background":
            themeService.getColor("editor.background") ?? "#1e1e1e",
          "editor.foreground":
            themeService.getColor("editor.foreground") ?? "#d4d4d4",
        },
      });
      monaco.editor.setTheme("theme");
    } catch (error) {}
  }

  private applyModelSettings(model: monaco.editor.ITextModel) {
    try {
      import("../../workbench/browser/common/controller/SettingsController.js")
        .then(({ SettingsController }) => {
          const settingsController = SettingsController.getInstance();
          const tabSize = settingsController.get("editor.tabSize") ?? 4;
          const insertSpaces =
            settingsController.get("editor.insertSpaces") ?? true;
          model.updateOptions({ tabSize, insertSpaces });
        })
        .catch(() => {
          model.updateOptions({ insertSpaces: false, tabSize: 2 });
        });
    } catch {
      model.updateOptions({ insertSpaces: false, tabSize: 2 });
    }
  }

  private handleSaveFile(data: { path: string; content: string }) {
    this.isSaving = true;

    const newDataPath = this.normalizePath(data.path);
    window.filesystem.save_file({ path: newDataPath, content: data.content });

    const state = store.getState();
    const modelEditingIndex = state.main.editor_tabs.findIndex(
      (file) => this.normalizePath(file.uri as string) === newDataPath
    );

    if (modelEditingIndex !== -1) {
      const updatedFiles = [...state.main.editor_tabs];
      updatedFiles[modelEditingIndex] = {
        ...updatedFiles[modelEditingIndex],
        is_touched: false,
      };
      dispatch(update_editor_tabs(updatedFiles));
    }

    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.isSaving = false;
    }, 500);
  }

  private setupPathDisplay(container: HTMLElement) {
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
        svg: searchIcon,
      },
      {
        title: "Go to Symbol",
        command: "editor.action.quickOutline",
        svg: quickOutlineIcon,
      },
      {
        title: "Go to Line",
        command: "editor.action.gotoLine",
        svg: goToLineIcon,
      },
      {
        title: "Trigger Suggest",
        command: "editor.action.triggerSuggest",
        svg: triggerSuggestIcon,
      },
    ];

    for (const action of actions) {
      const btn = document.createElement("span");
      btn.className = "editor-path-display-action";
      btn.innerHTML = action.svg;
      btn.title = action.title;
      btn.addEventListener("click", () => {
        if (!this.editor) return;
        this.editor.focus();
        this.editor.trigger("editor-path-display", action.command, null);
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

  private showEditor() {
    if (this.editorDiv) this.editorDiv.style.display = "block";
    if (this.fileViewerDiv) this.fileViewerDiv.style.display = "none";
    if (this.pathDisplayEl) this.pathDisplayEl.style.display = "flex";
    if (this.jupyterDiv) this.jupyterDiv.style.display = "none";
  }

  private showFileViewer() {
    if (this.editorDiv) this.editorDiv.style.display = "none";
    if (this.fileViewerDiv) this.fileViewerDiv.style.display = "block";
    if (this.pathDisplayEl) this.pathDisplayEl.style.display = "flex";
    if (this.jupyterDiv) this.jupyterDiv.style.display = "none";
  }

  private showJupyterViewer() {
    if (this.editorDiv) this.editorDiv.style.display = "none";
    if (this.fileViewerDiv) this.fileViewerDiv.style.display = "none";
    if (this.pathDisplayEl) this.pathDisplayEl.style.display = "flex";
    if (this.jupyterDiv) this.jupyterDiv.style.display = "block";
  }

  destroy() {
    if (this.parseTimeout) clearTimeout(this.parseTimeout);
    if (this.saveTimeout) clearTimeout(this.saveTimeout);

    this.settingsHandler?.dispose();
    this.languageHandler?.dispose();

    if (this.editor) {
      this.editor.dispose();
      this.editor = null;
    }

    this.models.forEach((model) => model.dispose());
    this.models.clear();
    this.viewStates.clear();
    monaco.editor.getModels().forEach((m) => !m.isDisposed() && m.dispose());

    if (this.editorContainer) this.editorContainer.replaceChildren();
    this.editorContainer = null;
    this.pathDisplayEl = null;
    this.editorDiv = null;
    this.fileViewerDiv = null;
  }

  public show(): void {
    if (this.editorDiv) {
      this.editorDiv.style.display = "block";
    }
    if (this.pathDisplayEl) {
      this.pathDisplayEl.style.display = "flex";
    }
    if (this.fileViewerDiv) {
      this.fileViewerDiv.style.display = "none";
    }
  }

  public hide(): void {
    if (this.editorDiv) {
      this.editorDiv.style.display = "none";
    }
    if (this.pathDisplayEl) {
      this.pathDisplayEl.style.display = "none";
    }
    if (this.fileViewerDiv) {
      this.fileViewerDiv.style.display = "none";
    }
  }

  getEditorOptions(): monaco.editor.IStandaloneEditorConstructionOptions {
    const defaultOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
      automaticLayout: true,
      largeFileOptimizations: true,
      minimap: { enabled: false },
      fontSize: 14,
      lineNumbers: "on",
    };

    try {
      const SettingsRegistryManager = SettingsController.getInstance();

      const rulersStr = SettingsRegistryManager.get("editor.rulers") ?? "";
      const rulers = rulersStr
        ? rulersStr
            .split(",")
            .map((n: any) => parseInt(n.trim()))
            .filter((n: any) => !isNaN(n))
        : [];

      return {
        ...defaultOptions,
        fontSize: parseInt(
          SettingsRegistryManager.get("editor.fontSize") ?? "14"
        ),
        fontFamily:
          SettingsRegistryManager.get("editor.fontFamily") ??
          "'Consolas', 'Courier New', monospace",
        fontWeight:
          SettingsRegistryManager.get("editor.fontWeight") ?? "normal",
        lineHeight: parseFloat(
          SettingsRegistryManager.get("editor.lineHeight") ?? "0"
        ),
        letterSpacing: parseFloat(
          SettingsRegistryManager.get("editor.letterSpacing") ?? "0"
        ),
        tabSize: parseInt(SettingsRegistryManager.get("editor.tabSize") ?? "4"),
        insertSpaces:
          SettingsRegistryManager.get("editor.insertSpaces") === "true",
        detectIndentation:
          SettingsRegistryManager.get("editor.detectIndentation") !== "false",
        trimAutoWhitespace:
          SettingsRegistryManager.get("editor.trimAutoWhitespace") !== "false",
        wordWrap: SettingsRegistryManager.get("editor.wordWrap") ?? "off",
        wordWrapColumn: parseInt(
          SettingsRegistryManager.get("editor.wordWrapColumn") ?? "80"
        ),
        wrappingIndent:
          SettingsRegistryManager.get("editor.wrappingIndent") ?? "same",
        wrappingStrategy:
          SettingsRegistryManager.get("editor.wrappingStrategy") ?? "simple",
        minimap: {
          enabled:
            SettingsRegistryManager.get("editor.minimap.enabled") !== "false",
          side: SettingsRegistryManager.get("editor.minimap.side") ?? "right",
          size:
            SettingsRegistryManager.get("editor.minimap.size") ??
            "proportional",
          showSlider:
            SettingsRegistryManager.get("editor.minimap.showSlider") ??
            "mouseover",
        },
        lineNumbers: SettingsRegistryManager.get("editor.lineNumbers") ?? "on",
        lineNumbersMinChars: parseInt(
          SettingsRegistryManager.get("editor.lineNumbersMinChars") ?? "5"
        ),
        glyphMargin:
          SettingsRegistryManager.get("editor.glyphMargin") !== "false",
        folding: SettingsRegistryManager.get("editor.folding") !== "false",
        foldingStrategy:
          SettingsRegistryManager.get("editor.foldingStrategy") ?? "auto",
        foldingHighlight:
          SettingsRegistryManager.get("editor.foldingHighlight") !== "false",
        unfoldOnClickAfterEndOfLine:
          SettingsRegistryManager.get("editor.unfoldOnClickAfterEndOfLine") ===
          "true",
        showFoldingControls:
          SettingsRegistryManager.get("editor.showFoldingControls") ??
          "mouseover",
        cursorStyle:
          SettingsRegistryManager.get("editor.cursorStyle") ?? "line",
        cursorBlinking:
          SettingsRegistryManager.get("editor.cursorBlinking") ?? "blink",
        cursorSmoothCaretAnimation:
          SettingsRegistryManager.get("editor.cursorSmoothCaretAnimation") ??
          "off",
        cursorWidth: parseInt(
          SettingsRegistryManager.get("editor.cursorWidth") ?? "0"
        ),
        multiCursorModifier:
          SettingsRegistryManager.get("editor.multiCursorModifier") ?? "alt",
        multiCursorMergeOverlapping:
          SettingsRegistryManager.get("editor.multiCursorMergeOverlapping") !==
          "false",
        multiCursorPaste:
          SettingsRegistryManager.get("editor.multiCursorPaste") ?? "spread",
        accessibilitySupport:
          SettingsRegistryManager.get("editor.accessibilitySupport") ?? "auto",
        accessibilityPageSize: parseInt(
          SettingsRegistryManager.get("editor.accessibilityPageSize") ?? "10"
        ),
        quickSuggestions:
          SettingsRegistryManager.get("editor.quickSuggestions") !== "false",
        quickSuggestionsDelay: parseInt(
          SettingsRegistryManager.get("editor.quickSuggestionsDelay") ?? "10"
        ),
        parameterHints: {
          enabled:
            SettingsRegistryManager.get("editor.parameterHints.enabled") !==
            "false",
          cycle:
            SettingsRegistryManager.get("editor.parameterHints.cycle") ===
            "true",
        },
        autoClosingBrackets:
          SettingsRegistryManager.get("editor.autoClosingBrackets") ??
          "languageDefined",
        autoClosingQuotes:
          SettingsRegistryManager.get("editor.autoClosingQuotes") ??
          "languageDefined",
        autoClosingComments:
          SettingsRegistryManager.get("editor.autoClosingComments") ??
          "languageDefined",
        autoClosingOvertype:
          SettingsRegistryManager.get("editor.autoClosingOvertype") ?? "auto",
        autoClosingDelete:
          SettingsRegistryManager.get("editor.autoClosingDelete") ?? "auto",
        autoSurround:
          SettingsRegistryManager.get("editor.autoSurround") ??
          "languageDefined",
        autoIndent: SettingsRegistryManager.get("editor.autoIndent") ?? "full",
        formatOnType:
          SettingsRegistryManager.get("editor.formatOnType") === "true",
        formatOnPaste:
          SettingsRegistryManager.get("editor.formatOnPaste") === "true",
        renderWhitespace:
          SettingsRegistryManager.get("editor.renderWhitespace") ?? "none",
        renderControlCharacters:
          SettingsRegistryManager.get("editor.renderControlCharacters") ===
          "true",
        renderFinalNewline:
          SettingsRegistryManager.get("editor.renderFinalNewline") ?? "on",
        renderLineHighlight:
          SettingsRegistryManager.get("editor.renderLineHighlight") ?? "line",
        renderLineHighlightOnlyWhenFocus:
          SettingsRegistryManager.get(
            "editor.renderLineHighlightOnlyWhenFocus"
          ) === "true",
        rulers,
        codeLens: SettingsRegistryManager.get("editor.codeLens") !== "false",
        codeLensFontFamily:
          SettingsRegistryManager.get("editor.codeLensFontFamily") || undefined,
        codeLensFontSize:
          parseInt(
            SettingsRegistryManager.get("editor.codeLensFontSize") ?? "0"
          ) || undefined,
        contextmenu:
          SettingsRegistryManager.get("editor.contextmenu") !== "false",
        mouseWheelZoom:
          SettingsRegistryManager.get("editor.mouseWheelZoom") === "true",
        mouseWheelScrollSensitivity: parseFloat(
          SettingsRegistryManager.get("editor.mouseWheelScrollSensitivity") ??
            "1"
        ),
        fastScrollSensitivity: parseInt(
          SettingsRegistryManager.get("editor.fastScrollSensitivity") ?? "5"
        ),
        scrollBeyondLastLine:
          SettingsRegistryManager.get("editor.scrollBeyondLastLine") !==
          "false",
        scrollBeyondLastColumn: parseInt(
          SettingsRegistryManager.get("editor.scrollBeyondLastColumn") ?? "5"
        ),
        smoothScrolling:
          SettingsRegistryManager.get("editor.smoothScrolling") === "true",
        cursorSurroundingLines: parseInt(
          SettingsRegistryManager.get("editor.cursorSurroundingLines") ?? "0"
        ),
        cursorSurroundingLinesStyle:
          SettingsRegistryManager.get("editor.cursorSurroundingLinesStyle") ??
          "default",
        hideCursorInOverviewRuler:
          SettingsRegistryManager.get("editor.hideCursorInOverviewRuler") ===
          "true",
        overviewRulerLanes: parseInt(
          SettingsRegistryManager.get("editor.overviewRulerLanes") ?? "3"
        ),
        overviewRulerBorder:
          SettingsRegistryManager.get("editor.overviewRulerBorder") !== "false",
        links: SettingsRegistryManager.get("editor.links") !== "false",
        colorDecorators:
          SettingsRegistryManager.get("editor.colorDecorators") !== "false",
        columnSelection:
          SettingsRegistryManager.get("editor.columnSelection") === "true",
        dragAndDrop:
          SettingsRegistryManager.get("editor.dragAndDrop") !== "false",
        copyWithSyntaxHighlighting:
          SettingsRegistryManager.get("editor.copyWithSyntaxHighlighting") !==
          "false",
        emptySelectionClipboard:
          SettingsRegistryManager.get("editor.emptySelectionClipboard") !==
          "false",
        useTabStops:
          SettingsRegistryManager.get("editor.useTabStops") !== "false",
        wordSeparators:
          SettingsRegistryManager.get("editor.wordSeparators") ??
          "`~!@#$%^&*()-=+[{]}\\|;:'\",.<>/?",
        largeFileOptimizations:
          SettingsRegistryManager.get("editor.largeFileOptimizations") !==
          "false",
      };
    } catch (error) {
      return defaultOptions;
    }
  }

  public getIndent(): { spaces: number } {
    return {
      spaces: this.getEditorOptions().tabSize ?? 2,
    };
  }

  public getEditor() {
    return this.editor;
  }

  public getLineCols() {
    const position = this.editor?.getPosition();
    if (!position) return null;
    return { line: position.lineNumber, column: position.column };
  }
}
