import PerfectScrollbar from "perfect-scrollbar";
import { randomUUID } from "crypto";
import {
  ActivityBar,
  ActivityBarContentLayout,
  FileTreeLayout,
  SplitterLayout,
  TerminalLayoutWrapper,
  TitleBarLayout,
} from "./imports.js";
import { LayoutService } from "./common/LayoutRegistery.js";
import { StatusBarLayout } from "./statusBarLayout.js";
import { select, watch } from "../../common/store/selectors.js";
import { dispatch } from "../../common/store/store.js";
import {
  update_editor_tabs,
  update_terminal_tabs,
} from "../../common/store/mainSlice.js";
import { IEditorTab, ITab } from "../../../../typings/types.js";
import { EditorService } from "../../../editor/common/EditorService.js";
import { SpawnTerminal } from "../../common/spawnTerminal.js";
import { StatusBarController } from "./common/StatusBarController.js";

export class Layout {
  private fileTree: any = null;
  private layoutService = new LayoutService();

  private editorService = EditorService.get();

  constructor() {
    this.initialize();
  }

  private async initialize() {
    await this.loadData();
    this.buildLayout();
  }

  private async loadData() {
    const folder = await window.electron.get_folder();
    if (folder) this.fileTree = folder;
  }

  private async buildLayout() {
    let terminal: SpawnTerminal;
    let terminalLayout: TerminalLayoutWrapper;

    const { left, right, bottom } = select((s) => s.main.panel_state);

    new TitleBarLayout();

    const layout = this.layoutService.RegisterLayout("main");
    const leftActivityBar = new ActivityBar("left");

    const splitterLayout = new SplitterLayout(layout, 70, 30);

    const leftPane = this.layoutService.RegisterSplitterPane(
      "leftPane",
      splitterLayout,
      "top",
      20
    );

    let leftActivityBarContent: ActivityBarContentLayout;

    if (this.fileTree) {
      leftActivityBarContent = this.layoutService.RegisterActivityBarContent(
        leftPane,
        "leftActivityBarContent"
      );
    }

    const middlePane = this.layoutService.RegisterSplitterPane(
      "middlePane",
      splitterLayout,
      "top",
      80
    );

    const bottomPane = this.layoutService.RegisterSplitterPane(
      "bottomPane",
      splitterLayout,
      "bottom"
    );

    const editorLayout = this.layoutService.RegisterEditorLayout(middlePane);
    terminalLayout = this.layoutService.RegisterTerminalLayout(bottomPane);

    const editorContentWrapper = document.createElement("div");
    editorContentWrapper.className = "editor-content-wrapper";
    editorContentWrapper.style.width = "100%";
    editorContentWrapper.style.height = "100%";

    const terminalContentWrapper = document.createElement("div");
    terminalContentWrapper.className = "terminal-content-wrapper";
    terminalContentWrapper.style.width = "100%";
    terminalContentWrapper.style.height = "100%";

    terminalLayout.getDomElement().appendChild(terminalContentWrapper);

    const addTabButton = document.createElement("button");
    addTabButton.innerHTML = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="var(--icon-color)"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title></title> <g id="Complete"> <g data-name="add" id="add-2"> <g> <line fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="19" y2="5"></line> <line fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="5" x2="19" y1="12" y2="12"></line> </g> </g> </g> </g></svg>`;

    addTabButton.onclick = async () => {
      const { path, name } = await window.electron.createTempPythonFile();

      const tabs = select((s) => s.main.editor_tabs) || [];
      const exists = tabs.find((t) => t.uri === path);
      const next = tabs.map((t) => ({ ...t, active: t.uri === path }));

      if (!exists) {
        const tab: IEditorTab = {
          icon: "file.py",
          name,
          active: true,
          uri: path,
          language: "python",
          initialContent: "",
          is_touched: false,
        };

        dispatch(update_editor_tabs([...next, tab]));
      } else {
        dispatch(update_editor_tabs(next));
      }
    };

    const editorTabs = this.layoutService.RegisterTabsLayout(
      editorLayout.getDomElement(),
      [addTabButton]
    );

    const terminalTabs = this.layoutService.RegisterTabsLayout(
      terminalLayout.getDomElement()
    );

    document
      .querySelector(".editor-layout-wrapper")
      ?.appendChild(editorContentWrapper);

    const editorTabsStateGetter = () => select((s) => s.main.editor_tabs);
    const terminalTabsStateGetter = () => select((s) => s.main.terminal_tabs);

    const updateEditorTabs = (
      tabs: ITab[],
      contentWrapper: HTMLDivElement,
      getStateTabs: () => ITab[],
      updateAction: any
    ) => {
      if (tabs.length === 0) {
        editorTabs.hide();
        this.editorService.destroy();
        return;
      } else {
        if (!this.editorService.getEditor()) editorTabs.show();
      }
      this.editorService.mount(editorContentWrapper, "dark");

      editorTabs.removeAllTabs();
      tabs.forEach((tab) =>
        this.layoutService.RegisterTabLayout(
          tab.icon,
          tab.name,
          tab.active,
          document.createElement("div"),
          contentWrapper,
          editorTabs,
          getStateTabs,
          updateAction,
          true
        )
      );
    };

    const updateTermialTabs = (
      tabs: ITab[],
      contentWrapper: HTMLDivElement,
      getStateTabs: () => ITab[],
      updateAction: any
    ) => {
      if (tabs.length === 0) {
        terminalTabs.hide();
      }

      terminalTabs.show();

      terminalTabs.removeAllTabs();
      tabs.forEach((tab) =>
        this.layoutService.RegisterTabLayout(
          tab.icon,
          tab.name,
          tab.active,
          document.createElement("div"),
          contentWrapper,
          terminalTabs,
          getStateTabs,
          updateAction,
          false
        )
      );
    };

    const handleEditorTabs = (tabs: IEditorTab[]) => {
      updateEditorTabs(
        tabs,
        editorContentWrapper,
        editorTabsStateGetter,
        update_editor_tabs
      );
      const active = tabs.find((t) => t.active);
      if (active) EditorService.get().open(active);
    };

    const handleTerminalTabs = (tabs: ITab[]) =>
      updateTermialTabs(
        tabs,
        document.querySelector(".terminal-content-wrapper") as HTMLDivElement,
        terminalTabsStateGetter,
        update_terminal_tabs
      );

    const editorTabsState = select((s) => s.main.editor_tabs);
    const terminalTabsState = select((s) => s.main.terminal_tabs);

    handleEditorTabs(editorTabsState);
    handleTerminalTabs(terminalTabsState);

    watch(
      (s) => s.main.editor_tabs,
      (next) => handleEditorTabs(next)
    );
    watch(
      (s) => s.main.terminal_tabs,
      (next) => handleTerminalTabs(next)
    );

    dispatch(
      update_terminal_tabs([
        { name: "Local 1", icon: "file.bat", active: true },
      ])
    );

    const explorerIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke=var(--icon-color)>
        <path d="M3 8.2C3 7.07989 3 6.51984 3.21799 6.09202C3.40973 5.71569 3.71569 5.40973 4.09202 5.21799C4.51984 5 5.0799 5 6.2 5H9.67452C10.1637 5 10.4083 5 10.6385 5.05526C10.8425 5.10425 11.0376 5.18506 11.2166 5.29472C11.4184 5.4184 11.5914 5.59135 11.9373 5.93726L12.0627 6.06274C12.4086 6.40865 12.5816 6.5816 12.7834 6.70528C12.9624 6.81494 13.1575 6.89575 13.3615 6.94474C13.5917 7 13.8363 7 14.3255 7H17.8C18.9201 7 19.4802 7 19.908 7.21799C20.2843 7.40973 20.5903 7.71569 20.782 8.09202C21 8.51984 21 9.0799 21 10.2V15.8C21 16.9201 21 17.4802 20.782 17.908C20.5903 18.2843 20.2843 18.5903 19.908 18.782C19.4802 19 18.9201 19 17.8 19H6.2C5.07989 19 4.51984 19 4.09202 18.782C3.71569 18.5903 3.40973 18.2843 3.21799 17.908C3 17.4802 3 16.9201 3 15.8V8.2Z" stroke="#d2d2d2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> 
      </svg>
    `;

    this.layoutService.RegisterActivityBarItem(
      leftActivityBar,
      new FileTreeLayout(this.fileTree).render() as any,
      leftActivityBarContent!.getDomElement(),
      explorerIcon,
      "explorer",
      "top",
      true
    );

    terminal = new SpawnTerminal(terminalLayout.getDomElement(), 1, {
      cols: 80,
      rows: 24,
    });
    await window.electron.ipcRenderer.send("ptyInstance.spawn", 1);

    terminal.fitToContainer();

    new PerfectScrollbar(
      document.querySelector(".scrollbar-container") as HTMLDivElement
    );

    new StatusBarLayout();

    const statusBarController = new StatusBarController();
    const mainItem = statusBarController.createActivityItem({
      id: "fileName",
    });

    mainItem.textContent = "main";

    statusBarController.addItemToPrimary(mainItem);

    watch(
      (s) => s.main.editor_active_tab,
      (next) => (mainItem.textContent = next?.name ?? "main")
    );

    watch(
      (s) => s.main.panel_state,
      (next) => {
        const paneEl = leftPane.getDomElement();
        console.log("changing", next);
        console.log("pane element:", paneEl);

        if (!paneEl) {
          console.warn("Pane element is null or undefined, skipping show/hide");
          return;
        }

        if (next.left === "off") {
          splitterLayout.hideTopPane(paneEl);
        } else {
          splitterLayout.showTopPane(paneEl);
        }
      }
    );
  }
}
