/*---------------------------------------------------------------------------------------------
 *  Copyright (c) MNovus. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import "react-perfect-scrollbar/dist/css/styles.css";
import "../entry-points/app_entry";
import "../../src/ui/css/main.css";
import "../../src/ui/css/tailwind.css";
import "../../src/ui/css/command_overlay.css";
import { applyTheme } from "../../src/helpers/theme";

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
