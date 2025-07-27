import { Layout } from "./browser/layout/layout.js";
import { InitElementsService } from "./service/InitElementsService.js";
import {
  DarkTheme,
  ManojKhandelwal,
  GoatedDarkTheme,
  LightBlueTheme,
  LightTheme,
  PyCharmDarkTheme,
  VSCodeDarkPlusTheme,
} from "../contrib/theme/themes.js";
import { themeService } from "./service/ThemeServiceSingleton.js";

export class Workbench {
  constructor() {
    themeService.registerMany([
      LightTheme,
      DarkTheme,
      LightBlueTheme,
      GoatedDarkTheme,
      PyCharmDarkTheme,
      ManojKhandelwal,
      VSCodeDarkPlusTheme,
    ]);
    themeService.initFromPersisted();
    // if (!themeService.getCurrent()) {
    //   const prefersDark = window.matchMedia?.(
    //     "(prefers-color-scheme: dark)"
    //   )?.matches;
    //   themeService.setThemeByName(LightTheme.name);
    // }

    themeService.setThemeByName(DarkTheme.name);

    new InitElementsService();
    new Layout();
  }
}
