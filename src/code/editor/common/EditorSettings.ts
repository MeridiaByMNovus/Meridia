import * as monaco from "monaco-editor";
import { SettingsController } from "../../workbench/browser/common/controller/SettingsController.js";

export class EditorSettings {
  private settingsController = SettingsController.getInstance();
  private settingsWatchers: (() => void)[] = [];
  private editor: monaco.editor.IStandaloneCodeEditor;

  constructor(editor: monaco.editor.IStandaloneCodeEditor) {
    this.editor = editor;
  }

  public async setupSettingsWatchers() {
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
      const currentValue = this.settingsController.get(settingKey);
      if (currentValue !== undefined) {
        this.updateEditorOption(settingKey, currentValue);
      }
    });

    editorSettings.forEach((settingKey) => {
      const watcher = this.settingsController.onChange(
        settingKey,
        (newValue: any) => {
          this.updateEditorOption(settingKey, newValue);
        }
      );
      this.settingsWatchers.push(watcher);
    });
  }

  private updateEditorOption(settingKey: string, newValue: any) {
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
        break;
    }

    if (Object.keys(updateOptions).length > 0) {
      this.editor.updateOptions(updateOptions);
    }
  }

  public dispose() {
    this.settingsWatchers.forEach((unwatch) => unwatch());
    this.settingsWatchers = [];
  }
}
