import { Layout } from "./browser/layout/layout.js";
import {
  CyberpunkGold,
  LavenderDreams,
  MeridiaDark,
  MeridiaLight,
  NeonSynthwave,
  OceanBreeze,
  SunsetVibes,
} from "../resources/theme/themes.js";
import { themeService } from "./common/classInstances/themeInstance.js";
import {
  SettingsRegistry,
  SettingsRegistryManager,
} from "./common/registery/SettingsRegistery.js";
import { Core } from "../platform/extension/core.js";

export class Workbench {
  private readonly settingsRegistry: typeof SettingsRegistry;
  private readonly settingsManager: typeof SettingsRegistryManager;
  private layout?: Layout;
  private settingsWatchers: (() => void)[] = [];

  constructor(private core: Core) {
    this.settingsRegistry = SettingsRegistry;
    this.settingsManager = SettingsRegistryManager;

    this.initialize();
  }

  private async initialize(): Promise<void> {
    this.registerDefaultSettings();
    this.initializeThemeSystem();
    this.setupSettingsWatchers();
    this.initializeLayout();
  }

  private registerDefaultSettings(): void {
    import("./browser/layout/common/controller/SettingsController.js")
      .then(({ SettingsController }) => {
        const settingsController = SettingsController.getInstance();

        const workbenchSettings = {
          "workbench.colorTheme": MeridiaDark.name,
          "workbench.startupAction": "welcomeTab",
          "workbench.enableAnimations": true,
        };

        Object.entries(workbenchSettings).forEach(([key, value]) => {
          if (!settingsController.has(key)) {
            settingsController.set(key, value);
          }
        });
      })
      .catch((error) => {
        const defaultSettings = {
          "workbench.colorTheme": MeridiaDark.name,
          "workbench.startupAction": "welcomeTab",
          "workbench.enableAnimations": true,
        };

        Object.entries(defaultSettings).forEach(([key, value]) => {
          if (!this.settingsManager.has(key)) {
            this.settingsManager.set(key, value as string);
          }
        });
      });
  }

  private setupSettingsWatchers(): void {
    import("./browser/layout/common/controller/SettingsController.js")
      .then(({ SettingsController }) => {
        const settingsController = SettingsController.getInstance();

        const themeWatcher = settingsController.onChange(
          "workbench.colorTheme",
          (themeName: string) => {
            if (themeName) {
              themeService.setThemeByName(themeName);
            }
          }
        );

        this.settingsWatchers.push(themeWatcher);
      })
      .catch(() => {
        const handleSettingsChange = (event: Event) => {
          const customEvent = event as CustomEvent;
          const { key, newValue } = customEvent.detail;

          if (key === "workbench.colorTheme" && newValue) {
            themeService.setThemeByName(newValue);
          }
        };

        window.addEventListener("settings-changed", handleSettingsChange);

        this.settingsWatchers.push(() => {
          window.removeEventListener("settings-changed", handleSettingsChange);
        });
      });
  }

  private initializeThemeSystem(): void {
    const availableThemes = [
      MeridiaDark,
      MeridiaLight,
      LavenderDreams,
      SunsetVibes,
      CyberpunkGold,
      OceanBreeze,
      NeonSynthwave,
    ];
    themeService.registerMany(availableThemes);
    themeService.initFromPersisted();

    let currentTheme = this.settingsManager.get(
      "workbench.colorTheme"
    ) as string;
    if (!currentTheme) {
      currentTheme = MeridiaDark.name;
      this.settingsManager.set("workbench.colorTheme", currentTheme);
    }

    try {
      themeService.setThemeByName(currentTheme);
    } catch {
      themeService.setThemeByName(MeridiaDark.name);
    }
  }

  private initializeLayout(): void {
    this.layout = new Layout(this.core);
  }

  public getLayout(): Layout | undefined {
    return this.layout;
  }

  public getSettingsRegistry(): typeof SettingsRegistry {
    return this.settingsRegistry;
  }

  public setTheme(themeName: string): void {
    try {
      themeService.setThemeByName(themeName);
      this.settingsManager.set("workbench.colorTheme", themeName);
    } catch (error) {}
  }
}
