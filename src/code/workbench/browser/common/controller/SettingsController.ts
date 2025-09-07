import { SettingsRegistryManager } from "../../../common/registery/SettingsRegistery.js";
import { themeService } from "../../../common/classInstances/themeInstance.js";

export interface SettingOption {
  label: string;
  value: string | number | boolean;
  description?: string;
}

export interface Setting {
  id: string;
  title: string;
  description?: string;
  type: "select" | "toggle" | "input" | "number" | "color" | "range";
  category: string;
  defaultValue: any;
  options?: SettingOption[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

export interface SettingsCategory {
  id: string;
  title: string;
  icon: string;
  description?: string;
}

export interface SettingsConfigJson {
  categories: SettingsCategory[];
  settings: Setting[];
}

export class SettingsController {
  private static instance: SettingsController;
  private listeners = new Map<string, Set<(value: any) => void>>();
  private settingsConfig: Setting[] = [];
  private categories: SettingsCategory[] = [];

  static getInstance(): SettingsController {
    if (!SettingsController.instance) {
      SettingsController.instance = new SettingsController();
    }
    return SettingsController.instance;
  }

  constructor() {
    this.loadSettingsFromJson();
    this.initializeDefaultSettings();
  }

  private async loadSettingsFromJson() {
    this.loadInlineSettingsConfig();
  }

  private initializeDefaultSettings(): void {
    this.settingsConfig.forEach((setting) => {
      if (!SettingsRegistryManager.has(setting.id)) {
        SettingsRegistryManager.set(setting.id, setting.defaultValue);
        console.log(
          `Initialized default setting: ${setting.id} = ${setting.defaultValue}`
        );
      }
    });
  }

  private loadInlineSettingsConfig() {
    this.categories = [
      {
        id: "editor",
        title: "Editor",
        icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
      </svg>`,
        description: "Customize editor behavior and appearance",
      },
      {
        id: "workbench",
        title: "Workbench",
        icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z"/>
      </svg>`,
        description: "Control the appearance and layout of the workbench",
      },
      {
        id: "terminal",
        title: "Terminal",
        icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 18V8h16v10H4z"/>
        <path d="M6 10l4 2-4 2z"/>
        <path d="M12 14h6v2h-6z"/>
      </svg>`,
        description: "Configure terminal settings and behavior",
      },
      {
        id: "theme",
        title: "Theme",
        icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M12 18c-.89 0-1.74-.19-2.5-.56C11.56 16.5 13 14.42 13 12s-1.44-4.5-3.5-5.44C10.26 6.19 11.11 6 12 6c3.31 0 6 2.69 6 6s-2.69 6-6 6z"/>
      </svg>`,
        description: "Choose and customize your color theme",
      },
      {
        id: "files",
        title: "Files",
        icon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12V8l-6-6z"/>
      </svg>`,
        description: "Control file saving and auto-save options",
      },
    ];

    this.settingsConfig = [
      // ===== Complete Editor Settings =====
      {
        id: "editor.fontSize",
        title: "Font Size",
        description: "Controls the font size in pixels",
        type: "number",
        category: "editor",
        defaultValue: 14,
        min: 8,
        max: 40,
        step: 1,
      },
      {
        id: "editor.fontFamily",
        title: "Font Family",
        description: "Controls the font family",
        type: "input",
        category: "editor",
        defaultValue: "'Consolas', 'Courier New', monospace",
        placeholder: "Font family name",
      },
      {
        id: "editor.fontWeight",
        title: "Font Weight",
        description: "Controls the font weight",
        type: "select",
        category: "editor",
        defaultValue: "normal",
        options: [
          { label: "Normal", value: "normal" },
          { label: "Bold", value: "bold" },
          { label: "100", value: "100" },
          { label: "200", value: "200" },
          { label: "300", value: "300" },
          { label: "400", value: "400" },
          { label: "500", value: "500" },
          { label: "600", value: "600" },
          { label: "700", value: "700" },
          { label: "800", value: "800" },
          { label: "900", value: "900" },
        ],
      },
      {
        id: "editor.lineHeight",
        title: "Line Height",
        description: "Controls the line height",
        type: "number",
        category: "editor",
        defaultValue: 0,
        min: 0,
        max: 8,
        step: 0.1,
      },
      {
        id: "editor.letterSpacing",
        title: "Letter Spacing",
        description: "Controls the letter spacing",
        type: "number",
        category: "editor",
        defaultValue: 0,
        min: -5,
        max: 20,
        step: 0.1,
      },
      {
        id: "editor.tabSize",
        title: "Tab Size",
        description: "The number of spaces a tab is equal to",
        type: "number",
        category: "editor",
        defaultValue: 4,
        min: 1,
        max: 8,
        step: 1,
      },
      {
        id: "editor.insertSpaces",
        title: "Insert Spaces",
        description: "Insert spaces when pressing Tab",
        type: "toggle",
        category: "editor",
        defaultValue: true,
      },
      {
        id: "editor.detectIndentation",
        title: "Detect Indentation",
        description: "Automatically detect indentation from file content",
        type: "toggle",
        category: "editor",
        defaultValue: true,
      },
      {
        id: "editor.trimAutoWhitespace",
        title: "Trim Auto Whitespace",
        description: "Remove trailing auto inserted whitespace",
        type: "toggle",
        category: "editor",
        defaultValue: true,
      },
      {
        id: "editor.wordWrap",
        title: "Word Wrap",
        description: "Controls how lines should wrap",
        type: "select",
        category: "editor",
        defaultValue: "off",
        options: [
          { label: "Off", value: "off" },
          { label: "On", value: "on" },
          { label: "Word Boundary", value: "wordWrapColumn" },
          { label: "Bounded", value: "bounded" },
        ],
      },
      {
        id: "editor.wordWrapColumn",
        title: "Word Wrap Column",
        description:
          "Controls the wrapping column when word wrap is set to column",
        type: "number",
        category: "editor",
        defaultValue: 80,
        min: 1,
        max: 200,
        step: 1,
      },
      {
        id: "editor.wrappingIndent",
        title: "Wrapping Indent",
        description: "Controls the indentation of wrapped lines",
        type: "select",
        category: "editor",
        defaultValue: "same",
        options: [
          { label: "None", value: "none" },
          { label: "Same", value: "same" },
          { label: "Indent", value: "indent" },
          { label: "Deep Indent", value: "deepIndent" },
        ],
      },
      {
        id: "editor.wrappingStrategy",
        title: "Wrapping Strategy",
        description: "Controls the algorithm that computes wrapping points",
        type: "select",
        category: "editor",
        defaultValue: "simple",
        options: [
          { label: "Simple", value: "simple" },
          { label: "Advanced", value: "advanced" },
        ],
      },
      {
        id: "editor.minimap.enabled",
        title: "Minimap",
        description: "Controls whether the minimap is shown",
        type: "toggle",
        category: "editor",
        defaultValue: true,
      },
      {
        id: "editor.minimap.side",
        title: "Minimap Side",
        description: "Controls the side where to render the minimap",
        type: "select",
        category: "editor",
        defaultValue: "right",
        options: [
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
        ],
      },
      {
        id: "editor.minimap.size",
        title: "Minimap Size",
        description: "Controls the size of the minimap",
        type: "select",
        category: "editor",
        defaultValue: "proportional",
        options: [
          { label: "Proportional", value: "proportional" },
          { label: "Fill", value: "fill" },
          { label: "Fit", value: "fit" },
        ],
      },
      {
        id: "editor.minimap.showSlider",
        title: "Minimap Show Slider",
        description: "Controls when the minimap slider appears",
        type: "select",
        category: "editor",
        defaultValue: "mouseover",
        options: [
          { label: "Always", value: "always" },
          { label: "Mouseover", value: "mouseover" },
        ],
      },
      {
        id: "editor.lineNumbers",
        title: "Line Numbers",
        description: "Controls how line numbers are displayed",
        type: "select",
        category: "editor",
        defaultValue: "on",
        options: [
          { label: "On", value: "on" },
          { label: "Relative", value: "relative" },
          { label: "Interval", value: "interval" },
          { label: "Off", value: "off" },
        ],
      },
      {
        id: "editor.lineNumbersMinChars",
        title: "Line Numbers Min Characters",
        description:
          "Controls the minimal number of visible leading and trailing lines surrounding the cursor",
        type: "number",
        category: "editor",
        defaultValue: 5,
        min: 1,
        max: 300,
        step: 1,
      },
      {
        id: "editor.glyphMargin",
        title: "Glyph Margin",
        description: "Enable the rendering of the glyph margin",
        type: "toggle",
        category: "editor",
        defaultValue: true,
      },
      {
        id: "editor.folding",
        title: "Code Folding",
        description: "Enable code folding",
        type: "toggle",
        category: "editor",
        defaultValue: true,
      },
      {
        id: "editor.foldingStrategy",
        title: "Folding Strategy",
        description: "Selects the folding strategy",
        type: "select",
        category: "editor",
        defaultValue: "auto",
        options: [
          { label: "Auto", value: "auto" },
          { label: "Indentation", value: "indentation" },
        ],
      },
      {
        id: "editor.foldingHighlight",
        title: "Folding Highlight",
        description: "Enable highlight for folded regions",
        type: "toggle",
        category: "editor",
        defaultValue: true,
      },
      {
        id: "editor.unfoldOnClickAfterEndOfLine",
        title: "Unfold On Click After End Of Line",
        description:
          "Unfold collapsed regions when clicking after the end of line",
        type: "toggle",
        category: "editor",
        defaultValue: false,
      },
      {
        id: "editor.showFoldingControls",
        title: "Show Folding Controls",
        description: "Controls when to show folding controls",
        type: "select",
        category: "editor",
        defaultValue: "mouseover",
        options: [
          { label: "Always", value: "always" },
          { label: "Never", value: "never" },
          { label: "Mouseover", value: "mouseover" },
        ],
      },
      {
        id: "editor.cursorStyle",
        title: "Cursor Style",
        description: "Controls the appearance of the text cursor",
        type: "select",
        category: "editor",
        defaultValue: "line",
        options: [
          { label: "Line", value: "line" },
          { label: "Block", value: "block" },
          { label: "Underline", value: "underline" },
          { label: "Line Thin", value: "line-thin" },
          { label: "Block Outline", value: "block-outline" },
          { label: "Underline Thin", value: "underline-thin" },
        ],
      },
      {
        id: "editor.cursorBlinking",
        title: "Cursor Blinking",
        description: "Controls the blinking of the cursor",
        type: "select",
        category: "editor",
        defaultValue: "blink",
        options: [
          { label: "Blink", value: "blink" },
          { label: "Smooth", value: "smooth" },
          { label: "Phase", value: "phase" },
          { label: "Expand", value: "expand" },
          { label: "Solid", value: "solid" },
        ],
      },
      {
        id: "editor.cursorSmoothCaretAnimation",
        title: "Cursor Smooth Caret Animation",
        description: "Enable smooth caret animation",
        type: "select",
        category: "editor",
        defaultValue: "off",
        options: [
          { label: "Off", value: "off" },
          { label: "Explicit", value: "explicit" },
          { label: "On", value: "on" },
        ],
      },
      {
        id: "editor.cursorWidth",
        title: "Cursor Width",
        description:
          "Controls the width of the cursor when cursorStyle is set to line",
        type: "number",
        category: "editor",
        defaultValue: 0,
        min: 0,
        max: 6,
        step: 1,
      },
      {
        id: "editor.multiCursorModifier",
        title: "Multi Cursor Modifier",
        description: "The modifier to be used to add multiple cursors",
        type: "select",
        category: "editor",
        defaultValue: "alt",
        options: [
          { label: "Alt", value: "alt" },
          { label: "Ctrl Cmd", value: "ctrlCmd" },
        ],
      },
      {
        id: "editor.multiCursorMergeOverlapping",
        title: "Multi Cursor Merge Overlapping",
        description: "Merge multiple cursors when they are overlapping",
        type: "toggle",
        category: "editor",
        defaultValue: true,
      },
      {
        id: "editor.multiCursorPaste",
        title: "Multi Cursor Paste",
        description: "Configure pasting when multiple cursors are present",
        type: "select",
        category: "editor",
        defaultValue: "spread",
        options: [
          { label: "Spread", value: "spread" },
          { label: "Full", value: "full" },
        ],
      },
      {
        id: "editor.accessibilitySupport",
        title: "Accessibility Support",
        description:
          "Controls whether the editor should run in a mode optimized for screen readers",
        type: "select",
        category: "editor",
        defaultValue: "auto",
        options: [
          { label: "Auto", value: "auto" },
          { label: "On", value: "on" },
          { label: "Off", value: "off" },
        ],
      },
      {
        id: "editor.accessibilityPageSize",
        title: "Accessibility Page Size",
        description:
          "Controls the number of lines in the editor that can be read out by a screen reader",
        type: "number",
        category: "editor",
        defaultValue: 10,
        min: 1,
        max: 1000,
        step: 1,
      },
      {
        id: "editor.quickSuggestions",
        title: "Quick Suggestions",
        description:
          "Controls whether suggestions should automatically show up when typing trigger characters",
        type: "toggle",
        category: "editor",
        defaultValue: true,
      },
      {
        id: "editor.quickSuggestionsDelay",
        title: "Quick Suggestions Delay",
        description:
          "Controls the delay in ms after which quick suggestions will show up",
        type: "number",
        category: "editor",
        defaultValue: 10,
        min: 0,
        max: 1000,
        step: 10,
      },
      {
        id: "editor.parameterHints.enabled",
        title: "Parameter Hints",
        description: "Enable parameter hints",
        type: "toggle",
        category: "editor",
        defaultValue: true,
      },
      {
        id: "editor.parameterHints.cycle",
        title: "Parameter Hints Cycle",
        description:
          "Controls whether parameter hints menu cycles or closes when reaching the end",
        type: "toggle",
        category: "editor",
        defaultValue: false,
      },
      {
        id: "editor.autoClosingBrackets",
        title: "Auto Closing Brackets",
        description:
          "Controls whether the editor should automatically close brackets after the user adds an opening bracket",
        type: "select",
        category: "editor",
        defaultValue: "languageDefined",
        options: [
          { label: "Always", value: "always" },
          { label: "Language Defined", value: "languageDefined" },
          { label: "Before Whitespace", value: "beforeWhitespace" },
          { label: "Never", value: "never" },
        ],
      },
      {
        id: "editor.autoClosingQuotes",
        title: "Auto Closing Quotes",
        description:
          "Controls whether the editor should automatically close quotes after the user adds an opening quote",
        type: "select",
        category: "editor",
        defaultValue: "languageDefined",
        options: [
          { label: "Always", value: "always" },
          { label: "Language Defined", value: "languageDefined" },
          { label: "Before Whitespace", value: "beforeWhitespace" },
          { label: "Never", value: "never" },
        ],
      },
      {
        id: "editor.autoClosingComments",
        title: "Auto Closing Comments",
        description:
          "Controls whether the editor should automatically close comments after the user adds an opening comment",
        type: "select",
        category: "editor",
        defaultValue: "languageDefined",
        options: [
          { label: "Always", value: "always" },
          { label: "Language Defined", value: "languageDefined" },
          { label: "Before Whitespace", value: "beforeWhitespace" },
          { label: "Never", value: "never" },
        ],
      },
      {
        id: "editor.autoClosingOvertype",
        title: "Auto Closing Overtype",
        description:
          "Controls whether the editor should overtype closing quotes or brackets",
        type: "select",
        category: "editor",
        defaultValue: "auto",
        options: [
          { label: "Auto", value: "auto" },
          { label: "Always", value: "always" },
          { label: "Never", value: "never" },
        ],
      },
      {
        id: "editor.autoClosingDelete",
        title: "Auto Closing Delete",
        description:
          "Controls whether the editor should remove adjacent closing quotes or brackets when deleting",
        type: "select",
        category: "editor",
        defaultValue: "auto",
        options: [
          { label: "Auto", value: "auto" },
          { label: "Always", value: "always" },
          { label: "Never", value: "never" },
        ],
      },
      {
        id: "editor.autoSurround",
        title: "Auto Surround",
        description:
          "Controls whether the editor should automatically surround selections when typing quotes or brackets",
        type: "select",
        category: "editor",
        defaultValue: "languageDefined",
        options: [
          { label: "Language Defined", value: "languageDefined" },
          { label: "Never", value: "never" },
          { label: "Quotes", value: "quotes" },
          { label: "Brackets", value: "brackets" },
        ],
      },
      {
        id: "editor.autoIndent",
        title: "Auto Indent",
        description:
          "Controls whether the editor should automatically adjust the indentation",
        type: "select",
        category: "editor",
        defaultValue: "full",
        options: [
          { label: "None", value: "none" },
          { label: "Keep", value: "keep" },
          { label: "Brackets", value: "brackets" },
          { label: "Advanced", value: "advanced" },
          { label: "Full", value: "full" },
        ],
      },
      {
        id: "editor.formatOnType",
        title: "Format On Type",
        description:
          "Controls whether the editor should automatically format the line after typing",
        type: "toggle",
        category: "editor",
        defaultValue: false,
      },
      {
        id: "editor.formatOnPaste",
        title: "Format On Paste",
        description:
          "Controls whether the editor should automatically format the pasted content",
        type: "toggle",
        category: "editor",
        defaultValue: false,
      },
      {
        id: "editor.renderWhitespace",
        title: "Render Whitespace",
        description: "Controls how whitespace characters are rendered",
        type: "select",
        category: "editor",
        defaultValue: "none",
        options: [
          { label: "None", value: "none" },
          { label: "Boundary", value: "boundary" },
          { label: "Selection", value: "selection" },
          { label: "Trailing", value: "trailing" },
          { label: "All", value: "all" },
        ],
      },
      {
        id: "editor.renderControlCharacters",
        title: "Render Control Characters",
        description: "Controls whether control characters are rendered",
        type: "toggle",
        category: "editor",
        defaultValue: false,
      },
      {
        id: "editor.renderFinalNewline",
        title: "Render Final Newline",
        description:
          "Render last line number when the file ends with a newline",
        type: "select",
        category: "editor",
        defaultValue: "on",
        options: [
          { label: "On", value: "on" },
          { label: "Off", value: "off" },
          { label: "Dimmed", value: "dimmed" },
        ],
      },
      {
        id: "editor.renderLineHighlight",
        title: "Render Line Highlight",
        description: "Controls how the current line is highlighted",
        type: "select",
        category: "editor",
        defaultValue: "line",
        options: [
          { label: "None", value: "none" },
          { label: "Gutter", value: "gutter" },
          { label: "Line", value: "line" },
          { label: "All", value: "all" },
        ],
      },
      {
        id: "editor.renderLineHighlightOnlyWhenFocus",
        title: "Render Line Highlight Only When Focus",
        description:
          "Controls whether the line highlight should be rendered only when the editor is focused",
        type: "toggle",
        category: "editor",
        defaultValue: false,
      },
      {
        id: "editor.rulers",
        title: "Rulers",
        description:
          "Render vertical rulers after a certain number of monospace characters",
        type: "input",
        category: "editor",
        defaultValue: "",
        placeholder: "80,120 (comma-separated numbers)",
      },
      {
        id: "editor.codeLens",
        title: "Code Lens",
        description: "Controls whether the editor shows CodeLens",
        type: "toggle",
        category: "editor",
        defaultValue: true,
      },
      {
        id: "editor.codeLensFontFamily",
        title: "Code Lens Font Family",
        description: "Controls the font family for CodeLens",
        type: "input",
        category: "editor",
        defaultValue: "",
        placeholder: "Font family (leave empty for editor font)",
      },
      {
        id: "editor.codeLensFontSize",
        title: "Code Lens Font Size",
        description: "Controls the font size for CodeLens",
        type: "number",
        category: "editor",
        defaultValue: 0,
        min: 0,
        max: 40,
        step: 1,
      },
      {
        id: "editor.lightbulb.enabled",
        title: "Light Bulb",
        description: "Enables the code action lightbulb",
        type: "toggle",
        category: "editor",
        defaultValue: true,
      },
      {
        id: "editor.contextmenu",
        title: "Context Menu",
        description: "Enable context menu",
        type: "toggle",
        category: "editor",
        defaultValue: true,
      },
      {
        id: "editor.mouseWheelZoom",
        title: "Mouse Wheel Zoom",
        description:
          "Zoom the font when using the mouse wheel in combination with holding Ctrl",
        type: "toggle",
        category: "editor",
        defaultValue: false,
      },
      {
        id: "editor.mouseWheelScrollSensitivity",
        title: "Mouse Wheel Scroll Sensitivity",
        description:
          "A multiplier to be used on the deltaX and deltaY of mouse wheel scroll events",
        type: "number",
        category: "editor",
        defaultValue: 1,
        min: 0.1,
        max: 10,
        step: 0.1,
      },
      {
        id: "editor.fastScrollSensitivity",
        title: "Fast Scroll Sensitivity",
        description: "Scrolling speed multiplier when pressing Alt",
        type: "number",
        category: "editor",
        defaultValue: 5,
        min: 1,
        max: 20,
        step: 1,
      },
      {
        id: "editor.scrollBeyondLastLine",
        title: "Scroll Beyond Last Line",
        description:
          "Controls whether the editor will scroll beyond the last line",
        type: "toggle",
        category: "editor",
        defaultValue: true,
      },
      {
        id: "editor.scrollBeyondLastColumn",
        title: "Scroll Beyond Last Column",
        description:
          "Controls the number of extra characters beyond which the editor will scroll horizontally",
        type: "number",
        category: "editor",
        defaultValue: 5,
        min: 0,
        max: 100,
        step: 1,
      },
      {
        id: "editor.smoothScrolling",
        title: "Smooth Scrolling",
        description:
          "Controls whether the editor will scroll using an animation",
        type: "toggle",
        category: "editor",
        defaultValue: false,
      },
      {
        id: "editor.cursorSurroundingLines",
        title: "Cursor Surrounding Lines",
        description:
          "Controls the minimal number of visible leading and trailing lines surrounding the cursor",
        type: "number",
        category: "editor",
        defaultValue: 0,
        min: 0,
        max: 1000,
        step: 1,
      },
      {
        id: "editor.cursorSurroundingLinesStyle",
        title: "Cursor Surrounding Lines Style",
        description: "Controls when cursorSurroundingLines should be enforced",
        type: "select",
        category: "editor",
        defaultValue: "default",
        options: [
          { label: "Default", value: "default" },
          { label: "All", value: "all" },
        ],
      },
      {
        id: "editor.hideCursorInOverviewRuler",
        title: "Hide Cursor In Overview Ruler",
        description:
          "Controls whether the cursor should be hidden in the overview ruler",
        type: "toggle",
        category: "editor",
        defaultValue: false,
      },
      {
        id: "editor.overviewRulerLanes",
        title: "Overview Ruler Lanes",
        description:
          "The number of vertical lanes the overview ruler should render",
        type: "number",
        category: "editor",
        defaultValue: 3,
        min: 0,
        max: 10,
        step: 1,
      },
      {
        id: "editor.overviewRulerBorder",
        title: "Overview Ruler Border",
        description:
          "Controls whether a border should be drawn around the overview ruler",
        type: "toggle",
        category: "editor",
        defaultValue: true,
      },
      {
        id: "editor.links",
        title: "Links",
        description:
          "Controls whether the editor should detect links and make them clickable",
        type: "toggle",
        category: "editor",
        defaultValue: true,
      },
      {
        id: "editor.colorDecorators",
        title: "Color Decorators",
        description:
          "Controls whether the editor should render the inline color decorators and color picker",
        type: "toggle",
        category: "editor",
        defaultValue: true,
      },
      {
        id: "editor.columnSelection",
        title: "Column Selection",
        description:
          "Enable that the selection with the mouse and keys is doing column selection",
        type: "toggle",
        category: "editor",
        defaultValue: false,
      },
      {
        id: "editor.dragAndDrop",
        title: "Drag And Drop",
        description:
          "Controls whether the editor should allow moving selections via drag and drop",
        type: "toggle",
        category: "editor",
        defaultValue: true,
      },
      {
        id: "editor.copyWithSyntaxHighlighting",
        title: "Copy With Syntax Highlighting",
        description:
          "Controls whether syntax highlighting should be copied into the clipboard",
        type: "toggle",
        category: "editor",
        defaultValue: true,
      },
      {
        id: "editor.emptySelectionClipboard",
        title: "Empty Selection Clipboard",
        description:
          "Controls whether copying without a selection copies the current line",
        type: "toggle",
        category: "editor",
        defaultValue: true,
      },
      {
        id: "editor.useTabStops",
        title: "Use Tab Stops",
        description:
          "Pressing Tab will use the defined tab stops from the workspace",
        type: "toggle",
        category: "editor",
        defaultValue: true,
      },
      {
        id: "editor.wordSeparators",
        title: "Word Separators",
        description:
          "Characters that will be used as word separators when doing word related navigations or operations",
        type: "input",
        category: "editor",
        defaultValue: "`~!@#$%^&*()-=+[{]}\\|;:'\"`<>/?",
        placeholder: "Word separator characters",
      },
      {
        id: "editor.largeFileOptimizations",
        title: "Large File Optimizations",
        description:
          "Special handling for large files to disable certain memory intensive features",
        type: "toggle",
        category: "editor",
        defaultValue: true,
      },
      {
        id: "editor.automaticLayout",
        title: "Automatic Layout",
        description:
          "Enable that the editor will install an interval to check if its container dom node size has changed",
        type: "toggle",
        category: "editor",
        defaultValue: false,
      },

      // ===== Workbench Settings =====
      {
        id: "workbench.iconTheme",
        title: "File Icon Theme",
        description: "Specifies the file icon theme used in the workbench",
        type: "select",
        category: "workbench",
        defaultValue: "vs-seti",
        options: [
          { label: "Seti (Visual Studio Code)", value: "vs-seti" },
          { label: "Minimal", value: "minimal" },
          { label: "None", value: "none" },
        ],
      },
      {
        id: "workbench.sidebar.location",
        title: "Sidebar Location",
        description: "Controls the location of the sidebar",
        type: "select",
        category: "workbench",
        defaultValue: "left",
        options: [
          { label: "Left", value: "left" },
          { label: "Right", value: "right" },
        ],
      },
      {
        id: "workbench.activityBar.visible",
        title: "Activity Bar Visible",
        description: "Controls whether the activity bar is visible",
        type: "toggle",
        category: "workbench",
        defaultValue: true,
      },
      {
        id: "workbench.statusBar.visible",
        title: "Status Bar Visible",
        description: "Controls whether the status bar is visible",
        type: "toggle",
        category: "workbench",
        defaultValue: true,
      },
      {
        id: "workbench.startupAction",
        title: "Startup Action",
        description: "Controls what happens when the application starts",
        type: "select",
        category: "workbench",
        defaultValue: "welcomeTab",
        options: [
          { label: "Welcome Tab", value: "welcomeTab" },
          { label: "Empty Workspace", value: "emptyWorkspace" },
          { label: "Restore Previous Session", value: "restoreSession" },
        ],
      },
      {
        id: "workbench.enableAnimations",
        title: "Enable Animations",
        description: "Controls whether animations are enabled in the workbench",
        type: "toggle",
        category: "workbench",
        defaultValue: true,
      },

      // ===== Terminal Settings =====
      {
        id: "terminal.integrated.fontSize",
        title: "Font Size",
        description: "Controls the font size in pixels of the terminal",
        type: "number",
        category: "terminal",
        defaultValue: 14,
        min: 8,
        max: 40,
        step: 1,
      },
      {
        id: "terminal.integrated.fontFamily",
        title: "Font Family",
        description: "Controls the font family of the terminal",
        type: "input",
        category: "terminal",
        defaultValue: "'Consolas', 'Courier New', monospace",
        placeholder: "Font family name",
      },
      {
        id: "terminal.integrated.lineHeight",
        title: "Line Height",
        description: "Controls the line height of the terminal",
        type: "number",
        category: "terminal",
        defaultValue: 1.25,
        min: 0.8,
        max: 2.0,
        step: 0.05,
      },
      {
        id: "terminal.integrated.letterSpacing",
        title: "Letter Spacing",
        description: "Controls the letter spacing of the terminal",
        type: "number",
        category: "terminal",
        defaultValue: 0,
        min: -2,
        max: 5,
        step: 0.1,
      },
      {
        id: "terminal.integrated.scrollback",
        title: "Scrollback Lines",
        description:
          "Controls the maximum number of lines the terminal keeps in its buffer",
        type: "number",
        category: "terminal",
        defaultValue: 10000,
        min: 1000,
        max: 50000,
        step: 1000,
      },
      {
        id: "terminal.cursorBlink",
        title: "Cursor Blink",
        description: "Controls whether the terminal cursor blinks",
        type: "toggle",
        category: "terminal",
        defaultValue: true,
      },
      {
        id: "terminal.cursorStyle",
        title: "Cursor Style",
        description: "Controls the style of the terminal cursor",
        type: "select",
        category: "terminal",
        defaultValue: "block",
        options: [
          { label: "Block", value: "block" },
          { label: "Underline", value: "underline" },
          { label: "Bar", value: "bar" },
        ],
      },
      {
        id: "terminal.cursorWidth",
        title: "Cursor Width",
        description:
          "Controls the width of the cursor when cursor style is 'bar'",
        type: "number",
        category: "terminal",
        defaultValue: 1,
        min: 1,
        max: 10,
        step: 1,
      },
      {
        id: "terminal.integrated.shell.windows",
        title: "Shell (Windows)",
        description: "The path of the shell that the terminal uses on Windows",
        type: "select",
        category: "terminal",
        defaultValue: "powershell",
        options: [
          { label: "PowerShell", value: "powershell" },
          { label: "Command Prompt", value: "cmd" },
          { label: "Git Bash", value: "gitbash" },
        ],
      },
      {
        id: "terminal.integrated.shell.linux",
        title: "Shell (Linux)",
        description: "The path of the shell that the terminal uses on Linux",
        type: "input",
        category: "terminal",
        defaultValue: "/bin/bash",
        placeholder: "/bin/bash",
      },
      {
        id: "terminal.integrated.shell.osx",
        title: "Shell (macOS)",
        description: "The path of the shell that the terminal uses on macOS",
        type: "input",
        category: "terminal",
        defaultValue: "/bin/zsh",
        placeholder: "/bin/zsh",
      },
      {
        id: "terminal.integrated.smoothScrolling",
        title: "Smooth Scrolling",
        description: "Controls whether the terminal will scroll smoothly",
        type: "toggle",
        category: "terminal",
        defaultValue: false,
      },
      {
        id: "terminal.integrated.fastScrollSensitivity",
        title: "Fast Scroll Sensitivity",
        description: "Scrolling speed multiplier when pressing Alt",
        type: "number",
        category: "terminal",
        defaultValue: 5,
        min: 1,
        max: 20,
        step: 1,
      },
      {
        id: "terminal.integrated.mouseWheelScrollSensitivity",
        title: "Mouse Wheel Scroll Sensitivity",
        description: "Controls the scrolling speed of the mouse wheel",
        type: "number",
        category: "terminal",
        defaultValue: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
      },
      {
        id: "terminal.integrated.macOptionIsMeta",
        title: "Option Is Meta (macOS)",
        description: "Controls whether the Alt/Option key acts as the Meta key",
        type: "toggle",
        category: "terminal",
        defaultValue: false,
      },
      {
        id: "terminal.integrated.rightClickBehavior",
        title: "Right Click Behavior",
        description: "Controls how terminal responds to right click",
        type: "select",
        category: "terminal",
        defaultValue: "default",
        options: [
          { label: "Default", value: "default" },
          { label: "Copy on Select", value: "copyOnSelect" },
          { label: "Paste", value: "paste" },
          { label: "Select Word", value: "selectWord" },
        ],
      },
      {
        id: "terminal.integrated.drawBoldTextInBrightColors",
        title: "Draw Bold Text in Bright Colors",
        description: "Controls whether bold text uses bright colors",
        type: "toggle",
        category: "terminal",
        defaultValue: true,
      },
      {
        id: "terminal.integrated.allowTransparency",
        title: "Allow Transparency",
        description:
          "Controls whether the terminal allows transparent backgrounds",
        type: "toggle",
        category: "terminal",
        defaultValue: false,
      },
      {
        id: "terminal.integrated.minimumContrastRatio",
        title: "Minimum Contrast Ratio",
        description: "Controls the minimum contrast ratio for terminal colors",
        type: "number",
        category: "terminal",
        defaultValue: 1,
        min: 1,
        max: 21,
        step: 0.1,
      },
      {
        id: "terminal.integrated.tabStopWidth",
        title: "Tab Stop Width",
        description: "Controls the width of tab stops",
        type: "number",
        category: "terminal",
        defaultValue: 8,
        min: 1,
        max: 16,
        step: 1,
      },

      // ===== Theme Settings =====
      {
        id: "workbench.colorTheme",
        title: "Color Theme",
        description: "Specifies the color theme used in the workbench",
        type: "select",
        category: "theme",
        defaultValue: "Warm Sunset",
        options: themeService.getRegisteredThemes().map((themeName) => ({
          label: themeName
            .replace(/-/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase()),
          value: themeName,
        })),
      },

      // ===== Files Settings =====
      {
        id: "files.autoSave",
        title: "Auto Save",
        description: "Controls auto-save behavior",
        type: "select",
        category: "files",
        defaultValue: "off",
        options: [
          { label: "Off", value: "off" },
          { label: "After Delay", value: "afterDelay" },
          { label: "On Window Change", value: "onWindowChange" },
        ],
      },
      {
        id: "files.autoSaveDelay",
        title: "Auto Save Delay",
        description: "Controls the delay in ms when 'After Delay' is selected",
        type: "number",
        category: "files",
        defaultValue: 1000,
        min: 100,
        max: 10000,
        step: 100,
      },
    ];

    console.log("Settings loaded from inline configuration");
  }

  // Core Methods
  get<T = any>(key: string): T {
    return SettingsRegistryManager.get(key);
  }

  set(key: string, value: any): void {
    const oldValue = this.get(key);
    SettingsRegistryManager.set(key, value);

    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach((listener) => listener(value));
    }

    this.emitChange(key, value, oldValue);
  }

  createSetting(setting: Setting): void {
    const existingIndex = this.settingsConfig.findIndex(
      (s) => s.id === setting.id
    );

    if (existingIndex >= 0) {
      this.settingsConfig[existingIndex] = setting;
      console.log(`Updated existing setting configuration: ${setting.id}`);
    } else {
      this.settingsConfig.push(setting);
      console.log(`Created new setting configuration: ${setting.id}`);
    }

    if (!this.has(setting.id)) {
      this.set(setting.id, setting.defaultValue);
    }
  }

  has(key: string): boolean {
    return SettingsRegistryManager.has(key);
  }

  onChange(key: string, listener: (value: any) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(listener);

    return () => {
      const keyListeners = this.listeners.get(key);
      if (keyListeners) {
        keyListeners.delete(listener);
      }
    };
  }

  private emitChange(key: string, newValue: any, oldValue: any) {
    window.dispatchEvent(
      new CustomEvent("settings-changed", {
        detail: { key, newValue, oldValue },
      })
    );
  }

  // Configuration Methods
  getSettingsConfig(): Setting[] {
    return this.settingsConfig;
  }

  getCategories(): SettingsCategory[] {
    return this.categories;
  }

  getSettingsByCategory(categoryId: string): Setting[] {
    return this.settingsConfig.filter(
      (setting) => setting.category === categoryId
    );
  }

  // Reset Methods
  resetToDefault(key: string): void {
    const setting = this.settingsConfig.find((s) => s.id === key);
    if (setting) {
      this.set(key, setting.defaultValue);
    }
  }

  resetAllToDefault(): void {
    this.settingsConfig.forEach((setting) => {
      this.set(setting.id, setting.defaultValue);
    });
  }

  resetCategoryToDefault(categoryId: string): void {
    const categorySettings = this.getSettingsByCategory(categoryId);
    categorySettings.forEach((setting) => {
      this.set(setting.id, setting.defaultValue);
    });
  }

  // Export Methods
  exportSettings(): string {
    return JSON.stringify(SettingsRegistryManager.getAll(), null, 2);
  }

  exportConsoleSettings(): string {
    const consoleSettings = this.settingsConfig
      .filter((setting) => setting.category === "console")
      .reduce(
        (acc, setting) => {
          acc[setting.id] = this.get(setting.id);
          return acc;
        },
        {} as Record<string, any>
      );

    return JSON.stringify(consoleSettings, null, 2);
  }

  exportSettingsConfig(): string {
    const configData: SettingsConfigJson = {
      categories: this.categories,
      settings: this.settingsConfig,
    };
    return JSON.stringify(configData, null, 2);
  }

  exportCategorySettings(categoryId: string): string {
    const categorySettings = this.getSettingsByCategory(categoryId);
    const settingsData = categorySettings.reduce(
      (acc, setting) => {
        acc[setting.id] = this.get(setting.id);
        return acc;
      },
      {} as Record<string, any>
    );

    return JSON.stringify(settingsData, null, 2);
  }

  // Import Methods
  importSettings(jsonString: string): boolean {
    try {
      const imported = JSON.parse(jsonString);

      Object.entries(imported).forEach(([key, value]) => {
        if (!this.settingsConfig.some((s) => s.id === key)) {
          const newSetting: Setting = {
            id: key,
            title: key.split(".").pop() || key,
            type:
              typeof value === "boolean"
                ? "toggle"
                : typeof value === "number"
                  ? "number"
                  : "input",
            category: key.split(".")[0] || "general",
            defaultValue: value,
          };
          this.createSetting(newSetting);
        }

        this.set(key, value);
      });
      return true;
    } catch (error) {
      console.error("Failed to import settings:", error);
      return false;
    }
  }

  importSettingsConfig(jsonString: string): boolean {
    try {
      const configData: SettingsConfigJson = JSON.parse(jsonString);
      this.categories = configData.categories;
      this.settingsConfig = configData.settings;
      this.initializeDefaultSettings();
      return true;
    } catch (error) {
      console.error("Failed to import settings configuration:", error);
      return false;
    }
  }

  // File Operations
  async loadSettingsFromFile(file: File): Promise<boolean> {
    try {
      const text = await file.text();
      const configData: SettingsConfigJson = JSON.parse(text);

      this.categories = configData.categories;
      this.settingsConfig = configData.settings;

      this.initializeDefaultSettings();

      console.log("Settings configuration loaded from file");
      return true;
    } catch (error) {
      console.error("Failed to load settings from file:", error);
      return false;
    }
  }

  async importSettingsFromFile(file: File): Promise<boolean> {
    try {
      const text = await file.text();
      return this.importSettings(text);
    } catch (error) {
      console.error("Failed to import settings from file:", error);
      return false;
    }
  }

  async exportSettingsToFile(
    filename: string = "settings.json"
  ): Promise<void> {
    try {
      const settings = this.exportSettings();

      await window.ipc.invoke("save-settings-file", {
        filename,
        data: settings,
      });
      console.log(`Settings exported to ${filename}`);
    } catch (error) {
      console.error("Failed to export settings to file:", error);
      throw error;
    }
  }

  async exportConsoleSettingsToFile(
    filename: string = "console-settings.json"
  ): Promise<void> {
    try {
      const settings = this.exportConsoleSettings();

      await window.ipc.invoke("save-settings-file", {
        filename,
        data: settings,
      });
    } catch (error) {
      console.error("Failed to export console settings to file:", error);
      throw error;
    }
  }

  async exportSettingsConfigToFile(
    filename: string = "settings-config.json"
  ): Promise<void> {
    try {
      const config = this.exportSettingsConfig();

      await window.ipc.invoke("save-settings-file", {
        filename,
        data: config,
      });
    } catch (error) {
      console.error("Failed to export settings configuration to file:", error);
      throw error;
    }
  }

  // Storage Methods
  saveAllSettings(): void {
    SettingsRegistryManager.saveToStorage();
    console.log("All settings saved to storage");
  }

  reloadSettings(): void {
    SettingsRegistryManager.loadFromStorage();
    console.log("Settings reloaded from storage");
  }

  // Utility Methods
  getRegistry(): typeof SettingsRegistryManager {
    return SettingsRegistryManager;
  }

  getAllSettingKeys(): string[] {
    return this.settingsConfig.map((setting) => setting.id);
  }

  getSettingInfo(key: string): Setting | undefined {
    return this.settingsConfig.find((setting) => setting.id === key);
  }

  validateSetting(key: string, value: any): boolean {
    const setting = this.getSettingInfo(key);
    if (!setting) return false;

    switch (setting.type) {
      case "number":
        if (typeof value !== "number") return false;
        if (setting.min !== undefined && value < setting.min) return false;
        if (setting.max !== undefined && value > setting.max) return false;
        return true;
      case "toggle":
        return typeof value === "boolean";
      case "select":
        return (
          setting.options?.some((option) => option.value === value) ?? false
        );
      case "input":
      case "color":
        return typeof value === "string";
      case "range":
        if (typeof value !== "number") return false;
        if (setting.min !== undefined && value < setting.min) return false;
        if (setting.max !== undefined && value > setting.max) return false;
        return true;
      default:
        return true;
    }
  }

  // Batch Operations
  setMultiple(settings: Record<string, any>): void {
    Object.entries(settings).forEach(([key, value]) => {
      if (this.validateSetting(key, value)) {
        this.set(key, value);
      } else {
        console.warn(`Invalid value for setting ${key}:`, value);
      }
    });
  }

  getMultiple(keys: string[]): Record<string, any> {
    return keys.reduce(
      (acc, key) => {
        acc[key] = this.get(key);
        return acc;
      },
      {} as Record<string, any>
    );
  }

  // Search and Filter
  searchSettings(query: string): Setting[] {
    const lowercaseQuery = query.toLowerCase();
    return this.settingsConfig.filter(
      (setting) =>
        setting.id.toLowerCase().includes(lowercaseQuery) ||
        setting.title.toLowerCase().includes(lowercaseQuery) ||
        setting.description?.toLowerCase().includes(lowercaseQuery)
    );
  }

  getModifiedSettings(): Record<string, any> {
    const modified: Record<string, any> = {};
    this.settingsConfig.forEach((setting) => {
      const currentValue = this.get(setting.id);
      if (currentValue !== setting.defaultValue) {
        modified[setting.id] = currentValue;
      }
    });
    return modified;
  }

  // Event Management
  removeAllListeners(): void {
    this.listeners.clear();
  }

  getListenerCount(key?: string): number {
    if (key) {
      return this.listeners.get(key)?.size ?? 0;
    }
    return Array.from(this.listeners.values()).reduce(
      (sum, set) => sum + set.size,
      0
    );
  }

  // Debug and Development
  debugInfo(): void {
    console.group("Settings Controller Debug Info");
    console.log("Categories:", this.categories.length);
    console.log("Total Settings:", this.settingsConfig.length);
    console.log("Settings by Category:");
    this.categories.forEach((category) => {
      const count = this.getSettingsByCategory(category.id).length;
      console.log(`  ${category.title}: ${count} settings`);
    });
    console.log("Active Listeners:", this.getListenerCount());
    console.log(
      "Modified Settings:",
      Object.keys(this.getModifiedSettings()).length
    );
    console.groupEnd();
  }
}
