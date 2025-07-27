import { ThemeService } from "./ThemeService.js";

export const themeService = new ThemeService({
  autoDetect: true,
  preferredLight: "Meridia Light",
  preferredDark: "Meridia Dark",
});
