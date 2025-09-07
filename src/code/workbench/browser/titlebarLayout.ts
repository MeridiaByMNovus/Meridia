import { commands } from "../common/classInstances/commandsInstance.js";
import {
  closeIcon,
  maximizeIcon,
  minimizeIcon,
  restoreIcon,
  runIcon,
} from "../common/svgIcons.js";
import { TitleBarController } from "./common/controller/TitlebarController.js";
import { ElementCore } from "./elementCore.js";

export class TitleBarLayout extends ElementCore {
  constructor() {
    super();

    this.createTitlebar();
    new TitleBarController();
  }

  createTitlebar() {
    const titlebar = document.createElement("div");
    titlebar.className = "titlebar";

    const partLeft = document.createElement("div");
    partLeft.className = "part";

    const logoDiv = document.createElement("div");
    logoDiv.className = "logo";

    const menuDiv = document.createElement("div");
    menuDiv.className = "menu";

    partLeft.appendChild(logoDiv);
    partLeft.appendChild(menuDiv);

    const partMiddle = document.createElement("div");
    partMiddle.className = "part";
    partMiddle.style.marginLeft = "460px";

    const commandsDiv = document.createElement("div");
    commandsDiv.className = "commands";

    const runButton = document.createElement("button");
    runButton.innerHTML = runIcon;
    runButton.onclick = () => {
      commands.runCommand("workbench.editor.run");
    };

    commandsDiv.appendChild(runButton);

    partMiddle.appendChild(commandsDiv);

    const partRight = document.createElement("div");
    partRight.className = "part";

    const windowControlsDiv = document.createElement("div");
    windowControlsDiv.className = "window-controls";

    const btnMinimize = document.createElement("button");
    btnMinimize.innerHTML = minimizeIcon;
    btnMinimize.onclick = () => {
      window.windowmanager.minimize();
    };

    const btnRestore = document.createElement("button");
    btnRestore.innerHTML = restoreIcon;
    btnRestore.onclick = () => {
      window.windowmanager.restore();
    };

    const btnClose = document.createElement("button");
    btnClose.innerHTML = closeIcon;
    btnClose.onclick = () => {
      window.windowmanager.close();
    };

    window.ipc.on("window-changed-to-maximized", () => {
      btnRestore.innerHTML = restoreIcon;
      btnRestore.onclick = () => {
        window.windowmanager.restore();
      };
    });

    window.ipc.on("window-changed-to-restore", () => {
      btnRestore.innerHTML = maximizeIcon;
      btnRestore.onclick = () => {
        window.windowmanager.maximize();
      };
    });

    windowControlsDiv.appendChild(btnMinimize);
    windowControlsDiv.appendChild(btnRestore);
    windowControlsDiv.appendChild(btnClose);

    partRight.appendChild(windowControlsDiv);

    titlebar.appendChild(partLeft);
    titlebar.appendChild(partMiddle);
    titlebar.appendChild(partRight);

    (document.querySelector(".code") as HTMLDivElement).appendChild(titlebar);
  }
}
