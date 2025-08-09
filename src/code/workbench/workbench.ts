import { Layout } from "./browser/layout/layout.js";
import { InitElementsService } from "./service/InitElementsService.js";
import {
  DraculaTechTheme,
  SolarizedCalmTheme,
  NordSeaTheme,
  MinimalLightTheme,
  OneDarkProTheme,
  MonokaiClassicTheme,
} from "../resources/theme/themes.js";
import { themeService } from "./service/ThemeServiceSingleton.js";
import {
  SettingsRegistry,
  SettingsRegistryManager,
} from "./common/registrey/SettingsRegistery.js";

export class Workbench {
  private readonly settingsRegistry: typeof SettingsRegistry;
  private readonly settingsManager: typeof SettingsRegistryManager;
  private layout?: Layout;
  private initElementsService?: InitElementsService;
  private settingsWatchers: (() => void)[] = [];

  constructor() {
    this.settingsRegistry = SettingsRegistry;
    this.settingsManager = SettingsRegistryManager;

    try {
      this.initialize();
    } catch (error) {
      throw new Error("Workbench initialization failed");
    }
  }

  private async initialize(): Promise<void> {
    this.registerDefaultSettings();
    this.initializeThemeSystem();
    this.setupSettingsWatchers();
    await this.initializeCoreServices();
    this.initializeLayout();
  }

  private registerDefaultSettings(): void {
    import("./browser/layout/common/SettingsController.js")
      .then(({ SettingsController }) => {
        const settingsController = SettingsController.getInstance();

        const workbenchSettings = {
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
          "workbench.colorTheme": DraculaTechTheme.name,
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
    import("./browser/layout/common/SettingsController.js")
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
      DraculaTechTheme,
      MinimalLightTheme,
      MonokaiClassicTheme,
      OneDarkProTheme,
      NordSeaTheme,
      SolarizedCalmTheme,
    ];

    themeService.registerMany(availableThemes);
    themeService.initFromPersisted();

    const currentTheme = this.settingsManager.get(
      "workbench.colorTheme"
    ) as string;
    if (currentTheme) {
      try {
        themeService.setThemeByName(currentTheme);
      } catch {
        themeService.setThemeByName(NordSeaTheme.name);
      }
    }
  }

  private async initializeCoreServices(): Promise<void> {
    this.initElementsService = new InitElementsService();

    if (this.initElementsService && "initialize" in this.initElementsService) {
      await (this.initElementsService as any).initialize();
    }
  }

  private initializeLayout(): void {
    this.layout = new Layout();
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

  public dispose(): void {
    try {
      this.settingsWatchers.forEach((unwatch) => unwatch());
      this.settingsWatchers = [];

      if (this.layout && "dispose" in this.layout) {
        (this.layout as any).dispose();
      }

      if (this.initElementsService && "dispose" in this.initElementsService) {
        (this.initElementsService as any).dispose();
      }

      this.layout = undefined;
      this.initElementsService = undefined;
    } catch (error) {}
  }
}
