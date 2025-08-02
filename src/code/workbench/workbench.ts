import { Layout } from "./browser/layout/layout.js";
import { InitElementsService } from "./service/InitElementsService.js";
import {
  LightBlueTheme,
  Manoj_All_Blue,
  MeridiaDark,
} from "../resources/theme/themes.js";
import { themeService } from "./service/ThemeServiceSingleton.js";

export class Workbench {
  constructor() {
    themeService.registerMany([LightBlueTheme]);
    themeService.initFromPersisted();

    themeService.setThemeByName(LightBlueTheme.name);

    new InitElementsService();
    new Layout();
  }
}
