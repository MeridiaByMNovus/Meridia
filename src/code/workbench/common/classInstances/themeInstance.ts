import { ThemeService } from "../../service/ThemeService.js";

export const themeService = new ThemeService({
  autoDetect: true,
  preferredLight: "Meridia Light",
  preferredDark: "Meridia Dark",
});
