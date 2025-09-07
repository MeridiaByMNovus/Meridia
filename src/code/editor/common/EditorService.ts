import * as monaco from "monaco-editor";
import debounce from "lodash.debounce";
import { themeService } from "../../workbench/common/classInstances/themeInstance.js";
import { dispatch, store } from "../../workbench/common/store/store.js";
import { update_editor_tabs } from "../../workbench/common/store/mainSlice.js";
import { PyrightProvider } from "../../platform/extension/pyright-api.js";
import { SettingsController } from "../../workbench/browser/common/controller/SettingsController.js";
import {
  goToLineIcon,
  quickOutlineIcon,
  searchIcon,
  triggerSuggestIcon,
} from "../../workbench/common/svgIcons.js";
import { StructureController } from "../../workbench/browser/common/controller/StructureController.js";

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
  private parseTimeout: NodeJS.Timeout | null = null;
  private isParsingStructure = false;
  private lastParsedContent = "";
  private lastContentHash = "";
  private isSaving = false;
  private saveTimeout: NodeJS.Timeout | null = null;

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

  private async parseStructureForPython(content: string): Promise<void> {
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
        } catch (parseError) {}
      }
    } catch (error) {
    } finally {
      this.isParsingStructure = false;
    }
  }

  private scheduleStructureParsing(content: string, language?: string): void {
    if (language !== "python") return;

    const contentHash = this.generateContentHash(content);
    if (contentHash === this.lastContentHash) return;

    if (this.isSaving) return;

    if (this.parseTimeout) {
      clearTimeout(this.parseTimeout);
    }

    this.parseTimeout = setTimeout(() => {
      this.parseStructureForPython(content);
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

  private isNonCodeFile(path: string): boolean {
    return this.nonCodeExtensions.has(this.getFileExtension(path));
  }

  private async initializePyrightProvider() {
    if (!this.editor) return;

    if (!globalPyrightProvider) {
      globalPyrightProvider = new PyrightProvider(this.editor);
      const provider = globalPyrightProvider.init();
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
    this.editor = monaco.editor.create(this.editorDiv, {
      automaticLayout: true,
    });

    this.editor.updateOptions(editorOptions);

    this.setupSettingsWatchers();

    this.initializePyrightProvider();
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

  async setupSettingsWatchers(): Promise<void> {
    try {
      const { SettingsController } = await import(
        "../../workbench/browser/common/controller/SettingsController.js"
      );
      const settingsController = SettingsController.getInstance();

      const editorSettings = [
        "editor.fontSize",
        "editor.fontFamily",
        "editor.fontWeight",
        "editor.lineHeight",
        "editor.letterSpacing",
        "editor.tabSize",
        "editor.insertSpaces",
        "editor.detectIndentation",
        "editor.trimAutoWhitespace",
        "editor.wordWrap",
        "editor.wordWrapColumn",
        "editor.wrappingIndent",
        "editor.wrappingStrategy",
        "editor.minimap.enabled",
        "editor.minimap.side",
        "editor.minimap.size",
        "editor.minimap.showSlider",
        "editor.lineNumbers",
        "editor.lineNumbersMinChars",
        "editor.glyphMargin",
        "editor.folding",
        "editor.foldingStrategy",
        "editor.foldingHighlight",
        "editor.unfoldOnClickAfterEndOfLine",
        "editor.showFoldingControls",
        "editor.cursorStyle",
        "editor.cursorBlinking",
        "editor.cursorSmoothCaretAnimation",
        "editor.cursorWidth",
        "editor.multiCursorModifier",
        "editor.multiCursorMergeOverlapping",
        "editor.multiCursorPaste",
        "editor.accessibilitySupport",
        "editor.accessibilityPageSize",
        "editor.quickSuggestions",
        "editor.quickSuggestionsDelay",
        "editor.parameterHints.enabled",
        "editor.parameterHints.cycle",
        "editor.autoClosingBrackets",
        "editor.autoClosingQuotes",
        "editor.autoClosingComments",
        "editor.autoClosingOvertype",
        "editor.autoClosingDelete",
        "editor.autoSurround",
        "editor.autoIndent",
        "editor.formatOnType",
        "editor.formatOnPaste",
        "editor.renderWhitespace",
        "editor.renderControlCharacters",
        "editor.renderFinalNewline",
        "editor.renderLineHighlight",
        "editor.renderLineHighlightOnlyWhenFocus",
        "editor.rulers",
        "editor.codeLens",
        "editor.codeLensFontFamily",
        "editor.codeLensFontSize",
        "editor.lightbulb.enabled",
        "editor.contextmenu",
        "editor.mouseWheelZoom",
        "editor.mouseWheelScrollSensitivity",
        "editor.fastScrollSensitivity",
        "editor.scrollBeyondLastLine",
        "editor.scrollBeyondLastColumn",
        "editor.smoothScrolling",
        "editor.cursorSurroundingLines",
        "editor.cursorSurroundingLinesStyle",
        "editor.hideCursorInOverviewRuler",
        "editor.overviewRulerLanes",
        "editor.overviewRulerBorder",
        "editor.links",
        "editor.colorDecorators",
        "editor.columnSelection",
        "editor.dragAndDrop",
        "editor.copyWithSyntaxHighlighting",
        "editor.emptySelectionClipboard",
        "editor.useTabStops",
        "editor.wordSeparators",
        "editor.largeFileOptimizations",
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

    const updateOptions: any = {};
    const model = this.editor.getModel();

    switch (settingKey) {
      case "editor.fontSize":
        updateOptions.fontSize = parseInt(newValue) || 14;
        break;
      case "editor.fontFamily":
        updateOptions.fontFamily =
          newValue || "'Consolas', 'Courier New', monospace";
        break;
      case "editor.fontWeight":
        updateOptions.fontWeight = newValue || "normal";
        break;
      case "editor.lineHeight":
        updateOptions.lineHeight = parseFloat(newValue) || 0;
        break;
      case "editor.letterSpacing":
        updateOptions.letterSpacing = parseFloat(newValue) || 0;
        break;
      case "editor.tabSize":
        const tabSize = parseInt(newValue) || 4;
        model?.updateOptions({ tabSize });
        break;
      case "editor.insertSpaces":
        const insertSpaces = newValue === true || newValue === "true";
        model?.updateOptions({ insertSpaces });
        break;
      case "editor.detectIndentation":
        updateOptions.detectIndentation =
          newValue === true || newValue === "true";
        break;
      case "editor.trimAutoWhitespace":
        updateOptions.trimAutoWhitespace =
          newValue !== false && newValue !== "false";
        break;
      case "editor.wordWrap":
        updateOptions.wordWrap = newValue || "off";
        break;
      case "editor.wordWrapColumn":
        updateOptions.wordWrapColumn = parseInt(newValue) || 80;
        break;
      case "editor.wrappingIndent":
        updateOptions.wrappingIndent = newValue || "same";
        break;
      case "editor.wrappingStrategy":
        updateOptions.wrappingStrategy = newValue || "simple";
        break;
      case "editor.minimap.enabled":
        updateOptions.minimap = {
          ...this.editor.getOptions().get(monaco.editor.EditorOption.minimap),
          enabled: newValue === true || newValue === "true",
        };
        break;
      case "editor.minimap.side":
        updateOptions.minimap = {
          ...this.editor.getOptions().get(monaco.editor.EditorOption.minimap),
          side: newValue || "right",
        };
        break;
      case "editor.minimap.size":
        updateOptions.minimap = {
          ...this.editor.getOptions().get(monaco.editor.EditorOption.minimap),
          size: newValue || "proportional",
        };
        break;
      case "editor.minimap.showSlider":
        updateOptions.minimap = {
          ...this.editor.getOptions().get(monaco.editor.EditorOption.minimap),
          showSlider: newValue || "mouseover",
        };
        break;
      case "editor.lineNumbers":
        updateOptions.lineNumbers = newValue || "on";
        break;
      case "editor.lineNumbersMinChars":
        updateOptions.lineNumbersMinChars = parseInt(newValue) || 5;
        break;
      case "editor.glyphMargin":
        updateOptions.glyphMargin = newValue !== false && newValue !== "false";
        break;
      case "editor.folding":
        updateOptions.folding = newValue !== false && newValue !== "false";
        break;
      case "editor.foldingStrategy":
        updateOptions.foldingStrategy = newValue || "auto";
        break;
      case "editor.foldingHighlight":
        updateOptions.foldingHighlight =
          newValue !== false && newValue !== "false";
        break;
      case "editor.unfoldOnClickAfterEndOfLine":
        updateOptions.unfoldOnClickAfterEndOfLine =
          newValue === true || newValue === "true";
        break;
      case "editor.showFoldingControls":
        updateOptions.showFoldingControls = newValue || "mouseover";
        break;
      case "editor.cursorStyle":
        updateOptions.cursorStyle = newValue || "line";
        break;
      case "editor.cursorBlinking":
        updateOptions.cursorBlinking = newValue || "blink";
        break;
      case "editor.cursorSmoothCaretAnimation":
        updateOptions.cursorSmoothCaretAnimation = newValue || "off";
        break;
      case "editor.cursorWidth":
        updateOptions.cursorWidth = parseInt(newValue) || 0;
        break;
      case "editor.multiCursorModifier":
        updateOptions.multiCursorModifier = newValue || "alt";
        break;
      case "editor.multiCursorMergeOverlapping":
        updateOptions.multiCursorMergeOverlapping =
          newValue !== false && newValue !== "false";
        break;
      case "editor.multiCursorPaste":
        updateOptions.multiCursorPaste = newValue || "spread";
        break;
      case "editor.accessibilitySupport":
        updateOptions.accessibilitySupport = newValue || "auto";
        break;
      case "editor.accessibilityPageSize":
        updateOptions.accessibilityPageSize = parseInt(newValue) || 10;
        break;
      case "editor.quickSuggestions":
        updateOptions.quickSuggestions =
          newValue !== false && newValue !== "false";
        break;
      case "editor.quickSuggestionsDelay":
        updateOptions.quickSuggestionsDelay = parseInt(newValue) || 10;
        break;
      case "editor.parameterHints.enabled":
        updateOptions.parameterHints = {
          ...this.editor
            .getOptions()
            .get(monaco.editor.EditorOption.parameterHints),
          enabled: newValue !== false && newValue !== "false",
        };
        break;
      case "editor.parameterHints.cycle":
        updateOptions.parameterHints = {
          ...this.editor
            .getOptions()
            .get(monaco.editor.EditorOption.parameterHints),
          cycle: newValue === true || newValue === "true",
        };
        break;
      case "editor.autoClosingBrackets":
        updateOptions.autoClosingBrackets = newValue || "languageDefined";
        break;
      case "editor.autoClosingQuotes":
        updateOptions.autoClosingQuotes = newValue || "languageDefined";
        break;
      case "editor.autoClosingComments":
        updateOptions.autoClosingComments = newValue || "languageDefined";
        break;
      case "editor.autoClosingOvertype":
        updateOptions.autoClosingOvertype = newValue || "auto";
        break;
      case "editor.autoClosingDelete":
        updateOptions.autoClosingDelete = newValue || "auto";
        break;
      case "editor.autoSurround":
        updateOptions.autoSurround = newValue || "languageDefined";
        break;
      case "editor.autoIndent":
        updateOptions.autoIndent = newValue || "full";
        break;
      case "editor.formatOnType":
        updateOptions.formatOnType = newValue === true || newValue === "true";
        break;
      case "editor.formatOnPaste":
        updateOptions.formatOnPaste = newValue === true || newValue === "true";
        break;
      case "editor.renderWhitespace":
        updateOptions.renderWhitespace = newValue || "none";
        break;
      case "editor.renderControlCharacters":
        updateOptions.renderControlCharacters =
          newValue === true || newValue === "true";
        break;
      case "editor.renderFinalNewline":
        updateOptions.renderFinalNewline = newValue || "on";
        break;
      case "editor.renderLineHighlight":
        updateOptions.renderLineHighlight = newValue || "line";
        break;
      case "editor.renderLineHighlightOnlyWhenFocus":
        updateOptions.renderLineHighlightOnlyWhenFocus =
          newValue === true || newValue === "true";
        break;
      case "editor.rulers":
        const rulersStr = newValue || "";
        const rulers = rulersStr
          ? rulersStr
              .split(",")
              .map((n: string) => parseInt(n.trim()))
              .filter((n: number) => !isNaN(n))
          : [];
        updateOptions.rulers = rulers;
        break;
      case "editor.codeLens":
        updateOptions.codeLens = newValue !== false && newValue !== "false";
        break;
      case "editor.codeLensFontFamily":
        updateOptions.codeLensFontFamily = newValue || undefined;
        break;
      case "editor.codeLensFontSize":
        updateOptions.codeLensFontSize = parseInt(newValue) || undefined;
        break;
      case "editor.lightbulb.enabled":
        updateOptions.lightbulb = {
          enabled: newValue !== false && newValue !== "false",
        };
        break;
      case "editor.contextmenu":
        updateOptions.contextmenu = newValue !== false && newValue !== "false";
        break;
      case "editor.mouseWheelZoom":
        updateOptions.mouseWheelZoom = newValue === true || newValue === "true";
        break;
      case "editor.mouseWheelScrollSensitivity":
        updateOptions.mouseWheelScrollSensitivity = parseFloat(newValue) || 1;
        break;
      case "editor.fastScrollSensitivity":
        updateOptions.fastScrollSensitivity = parseInt(newValue) || 5;
        break;
      case "editor.scrollBeyondLastLine":
        updateOptions.scrollBeyondLastLine =
          newValue !== false && newValue !== "false";
        break;
      case "editor.scrollBeyondLastColumn":
        updateOptions.scrollBeyondLastColumn = parseInt(newValue) || 5;
        break;
      case "editor.smoothScrolling":
        updateOptions.smoothScrolling =
          newValue === true || newValue === "true";
        break;
      case "editor.cursorSurroundingLines":
        updateOptions.cursorSurroundingLines = parseInt(newValue) || 0;
        break;
      case "editor.cursorSurroundingLinesStyle":
        updateOptions.cursorSurroundingLinesStyle = newValue || "default";
        break;
      case "editor.hideCursorInOverviewRuler":
        updateOptions.hideCursorInOverviewRuler =
          newValue === true || newValue === "true";
        break;
      case "editor.overviewRulerLanes":
        updateOptions.overviewRulerLanes = parseInt(newValue) || 3;
        break;
      case "editor.overviewRulerBorder":
        updateOptions.overviewRulerBorder =
          newValue !== false && newValue !== "false";
        break;
      case "editor.links":
        updateOptions.links = newValue !== false && newValue !== "false";
        break;
      case "editor.colorDecorators":
        updateOptions.colorDecorators =
          newValue !== false && newValue !== "false";
        break;
      case "editor.columnSelection":
        updateOptions.columnSelection =
          newValue === true || newValue === "true";
        break;
      case "editor.dragAndDrop":
        updateOptions.dragAndDrop = newValue !== false && newValue !== "false";
        break;
      case "editor.copyWithSyntaxHighlighting":
        updateOptions.copyWithSyntaxHighlighting =
          newValue !== false && newValue !== "false";
        break;
      case "editor.emptySelectionClipboard":
        updateOptions.emptySelectionClipboard =
          newValue !== false && newValue !== "false";
        break;
      case "editor.useTabStops":
        updateOptions.useTabStops = newValue !== false && newValue !== "false";
        break;
      case "editor.wordSeparators":
        updateOptions.wordSeparators =
          newValue || "`~!@#$%^&*()-=+[{]}\\|;:'\",.<>/?";
        break;
      case "editor.largeFileOptimizations":
        updateOptions.largeFileOptimizations =
          newValue !== false && newValue !== "false";
        break;
      case "workbench.colorTheme":
        this.updateEditorTheme();
        this.updateFileViewerTheme();
        break;
    }

    if (Object.keys(updateOptions).length > 0) {
      this.editor.updateOptions(updateOptions);
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
    if (this.pathDisplayEl) {
      this.pathDisplayEl.style.display = "flex";
    }
  }

  private showFileViewer(): void {
    if (this.editorDiv) {
      this.editorDiv.style.display = "none";
    }
    if (this.fileViewerDiv) {
      this.fileViewerDiv.style.display = "block";
    }
    if (this.pathDisplayEl) {
      this.pathDisplayEl.style.display = "flex";
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
      const imageData = await window.filesystem.readFileSync(path, "utf-8");
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
    } catch (error) {
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

    const watcher = window.watch.watchFile(filePath);

    window.ipc.on(`fileChanged-${filePath}`, () => {
      console.log("content changed");
    });

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

    if (tab.language === "python") {
      this.structureController.reset();
      this.lastParsedContent = "";
      this.lastContentHash = "";
      this.scheduleStructureParsing(tab.editorContent ?? "", tab.language);
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

    const debouncedContentChange = debounce((content: string) => {
      if (!this.isSaving) {
        this.scheduleStructureParsing(content, tab.language);
      }
    }, 100);

    this.editor.onDidChangeModelContent((e) => {
      markFileTouched();

      const currentModel = this.editor?.getModel();
      if (currentModel && tab.language === "python") {
        const currentContent = currentModel.getValue();
        debouncedContentChange(currentContent);
      }
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

  destroy() {
    if (this.parseTimeout) {
      clearTimeout(this.parseTimeout);
      this.parseTimeout = null;
    }

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }

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

  private applyModelSettings(model: monaco.editor.ITextModel): void {
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
    this.isSaving = true;

    const newDataPath = this.normalizePath(data.path);
    window.filesystem.save_file({ path: newDataPath, content: data.content });

    const state = store.getState();
    const model_editing_index = state.main.editor_tabs.findIndex(
      (file) => this.normalizePath(file.uri as string) === newDataPath
    );

    if (model_editing_index !== -1) {
      const updated_files = [...state.main.editor_tabs];
      updated_files[model_editing_index] = {
        ...updated_files[model_editing_index],
        is_touched: false,
      };
      dispatch(update_editor_tabs(updated_files));
    }

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.isSaving = false;
    }, 500);
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
      this.editor = monaco.editor.create(this.editorDiv, {
        automaticLayout: true,
      });

      this.editor.updateOptions(editorOptions);

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
      return "";
    }

    try {
      const selection = this.editor.getSelection();
      const model = this.editor.getModel();

      if (!selection || !model) {
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
      return "";
    }
  }

  public hasSelection(): boolean {
    if (!this.editor) return false;

    try {
      const selection = this.editor.getSelection();
      return selection ? !selection.isEmpty() : false;
    } catch (error) {
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
      return { hasSelection: false, text: "" };
    }
  }
}

export class EditorService extends EditorCore {}
