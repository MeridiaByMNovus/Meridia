import "../common/workbench.init.js";
import { registerStandalone } from "../common/workbench.standalone.js";
import { changePanelOptionsWidth } from "../event/workbench.event.panel.options.js";
import { Editor as EditorLayout } from "./workbench.layout.editor.js";
import { Files } from "./workbench.layout.files.js";
import { Panel } from "./workbench.parts/workbench.part.panel.js";
import { PanelOptions } from "./workbench.parts/workbench.part.panel.options.js";
import { PanelOption } from "./workbench.parts/workbench.part.panel.options.option.js";
import { Splitter } from "./workbench.parts/workbench.part.splitter.js";
import { Statusbar } from "./workbench.parts/workbench.part.status.js";
import { DevPanel } from "./workbench.parts/workbench.part.dev.panel/workbench.part.dev.panel.el.js";
import { Titlebar } from "./workbench.parts/workbench.part.titlebar.js";
import { runIcon } from "./workbench.media/workbench.icons.js";
import { Mira } from "./workbench.layout.mira.js";

export class Layout {
  constructor() {
    this.startup();
  }

  private startup() {
    const codeEl = document.createElement("div");
    codeEl.className = "code";

    const titlebar = new Titlebar().getDomElement()!;

    const files = new Files().getDomElement()!;

    const mira = new Mira().getDomElement()!;

    const devPanel = new DevPanel();
    registerStandalone("dev-panel", devPanel);

    const commandPanel = new Panel("command-panel").getDomElement()!;

    const leftPanel = new Panel("left-panel").getDomElement()!;
    const middlePanel = new Panel("split-panel").getDomElement()!;
    const rightPanel = new Panel("right-panel").getDomElement()!;

    const filesOption = new PanelOption("Files").getDomElement()!;
    filesOption.className = "active";

    const extensionOption = new PanelOption("Extensions").getDomElement()!;

    const leftPanelOptions = new PanelOptions(
      [filesOption, extensionOption],
      leftPanel,
      "left-panel-options"
    );

    filesOption.onclick = () => {
      leftPanelOptions._updateContent(files);
    };

    leftPanelOptions._updateContent(files);

    const miraOption = new PanelOption("Mira").getDomElement()!;
    miraOption.className = "active";

    const structureOption = new PanelOption("Structure").getDomElement()!;

    const editorOption = new PanelOption(
      null as any,
      () => {},
      runIcon
    ).getDomElement()!;

    const middlePanelOptions = new PanelOptions(
      [editorOption],
      null as any,
      "middle-panel-options"
    );

    const rightPanelOptions = new PanelOptions(
      [miraOption, structureOption],
      rightPanel,
      "right-panel-options"
    );

    rightPanelOptions._updateContent(mira);

    commandPanel.appendChild(leftPanelOptions.getDomElement()!);
    commandPanel.appendChild(middlePanelOptions.getDomElement()!);
    commandPanel.appendChild(rightPanelOptions.getDomElement()!);

    const _editorLayout = new EditorLayout().getDomElement()!;

    const topPanel = new Panel("top-panel").getDomElement()!;
    const bottomPanel = new Panel("bottom-panel").getDomElement()!;

    bottomPanel.appendChild(devPanel.getDomElement()!);

    topPanel.appendChild(_editorLayout);

    const statusbar = new Statusbar().getDomElement()!;

    const splitterVertical = new Splitter(
      [topPanel, bottomPanel],
      "vertical",
      [60, 40]
    );

    registerStandalone("panel-splitter-vertical", splitterVertical);

    middlePanel.appendChild(splitterVertical.getDomElement()!);

    const splitterHorizontal = new Splitter(
      [leftPanel, middlePanel, rightPanel],
      "horizontal",
      [20, 60, 20],
      () => {
        changePanelOptionsWidth();
      }
    );

    registerStandalone("panel-splitter-horizontal", splitterHorizontal);

    codeEl.appendChild(titlebar);
    codeEl.appendChild(commandPanel);
    codeEl.appendChild(splitterHorizontal.getDomElement()!);
    codeEl.appendChild(statusbar);

    document.body.appendChild(codeEl);
  }
}
