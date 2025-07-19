import "react-perfect-scrollbar/dist/css/styles.css";
import "../entry_points/app_entry";
import "../../workbench/styles/main.css";
import "../../workbench/styles/tailwind.css";
import { applyTheme } from "../../workbench/react-hooks/theme";

(async () => {
  // const path: string = await window.electron.ipcRenderer.invoke(
  //   "get-theme",
  //   ""
  // );
  applyTheme("theme/dark.json");
  // console.log("Theme applied on load:", path);

  // window.electron.ipcRenderer.on("change-theme", (_: any, path: string) => {
  //   console.log("Theme path", path);
  //   applyTheme(path);
  // });
})();
