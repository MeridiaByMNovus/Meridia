import {
  SettingsRegistry,
  SettingsRegistryManager,
} from "../../../../common/registery/SettingsRegistery.js";
import { themeService } from "../../../../common/classInstances/themeInstance.js";

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
    this.loadSettingsConfig();
    this.initializeDefaultSettings();
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

  private loadSettingsConfig() {
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
      // ===== Editor =====
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
        id: "editor.wordWrap",
        title: "Word Wrap",
        description: "Controls how lines should wrap",
        type: "select",
        category: "editor",
        defaultValue: "off",
        options: [
          { label: "Off", value: "off" },
          { label: "On", value: "on" },
          { label: "Word Boundary", value: "bounded" },
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
        id: "editor.lineNumbers",
        title: "Line Numbers",
        description: "Controls how line numbers are displayed",
        type: "select",
        category: "editor",
        defaultValue: "on",
        options: [
          { label: "On", value: "on" },
          { label: "Relative", value: "relative" },
          { label: "Off", value: "off" },
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
        ],
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
          { label: "All", value: "all" },
        ],
      },

      // ===== Workbench =====
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

      // ===== Terminal =====
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
        id: "terminal.cursorBlink",
        title: "Cursor Blink",
        description: "Controls whether the terminal cursor blinks",
        type: "toggle",
        category: "terminal",
        defaultValue: true,
      },

      // ===== Files =====
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

      // ===== Theme =====
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
      {
        id: "workbench.preferredDarkColorTheme",
        title: "Preferred Dark Color Theme",
        description:
          "Specifies the preferred color theme for dark OS appearance",
        type: "select",
        category: "theme",
        defaultValue: "dark",
        options: [
          { label: "Dark+", value: "dark" },
          { label: "Monokai", value: "monokai" },
          { label: "Solarized Dark", value: "solarized-dark" },
        ],
      },
    ];
  }

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

  exportSettings(): string {
    return JSON.stringify(SettingsRegistryManager.getAll(), null, 2);
  }

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

  saveAllSettings(): void {
    SettingsRegistryManager.saveToStorage();
    console.log("All settings saved to storage");
  }

  reloadSettings(): void {
    SettingsRegistryManager.loadFromStorage();
    console.log("Settings reloaded from storage");
  }

  getRegistry(): typeof SettingsRegistryManager {
    return SettingsRegistryManager;
  }
}
