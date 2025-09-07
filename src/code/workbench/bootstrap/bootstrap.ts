import { themeService } from "../common/classInstances/themeInstance.js";
import {
  SettingsRegistry,
  SettingsRegistryManager,
} from "../common/registery/SettingsRegistery.js";
import { MeridiaDark, MeridiaLight } from "../../resources/theme/themes.js";
import { BootstrapLayout } from "./browser/bootstrapLayout.js";

export class Bootstrap {
  private readonly settingsRegistry: typeof SettingsRegistry;
  private readonly settingsManager: typeof SettingsRegistryManager;
  private settingsWatchers: (() => void)[] = [];
  constructor() {
    new BootstrapLayout();
    this.settingsRegistry = SettingsRegistry;
    this.settingsManager = SettingsRegistryManager;

    this.setupSettingsWatchers();
    this.initializeThemeSystem();
  }

  private setupSettingsWatchers(): void {
    import("../browser/common/controller/SettingsController.js")
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
    const availableThemes = [MeridiaDark, MeridiaLight];
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
}
