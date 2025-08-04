import PerfectScrollbar from "perfect-scrollbar";
import debounce from "lodash.debounce";
import {
  ActivityBar,
  ActivityBarContentLayout,
  EditorLayout,
  FileTreeLayout,
  SplitterLayout,
  TerminalLayoutWrapper,
  TitleBarLayout,
} from "./imports.js";
import { LayoutService } from "./common/LayoutRegistery.js";
import { StatusBarLayout } from "./statusBarLayout.js";
import { select, watch } from "../../common/store/selectors.js";
import { dispatch, store } from "../../common/store/store.js";
import {
  set_folder_structure,
  update_editor_tabs,
  update_panel_state,
  update_terminal_tabs,
} from "../../common/store/mainSlice.js";
import { ITab } from "../../../../typings/types.js";
import { EditorService } from "../../../editor/common/EditorService.js";
import { SpawnTerminal } from "../../common/spawnTerminal.js";
import { StatusBarController } from "./common/StatusBarController.js";
import { TabContentRegistry } from "../../common/registrey/TabContentRegistery.js";
import { SettingsLayout } from "./settingsLayout.js";
import { handleOpenSettingsTab } from "../../common/functions.js";

const randomUUID = () => crypto.randomUUID();

export class Layout {
  private fileTree: any = null;
  private layoutService = new LayoutService();
  private terminal!: SpawnTerminal;
  private splitterLayout!: SplitterLayout;
  private tabContentEl!: HTMLDivElement;
  private editorService = EditorService.get();

  private isTabSwitching = false;
  private tabSwitchingTimer: NodeJS.Timeout | null = null;
  private currentTabIndex = 0;

  constructor() {
    this.registerApplicationTabContents();
    this.initialize();
    this.setupKeyboardShortcuts();
    this.handleMenuShortcuts();
  }

  private loadScrollbar() {
    new PerfectScrollbar(
      document.querySelector(".scrollbar-container") as HTMLDivElement
    );
  }

  private async initialize() {
    await this.loadData();
    this.buildLayout();
  }

  private registerApplicationTabContents() {
    const SettingsEl = new SettingsLayout();
    TabContentRegistry.set("elements://settings", SettingsEl.getDomElement());
  }

  private setupKeyboardShortcuts() {
    document.addEventListener("keydown", (event) => {
      if (event.ctrlKey && event.key === "Tab" && !event.shiftKey) {
        event.preventDefault();
        this.handleTabSwitch("editor", "forward");
      } else if (event.ctrlKey && event.key === "Tab" && event.shiftKey) {
        event.preventDefault();
        this.handleTabSwitch("editor", "backward");
      }
    });

    document.addEventListener("keyup", (event) => {
      if (!event.ctrlKey && this.isTabSwitching) {
        this.finalizeTabSwitch();
      }
    });
  }

  private handleMenuShortcuts() {
    window.electron.ipcRenderer.on(
      "new-file-tab",
      debounce(() => {
        this.createNewEditorTab();
      })
    );

    window.electron.ipcRenderer.on(
      "open-settings",
      debounce(() => {
        handleOpenSettingsTab();
      })
    );

    window.electron.ipcRenderer.on(
      "toggle-left-panel",
      debounce(() => {
        const { left, right, bottom } = store.getState().main.panel_state;
        dispatch(
          update_panel_state({
            left: left === "on" ? "off" : "on",
            right,
            bottom,
          })
        );
      })
    );

    window.electron.ipcRenderer.on(
      "toggle-bottom-panel",
      debounce(() => {
        const { left, right, bottom } = store.getState().main.panel_state;
        dispatch(
          update_panel_state({
            left,
            right,
            bottom: bottom === "on" ? "off" : "on",
          })
        );
      })
    );
  }

  private handleTabSwitch(type: "editor", direction: "forward" | "backward") {
    const tabs = select((s) => s.main.editor_tabs) || [];

    if (tabs.length <= 1) return;

    if (!this.isTabSwitching) {
      this.isTabSwitching = true;

      this.currentTabIndex = tabs.findIndex((t) => t.active);
      if (this.currentTabIndex === -1) this.currentTabIndex = 0;
    }

    if (this.tabSwitchingTimer) {
      clearTimeout(this.tabSwitchingTimer);
    }

    if (direction === "forward") {
      this.currentTabIndex = (this.currentTabIndex + 1) % tabs.length;
    } else {
      this.currentTabIndex =
        this.currentTabIndex === 0 ? tabs.length - 1 : this.currentTabIndex - 1;
    }

    const updatedTabs = tabs.map((tab, index) => ({
      ...tab,
      active: index === this.currentTabIndex,
    }));

    dispatch(update_editor_tabs(updatedTabs));

    this.tabSwitchingTimer = setTimeout(() => {
      this.finalizeTabSwitch();
    }, 100);
  }

  private async createNewEditorTab() {
    const { path, name } = await window.electron.createTempPythonFile();

    const tabs = select((s) => s.main.editor_tabs) || [];
    const exists = tabs.find((t) => t.uri === path);
    const next = tabs.map((t) => ({ ...t, active: t.uri === path }));

    if (!exists) {
      const tab: ITab = {
        id: randomUUID(),
        fileIcon: "file.py",
        name,
        active: true,
        uri: path,
        is_touched: false,
      };

      dispatch(update_editor_tabs([...next, tab]));
    } else {
      dispatch(update_editor_tabs(next));
    }
  }

  private finalizeTabSwitch() {
    this.isTabSwitching = false;
    if (this.tabSwitchingTimer) {
      clearTimeout(this.tabSwitchingTimer);
      this.tabSwitchingTimer = null;
    }
  }

  private async loadData() {
    const folder = await window.electron.get_folder();
    if (folder) this.fileTree = folder;
  }

  private async buildLayout() {
    let terminalLayout: TerminalLayoutWrapper;

    this.tabContentEl = document.createElement("div");
    this.tabContentEl.className = "tab-content scrollbar-container";
    this.tabContentEl.style.height = "100%";

    const cleanTree = JSON.parse(JSON.stringify(this.fileTree));
    dispatch(set_folder_structure(cleanTree));

    new TitleBarLayout();

    const layout = this.layoutService.RegisterLayout("main");
    const leftActivityBar = new ActivityBar("left");

    this.splitterLayout = new SplitterLayout(layout, 70, 30);

    const leftPane = this.layoutService.RegisterSplitterPane(
      "leftPane",
      this.splitterLayout,
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
      this.splitterLayout,
      "top",
      80
    );

    const bottomPane = this.layoutService.RegisterSplitterPane(
      "bottomPane",
      this.splitterLayout,
      "bottom"
    );

    const editorLayout = this.layoutService.RegisterEditorLayout(middlePane);

    editorLayout.initializeDropZone();

    setTimeout(() => {
      const editorWrapper = document.querySelector(
        ".editor-layout-wrapper"
      ) as HTMLDivElement;
      if (editorWrapper) {
        const editorLayoutInstance = new EditorLayout();
        editorLayoutInstance.initializeDropZone();
      }
    }, 100);

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

    const addEditorTabButton = document.createElement("button");
    addEditorTabButton.innerHTML = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="var(--icon-color)"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title></title> <g id="Complete"> <g data-name="add" id="add-2"> <g> <line fill="none" stroke="var(--icon-color)" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="19" y2="5"></line> <line fill="none" stroke="var(--icon-color)" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="5" x2="19" y1="12" y2="12"></line> </g> </g> </g> </g></svg>`;

    addEditorTabButton.onclick = async () => {
      await this.createNewEditorTab();
    };

    const editorTabs = this.layoutService.RegisterTabsLayout(
      editorLayout.getDomElement(),
      [addEditorTabButton]
    );

    const terminalTabs = this.layoutService.RegisterTabsLayout(
      terminalLayout.getDomElement()
    );

    document
      .querySelector(".editor-layout-wrapper")
      ?.appendChild(editorContentWrapper);

    const getEditorTabsState = () => select((s) => s.main.editor_tabs);
    const getTerminalTabsState = () => select((s) => s.main.terminal_tabs);

    const updateEditorTabs = (
      tabs: ITab[],
      contentWrapper: HTMLDivElement,
      getStateTabs: () => ITab[],
      updateAction: any,
      onTabClick?: Function
    ) => {
      if (tabs.length === 0) {
        editorTabs.hide();
        this.editorService.destroy();
        return;
      } else {
        this.editorService.show();
        if (!this.editorService.getEditor()) editorTabs.show();
      }

      this.editorService.mount(editorContentWrapper, "dark");

      editorTabs.removeAllTabs();
      tabs.forEach((tab) => {
        this.layoutService.RegisterTabLayout(
          tab.name,
          tab.active,
          document.createElement("div"),
          contentWrapper,
          editorTabs,
          getStateTabs,
          updateAction,
          true,
          onTabClick,
          tab.fileIcon as string,
          undefined,
          tab
        );
      });
    };

    const updateTerminalTabsLayout = (
      tabs: ITab[],
      contentWrapper: HTMLDivElement,
      getStateTabs: () => ITab[],
      updateAction: any
    ) => {
      if (tabs.length === 0) {
        terminalTabs.hide();
        return;
      }

      terminalTabs.show();
      terminalTabs.removeAllTabs();

      tabs.forEach(async (tab) => {
        const tabContent = document.createElement("div");
        tabContent.style.width = "100%";
        tabContent.style.height = "100%";

        this.layoutService.RegisterTabLayout(
          tab.name,
          tab.active,
          tabContent,
          contentWrapper,
          terminalTabs,
          getStateTabs,
          updateAction,
          false,
          () => {},
          tab.fileIcon as string,
          undefined,
          tab
        );
      });
    };

    const renderEditorTabs = (tabs: ITab[]) => {
      updateEditorTabs(
        tabs,
        editorContentWrapper,
        getEditorTabsState,
        update_editor_tabs,
        () => {}
      );

      const active = tabs.find((t) => t.active);

      const setTabContentDisplay = (display: any) => {
        if (this.tabContentEl && this.tabContentEl.style) {
          this.tabContentEl.style.display = display;
        }
      };

      const setTabContent = (contentEl: HTMLElement) => {
        if (this.tabContentEl) {
          this.tabContentEl.innerHTML = "";
          if (contentEl instanceof Node) {
            this.tabContentEl.appendChild(contentEl);
          }
        }
      };

      if (active?.content) {
        this.editorService.hide();
        const contentKey = active?.content ?? active?.uri;
        const contentEl = TabContentRegistry.get(contentKey);

        if (contentEl instanceof Node) {
          setTabContentDisplay("block");
          setTabContent(contentEl);
          new PerfectScrollbar(this.tabContentEl);
        } else {
          setTabContentDisplay("none");
          this.editorService.mount(editorContentWrapper);
          EditorService.get().open(active);
        }

        return;
      }

      if (active) {
        setTabContentDisplay("none");
        this.editorService.mount(editorContentWrapper);
        EditorService.get().open(active);
      }
    };

    const renderTerminalTabs = (tabs: ITab[]) =>
      updateTerminalTabsLayout(
        tabs,
        document.querySelector(".terminal-content-wrapper") as HTMLDivElement,
        getTerminalTabsState,
        update_terminal_tabs
      );

    const editorTabsState = select((s) => s.main.editor_tabs);
    const terminalTabsState = select((s) => s.main.terminal_tabs);

    renderEditorTabs(editorTabsState);
    renderTerminalTabs(terminalTabsState);

    editorContentWrapper.appendChild(this.tabContentEl);

    watch(
      (s) => s.main.editor_tabs,
      (next) => renderEditorTabs(next)
    );
    watch(
      (s) => s.main.terminal_tabs,
      (next) => renderTerminalTabs(next)
    );

    dispatch(
      update_terminal_tabs([
        {
          id: "1",
          name: "Local 1",
          fileIcon: "file.bat",
          active: true,
          uri: "",
          is_touched: false,
        },
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

    this.layoutService.RegisterActivityBarItem(
      leftActivityBar,
      undefined as any,
      undefined as any,
      `<svg viewBox="0 0 30 30" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns" fill="var(--icon-color)"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>settings</title> <desc>Created with Sketch Beta.</desc> <defs> </defs> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" sketch:type="MSPage"> <g id="Icon-Set" sketch:type="MSLayerGroup" transform="translate(-101.000000, -360.000000)" fill="var(--icon-color)"> <path d="M128.52,381.134 L127.528,382.866 C127.254,383.345 126.648,383.508 126.173,383.232 L123.418,381.628 C122.02,383.219 120.129,384.359 117.983,384.799 L117.983,387 C117.983,387.553 117.54,388 116.992,388 L115.008,388 C114.46,388 114.017,387.553 114.017,387 L114.017,384.799 C111.871,384.359 109.98,383.219 108.582,381.628 L105.827,383.232 C105.352,383.508 104.746,383.345 104.472,382.866 L103.48,381.134 C103.206,380.656 103.369,380.044 103.843,379.769 L106.609,378.157 C106.28,377.163 106.083,376.106 106.083,375 C106.083,373.894 106.28,372.838 106.609,371.843 L103.843,370.232 C103.369,369.956 103.206,369.345 103.48,368.866 L104.472,367.134 C104.746,366.656 105.352,366.492 105.827,366.768 L108.582,368.372 C109.98,366.781 111.871,365.641 114.017,365.201 L114.017,363 C114.017,362.447 114.46,362 115.008,362 L116.992,362 C117.54,362 117.983,362.447 117.983,363 L117.983,365.201 C120.129,365.641 122.02,366.781 123.418,368.372 L126.173,366.768 C126.648,366.492 127.254,366.656 127.528,367.134 L128.52,368.866 C128.794,369.345 128.631,369.956 128.157,370.232 L125.391,371.843 C125.72,372.838 125.917,373.894 125.917,375 C125.917,376.106 125.72,377.163 125.391,378.157 L128.157,379.769 C128.631,380.044 128.794,380.656 128.52,381.134 L128.52,381.134 Z M130.008,378.536 L127.685,377.184 C127.815,376.474 127.901,375.749 127.901,375 C127.901,374.252 127.815,373.526 127.685,372.816 L130.008,371.464 C130.957,370.912 131.281,369.688 130.733,368.732 L128.75,365.268 C128.203,364.312 126.989,363.983 126.041,364.536 L123.694,365.901 C122.598,364.961 121.352,364.192 119.967,363.697 L119.967,362 C119.967,360.896 119.079,360 117.983,360 L114.017,360 C112.921,360 112.033,360.896 112.033,362 L112.033,363.697 C110.648,364.192 109.402,364.961 108.306,365.901 L105.959,364.536 C105.011,363.983 103.797,364.312 103.25,365.268 L101.267,368.732 C100.719,369.688 101.044,370.912 101.992,371.464 L104.315,372.816 C104.185,373.526 104.099,374.252 104.099,375 C104.099,375.749 104.185,376.474 104.315,377.184 L101.992,378.536 C101.044,379.088 100.719,380.312 101.267,381.268 L103.25,384.732 C103.797,385.688 105.011,386.017 105.959,385.464 L108.306,384.099 C109.402,385.039 110.648,385.809 112.033,386.303 L112.033,388 C112.033,389.104 112.921,390 114.017,390 L117.983,390 C119.079,390 119.967,389.104 119.967,388 L119.967,386.303 C121.352,385.809 122.598,385.039 123.694,384.099 L126.041,385.464 C126.989,386.017 128.203,385.688 128.75,384.732 L130.733,381.268 C131.281,380.312 130.957,379.088 130.008,378.536 L130.008,378.536 Z M116,378 C114.357,378 113.025,376.657 113.025,375 C113.025,373.344 114.357,372 116,372 C117.643,372 118.975,373.344 118.975,375 C118.975,376.657 117.643,378 116,378 L116,378 Z M116,370 C113.261,370 111.042,372.238 111.042,375 C111.042,377.762 113.261,380 116,380 C118.739,380 120.959,377.762 120.959,375 C120.959,372.238 118.739,370 116,370 L116,370 Z" id="settings" sketch:type="MSShapeGroup"> </path> </g> </g> </g></svg>`,
      "settings",
      "bottom",
      false,
      handleOpenSettingsTab
    );

    await window.electron.ipcRenderer.send("ptyInstance.spawn", "1");

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

        if (!paneEl) return;

        if (next.left === "off") {
          this.splitterLayout.hideTopPane(paneEl);
        } else {
          this.splitterLayout.showTopPane(paneEl);
        }
      }
    );

    watch(
      (s) => s.main.panel_state,
      (next) => {
        if (next.bottom === "on")
          this.splitterLayout.toggleBottomSplitter(true);
        else this.splitterLayout.toggleBottomSplitter(false);
      }
    );

    this.terminal = new SpawnTerminal(terminalLayout.getDomElement(), 1, {
      rows: 80,
      cols: 30,
    });

    await window.electron.ipcRenderer.send("ptyInstance.spawn", "1");

    this.registerRunButtonHandler();
    this.loadScrollbar();
  }

  private registerRunButtonHandler() {
    const runButton = document.querySelector(
      ".run-button"
    ) as HTMLButtonElement;

    runButton.onclick = () => {
      const { left, right } = store.getState().main.panel_state;

      const activeTermTab = select((s) =>
        s.main.terminal_tabs.find((t) => t.active)
      );

      if (!activeTermTab) return;

      const terminal = this.terminal;
      if (!terminal) return;

      const activeEditorTab = select((s) =>
        s.main.editor_tabs.find((t) => t.active)
      );

      if (!activeEditorTab) {
        return;
      }

      if (!activeEditorTab.uri!.endsWith(".py")) {
        window.electron.ipcRenderer.invoke("show-error-message-box", {
          title: "Error invalid file type.",
          content: "Only Python files are allowed to run.",
        });

        return;
      }

      const filePath = activeEditorTab.uri;

      const command = `python "${filePath}"`;

      terminal.executeCommand(command);

      dispatch(
        update_panel_state({
          left,
          right,
          bottom: "on",
        })
      );
    };
  }
}
