import {
  DevPanel,
  init_workbench_part_dev_panel_el
} from "./chunk-DL64DSIX.js";
import {
  Panel,
  init_workbench_part_panel
} from "./chunk-QNNCGGPS.js";
import {
  Splitter,
  init_workbench_part_splitter
} from "./chunk-6RUPFKXE.js";
import {
  Statusbar,
  init_workbench_part_status
} from "./chunk-FBQTK7ZV.js";
import {
  Titlebar,
  init_workbench_part_titlebar
} from "./chunk-PSJTPG7E.js";
import {
  PanelOption,
  init_workbench_part_panel_options_option
} from "./chunk-4ZMCN54S.js";
import {
  PanelOptions,
  init_workbench_part_panel_options
} from "./chunk-6KXO3N2R.js";
import {
  require_workbench_init
} from "./chunk-23ZKGI5X.js";
import {
  changePanelOptionsWidth,
  init_workbench_event_panel_options
} from "./chunk-TFNBFXUN.js";
import {
  Editor,
  init_workbench_layout_editor
} from "./chunk-NJKFGFK5.js";
import {
  Files,
  init_workbench_layout_files
} from "./chunk-VGS7KT6J.js";
import {
  Gemini,
  init_workbench_layout_gemini
} from "./chunk-PICPAGSR.js";
import {
  init_workbench_icons,
  runIcon
} from "./chunk-UTYDY5QB.js";
import {
  init_workbench_standalone,
  registerStandalone
} from "./chunk-5XOEW5AM.js";
import {
  __esm,
  __toESM
} from "./chunk-KH45J4DC.js";

// src/code/workbench/browser/workbench.layout.ts
var import_workbench_init, Layout;
var init_workbench_layout = __esm({
  "src/code/workbench/browser/workbench.layout.ts"() {
    import_workbench_init = __toESM(require_workbench_init());
    init_workbench_standalone();
    init_workbench_event_panel_options();
    init_workbench_layout_editor();
    init_workbench_layout_files();
    init_workbench_part_panel();
    init_workbench_part_panel_options();
    init_workbench_part_panel_options_option();
    init_workbench_part_splitter();
    init_workbench_part_status();
    init_workbench_part_dev_panel_el();
    init_workbench_part_titlebar();
    init_workbench_icons();
    init_workbench_layout_gemini();
    Layout = class {
      constructor() {
        this.startup();
      }
      startup() {
        const codeEl = document.createElement("div");
        codeEl.className = "code";
        const titlebar = new Titlebar().getDomElement();
        const files = new Files().getDomElement();
        const gemini = new Gemini().getDomElement();
        const devPanel = new DevPanel();
        registerStandalone("dev-panel", devPanel);
        const commandPanel = new Panel("command-panel").getDomElement();
        const leftPanel = new Panel("left-panel").getDomElement();
        const middlePanel = new Panel("split-panel").getDomElement();
        const rightPanel = new Panel("right-panel").getDomElement();
        const filesOption = new PanelOption("Files").getDomElement();
        filesOption.className = "active";
        const extensionOption = new PanelOption("Extensions").getDomElement();
        const leftPanelOptions = new PanelOptions(
          [filesOption, extensionOption],
          leftPanel,
          "left-panel-options"
        );
        filesOption.onclick = () => {
          leftPanelOptions._updateContent(files);
        };
        leftPanelOptions._updateContent(files);
        const geminiOption = new PanelOption("Gemini").getDomElement();
        geminiOption.className = "active";
        const structureOption = new PanelOption("Structure").getDomElement();
        const editorOption = new PanelOption(
          null,
          () => {
          },
          runIcon
        ).getDomElement();
        const middlePanelOptions = new PanelOptions(
          [editorOption],
          null,
          "middle-panel-options"
        );
        const rightPanelOptions = new PanelOptions(
          [geminiOption, structureOption],
          rightPanel,
          "right-panel-options"
        );
        rightPanelOptions._updateContent(gemini);
        commandPanel.appendChild(leftPanelOptions.getDomElement());
        commandPanel.appendChild(middlePanelOptions.getDomElement());
        commandPanel.appendChild(rightPanelOptions.getDomElement());
        const _editorLayout = new Editor().getDomElement();
        const topPanel = new Panel("top-panel").getDomElement();
        const bottomPanel = new Panel("bottom-panel").getDomElement();
        bottomPanel.appendChild(devPanel.getDomElement());
        topPanel.appendChild(_editorLayout);
        const statusbar = new Statusbar().getDomElement();
        const splitterVertical = new Splitter(
          [topPanel, bottomPanel],
          "vertical",
          [60, 40]
        );
        registerStandalone("panel-splitter-vertical", splitterVertical);
        middlePanel.appendChild(splitterVertical.getDomElement());
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
        codeEl.appendChild(splitterHorizontal.getDomElement());
        codeEl.appendChild(statusbar);
        document.body.appendChild(codeEl);
      }
    };
  }
});

export {
  Layout,
  init_workbench_layout
};
