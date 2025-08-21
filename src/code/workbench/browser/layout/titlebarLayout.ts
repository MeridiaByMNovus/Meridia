import { commands } from "../../common/classInstances/commandsInstance.js";
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

    const MaximizeSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
  <rect x="4" y="4" width="16" height="16" rx="2" stroke="var(--icon-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

    const RestoreSVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
  <path d="M19,3 C20.0543909,3 20.9181678,3.81587733 20.9945144,4.85073759 L21,5 L21,15 C21,16.0543909 20.18415,16.9181678 19.1492661,16.9945144 L19,17 L17,17 L17,19 C17,20.0543909 16.18415,20.9181678 15.1492661,20.9945144 L15,21 L5,21 C3.94563773,21 3.08183483,20.18415 3.00548573,19.1492661 L3,19 L3,9 C3,7.94563773 3.81587733,7.08183483 4.85073759,7.00548573 L5,7 L7,7 L7,5 C7,3.94563773 7.81587733,3.08183483 8.85073759,3.00548573 L9,3 L19,3 Z M15,9 L5,9 L5,19 L15,19 L15,9 Z M19,5 L9,5 L9,7 L15,7 L15.1492661,7.00548573 C16.1324058,7.07801738 16.9178674,7.86122607 16.9939557,8.84334947 L17,9 L17,15 L19,15 L19,5 Z" fill="var(--icon-color)"/>
</svg>
`;

    const CloseSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800px" height="800px" viewBox="0 0 24 24" fill="none">
<g id="SVGRepo_bgCarrier" stroke-width="0"/>
<g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"/>
<g id="SVGRepo_iconCarrier"> <path d="M20.7457 3.32851C20.3552 2.93798 19.722 2.93798 19.3315 3.32851L12.0371 10.6229L4.74275 3.32851C4.35223 2.93798 3.71906 2.93798 3.32854 3.32851C2.93801 3.71903 2.93801 4.3522 3.32854 4.74272L10.6229 12.0371L3.32856 19.3314C2.93803 19.722 2.93803 20.3551 3.32856 20.7457C3.71908 21.1362 4.35225 21.1362 4.74277 20.7457L12.0371 13.4513L19.3315 20.7457C19.722 21.1362 20.3552 21.1362 20.7457 20.7457C21.1362 20.3551 21.1362 19.722 20.7457 19.3315L13.4513 12.0371L20.7457 4.74272C21.1362 4.3522 21.1362 3.71903 20.7457 3.32851Z" fill="var(--icon-color)"/> </g>
</svg>
`;

    const MinimizeSvg = `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="800px" height="800px" viewBox="0 0 24 24" version="1.1" fill="var(--icon-color)">
<g id="SVGRepo_bgCarrier" stroke-width="0"/>
<g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"/>
<g id="SVGRepo_iconCarrier"> <title>minimize_fill</title> <g id="页面-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="System" transform="translate(-192.000000, -240.000000)"> <g id="minimize_fill" transform="translate(192.000000, 240.000000)"> <path d="M24,0 L24,24 L0,24 L0,0 L24,0 Z M12.5934901,23.257841 L12.5819402,23.2595131 L12.5108777,23.2950439 L12.4918791,23.2987469 L12.4918791,23.2987469 L12.4767152,23.2950439 L12.4056548,23.2595131 C12.3958229,23.2563662 12.3870493,23.2590235 12.3821421,23.2649074 L12.3780323,23.275831 L12.360941,23.7031097 L12.3658947,23.7234994 L12.3769048,23.7357139 L12.4804777,23.8096931 L12.4953491,23.8136134 L12.4953491,23.8136134 L12.5071152,23.8096931 L12.6106902,23.7357139 L12.6232938,23.7196733 L12.6232938,23.7196733 L12.6266527,23.7031097 L12.609561,23.275831 C12.6075724,23.2657013 12.6010112,23.2592993 12.5934901,23.257841 L12.5934901,23.257841 Z M12.8583906,23.1452862 L12.8445485,23.1473072 L12.6598443,23.2396597 L12.6498822,23.2499052 L12.6498822,23.2499052 L12.6471943,23.2611114 L12.6650943,23.6906389 L12.6699349,23.7034178 L12.6699349,23.7034178 L12.678386,23.7104931 L12.8793402,23.8032389 C12.8914285,23.8068999 12.9022333,23.8029875 12.9078286,23.7952264 L12.9118235,23.7811639 L12.8776777,23.1665331 C12.8752882,23.1545897 12.8674102,23.1470016 12.8583906,23.1452862 L12.8583906,23.1452862 Z M12.1430473,23.1473072 C12.1332178,23.1423925 12.1221763,23.1452606 12.1156365,23.1525954 L12.1099173,23.1665331 L12.0757714,23.7811639 C12.0751323,23.7926639 12.0828099,23.8018602 12.0926481,23.8045676 L12.108256,23.8032389 L12.3092106,23.7104931 L12.3186497,23.7024347 L12.3186497,23.7024347 L12.3225043,23.6906389 L12.340401,23.2611114 L12.337245,23.2485176 L12.337245,23.2485176 L12.3277531,23.2396597 L12.1430473,23.1473072 Z" id="MingCute" fill-rule="nonzero"> </path> <path d="M2.5,12 C2.5,11.1716 3.17157,10.5 4,10.5 L20,10.5 C20.8284,10.5 21.5,11.1716 21.5,12 C21.5,12.8284 20.8284,13.5 20,13.5 L4,13.5 C3.17157,13.5 2.5,12.8284 2.5,12 Z" id="路径" fill="var(--icon-color)"> </path> </g> </g> </g> </g>
</svg>
    `;

    const partLeft = document.createElement("div");
    partLeft.className = "part";

    const logoDiv = document.createElement("div");
    logoDiv.className = "logo";
    const logoTxt = document.createElement("p");
    logoTxt.textContent = "Meridia";
    logoDiv.appendChild(logoTxt);

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
    runButton.innerHTML = `<svg viewBox="-3 0 28 28" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns" fill="var(--icon-color)"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>play</title> <desc>Created with Sketch Beta.</desc> <defs> </defs> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" sketch:type="MSPage"> <g id="Icon-Set" sketch:type="MSLayerGroup" transform="translate(-417.000000, -569.000000)" fill="var(--icon-color)"> <path d="M418.983,594.247 L418.983,571.722 L436.831,582.984 L418.983,594.247 L418.983,594.247 Z M438.204,581.536 L419.394,569.279 C418.278,568.672 417,568.943 417,570.917 L417,595.052 C417,597.012 418.371,597.361 419.394,596.689 L438.204,584.433 C439.288,583.665 439.258,582.242 438.204,581.536 L438.204,581.536 Z" id="play" sketch:type="MSShapeGroup"> </path> </g> </g> </g></svg>`;
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
    btnMinimize.innerHTML = MinimizeSvg;
    btnMinimize.onclick = () => {
      window.electron.handleWindowMinimize();
    };

    const btnRestore = document.createElement("button");
    btnRestore.innerHTML = RestoreSVG;
    btnRestore.onclick = () => {
      window.electron.handleWindowRestore();
    };

    const btnClose = document.createElement("button");
    btnClose.innerHTML = CloseSvg;
    btnClose.onclick = () => {
      window.electron.handleWindowClose();
    };

    window.electron.ipcRenderer.on("window-changed-to-maximized", () => {
      btnRestore.innerHTML = RestoreSVG;
      btnRestore.onclick = () => {
        window.electron.handleWindowRestore();
      };
    });

    window.electron.ipcRenderer.on("window-changed-to-restore", () => {
      btnRestore.innerHTML = MaximizeSVG;
      btnRestore.onclick = () => {
        window.electron.handleWindowMaximize();
      };
    });

    windowControlsDiv.appendChild(btnMinimize);
    windowControlsDiv.appendChild(btnRestore);
    windowControlsDiv.appendChild(btnClose);

    partRight.appendChild(windowControlsDiv);

    titlebar.appendChild(partLeft);
    titlebar.appendChild(partMiddle);
    titlebar.appendChild(partRight);

    (document.querySelector(".main-wrapper") as HTMLDivElement).appendChild(
      titlebar
    );
  }
}
