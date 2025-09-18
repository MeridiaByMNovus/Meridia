import PerfectScrollbar from "perfect-scrollbar";
import monaco from "monaco-editor";
import {
  ActivityBar,
  ActivityBarContentLayout,
  FileTreeLayout,
  SplitterLayout,
  TitleBarLayout,
} from "./imports.js";
import { GeminiLayout } from "../../platform/gemini/browser/geminiLayout.js";
import { GeminiIcon } from "../../platform/gemini/browser/icons.js";
import { LayoutService } from "./common/services/LayoutService.js";
import { StatusBarLayout } from "./statusBarLayout.js";
import { select, watch } from "../common/store/selectors.js";
import { dispatch, store } from "../common/store/store.js";
import {
  set_folder_structure,
  update_active_activitybar_item,
  update_editor_active_tab,
  update_editor_tabs,
  update_panel_state,
} from "../common/store/mainSlice.js";
import {
  ActiveActivityBarItem,
  IFolderStructure,
  ITab,
  PanelState,
} from "../../../typings/types.js";
import { EditorCore } from "../../editor/common/editorCore.js";
import { StatusBarController } from "./common/controller/StatusBarController.js";
import {
  get_file_types,
  handleOpenSettingsTab,
  randomUUID,
} from "../common/functions.js";
import { SettingsController } from "./common/controller/SettingsController.js";
import { ExtensionLayout } from "./extensionLayout.js";
import { Core } from "../../platform/extension/core.js";
import { TabManager } from "./common/manager/tabManager.js";
import { commands } from "../common/classInstances/commandsInstance.js";
import { ShortcutsManager } from "./common/manager/shortcutsManager.js";
import { TabContentManager } from "./common/manager/tabContentManager.js";
import { init } from "./init.js";
import {
  addIcon,
  explorerIcon,
  consoleIcon,
  terminalIcon,
  extensionIcon,
  settingsIcon,
  structureIcon,
} from "../common/svgIcons.js";
import { TerminalManager } from "./common/manager/terminalManager.js";
import { ConsoleManager } from "./common/manager/consoleManager.js";
import { StructureLayout } from "./structureLayout.js";
import { StructureController } from "./common/controller/StructureController.js";

export class Layout {
  private fileTree: IFolderStructure | null = null;
  private panelState: PanelState | null = null;
  private activeActivityBarItem: ActiveActivityBarItem | null = null;
  private editorTabs: ITab[] | null = null;
  private layoutService = new LayoutService();
  private splitterLayout!: SplitterLayout;
  private geminiLayout!: GeminiLayout;
  private structureLayout!: StructureLayout;
  private tabContentEl!: HTMLDivElement;
  private editorService: EditorCore;
  private settingsWatchers: (() => void)[] = [];
  cursorListener: monaco.IDisposable | null = null;

  private terminalManager!: TerminalManager;
  private consoleManager!: ConsoleManager;
  private editorTabManager: TabManager<ITab>;

  private isTabSwitching = false;
  private tabSwitchingTimer: NodeJS.Timeout | null = null;
  private currentTabIndex = 0;

  constructor(private core: Core) {
    this.editorTabManager = new TabManager(update_editor_tabs);
    this.initialize();
    this.setupKeyboardShortcuts();

    const structureController = new StructureController();

    this.editorService = EditorCore.get(structureController);

    this.structureLayout = new StructureLayout(
      this.editorService,
      structureController
    );
  }

  private loadScrollbar() {
    document.querySelectorAll(".scrollbar-container").forEach((el) => {
      new PerfectScrollbar(el as HTMLDivElement, {
        suppressScrollX: true,
      });
    });
  }

  private async initialize() {
    await this.loadData();
    this.buildLayout();
    init(this.core, this.layoutService, this.editorService);
  }

  public dispose() {
    this.editorService.destroy();
  }

  private setupKeyboardShortcuts() {
    ShortcutsManager.addShortcut("ctrl+tab", () => {
      this.handleTabSwitch("editor", "forward");
    });

    ShortcutsManager.addShortcut("ctrl+shift+tab", () => {
      this.handleTabSwitch("editor", "backward");
    });

    document.addEventListener("keyup", (event) => {
      if (!event.ctrlKey && this.isTabSwitching) {
        this.finalizeTabSwitch();
      }
    });
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
    const { path, name } = await window.python.createTempPythonFile();
    const tabs = select((s) => s.main.editor_tabs) || [];
    const existingTab = tabs.find((t) => t.uri === path);

    if (existingTab) {
      this.editorTabManager.switchToTab(existingTab.id);
    } else {
      const newTab: ITab = {
        id: randomUUID(),
        icon: "file.py",
        name,
        active: true,
        uri: path,
        is_touched: false,
      };

      this.editorTabManager.addTab(newTab);
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
    const folder = await window.folder.get_folder();
    const panel_state = await window.uistate.get_panel_state();
    const editor_tabs = await window.uistate.get_editor_tabs();
    const active_activity_bar_item =
      await window.uistate.get_active_activity_bar_item();
    if (folder) this.fileTree = folder;
    else
      this.fileTree = {
        id: Date.now(),
        root: "",
        name: "",
        type: "folder",
        children: [],
      };
    if (panel_state) this.panelState = panel_state;
    if (editor_tabs) this.editorTabs = editor_tabs;
    if (active_activity_bar_item)
      this.activeActivityBarItem = active_activity_bar_item;
  }

  private async buildLayout() {
    this.tabContentEl = document.createElement("div");
    this.tabContentEl.className = "tab-content";
    this.tabContentEl.style.height = "100%";

    const cleanTree = JSON.parse(JSON.stringify(this.fileTree));
    dispatch(set_folder_structure(cleanTree));

    new TitleBarLayout();

    const layout = this.layoutService.RegisterLayout("main");
    const leftActivityBar = new ActivityBar("left");

    const fileTreeLayout = new FileTreeLayout(
      (this.fileTree as IFolderStructure) ?? null
    );
    const extensionLayout = new ExtensionLayout();
    this.geminiLayout = new GeminiLayout();

    this.terminalManager = new TerminalManager(this.layoutService);
    this.consoleManager = new ConsoleManager(this.layoutService);

    this.splitterLayout = new SplitterLayout(layout, 70, 30);

    const rightActivityBar = new ActivityBar("right");

    const leftPane = this.layoutService.RegisterSplitterPane(
      "leftPane",
      this.splitterLayout,
      "top",
      20
    );

    let leftActivityBarContent: ActivityBarContentLayout;
    let rightActivityBarContent: ActivityBarContentLayout;

    leftActivityBarContent = this.layoutService.RegisterActivityBarContent(
      leftPane,
      "leftActivityBarContent",
      undefined,
      true
    );

    const middlePane = this.layoutService.RegisterSplitterPane(
      "middlePane",
      this.splitterLayout,
      "top",
      60
    );

    const rightPane = this.layoutService.RegisterSplitterPane(
      "rightPane",
      this.splitterLayout,
      "top",
      20
    );

    const bottomPane = this.layoutService.RegisterSplitterPane(
      "bottomPane",
      this.splitterLayout,
      "bottom"
    );

    rightActivityBarContent = this.layoutService.RegisterActivityBarContent(
      rightPane,
      "rightActivityBarContent"
    );

    const editorLayout = this.layoutService.RegisterEditorLayout(middlePane);
    const terminalLayout =
      this.layoutService.RegisterTerminalLayout(bottomPane);
    const consoleLayout = this.layoutService.RegisterConsoleLayout(bottomPane);

    const editorContentWrapper = document.createElement("div");
    editorContentWrapper.className = "editor-content-wrapper";
    editorContentWrapper.style.width = "100%";
    editorContentWrapper.style.height = "100%";

    terminalLayout
      .getDomElement()!
      .appendChild(this.terminalManager.getContentWrapper());

    consoleLayout
      .getDomElement()!
      .appendChild(this.consoleManager.getContentWrapper());

    const addEditorTabButton = document.createElement("button");
    addEditorTabButton.innerHTML = addIcon;

    addEditorTabButton.onclick = async () => {
      await this.createNewEditorTab();
    };

    const editorTabs = this.layoutService.RegisterTabsLayout(
      editorLayout.getDomElement()!,
      [addEditorTabButton],
      null as any,
      "--editor-tabs-bg"
    );

    document
      .querySelector(".editor-layout-wrapper")
      ?.appendChild(editorContentWrapper);

    const getEditorTabsState = () => select((s) => s.main.editor_tabs);

    const updateEditorTabs = (
      tabs: ITab[],
      getStateTabs: () => ITab[],
      updateAction: any,
      onTabClick?: () => void | undefined
    ) => {
      if (tabs.length === 0) {
        editorTabs.hide();
        this.editorService.destroy();
        return;
      } else {
        this.editorService.show();
        if (!this.editorService.getEditor()) editorTabs.show();
      }

      editorTabs.removeAllTabs();
      tabs.forEach((tab) => {
        this.layoutService.RegisterTabLayout(
          tab.name,
          tab.active,
          editorTabs,
          getStateTabs,
          updateAction,
          true,
          onTabClick,
          tab.icon as string,
          undefined,
          tab
        );
      });
    };

    const renderEditorTabs = (tabs: ITab[]) => {
      this.editorTabManager.tabs = tabs;

      updateEditorTabs(tabs, getEditorTabsState, update_editor_tabs, () => {});

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

      this.editorService.hide();
      setTabContentDisplay("none");

      if (active?.content) {
        const contentKey = active?.content ?? active?.uri;
        const contentEl = TabContentManager.getContent(contentKey);

        if (contentEl instanceof Node) {
          this.editorService.hide();
          setTabContentDisplay("block");
          setTabContent(contentEl);
        } else {
          setTabContentDisplay("none");
          this.editorService.mount(editorContentWrapper);
          this.editorService.open(active);
        }
      } else if (active) {
        setTabContentDisplay("none");
        this.editorService.mount(editorContentWrapper);
        this.editorService.open(active);
      }
    };

    const editorTabsState = select((s) => s.main.editor_tabs);
    renderEditorTabs(editorTabsState);
    editorContentWrapper.appendChild(this.tabContentEl);

    watch(
      (s) => s.main.editor_tabs,
      (next) => {
        renderEditorTabs(next);
        dispatch(
          update_editor_active_tab(next.find((tab) => tab.active) as ITab)
        );
      }
    );

    this.layoutService.RegisterActivityBarItem(
      leftActivityBar,
      fileTreeLayout.render(),
      leftActivityBarContent!.getDomElement() as HTMLDivElement,
      explorerIcon,
      "explorer",
      "top",
      true
    );

    this.layoutService.RegisterActivityBarItem(
      leftActivityBar,
      extensionLayout.getDomElement()!,
      leftActivityBarContent!.getDomElement() as HTMLDivElement,
      extensionIcon,
      "extension",
      "top",
      false
    );

    this.layoutService.RegisterActivityBarItem(
      leftActivityBar,
      this.consoleManager.getContentWrapper(),
      bottomPane.getDomElement()!,
      consoleIcon,
      "console",
      "bottom",
      false
    );

    this.layoutService.RegisterActivityBarItem(
      leftActivityBar,
      this.terminalManager.getContentWrapper(),
      bottomPane.getDomElement()!,
      terminalIcon,
      "terminal",
      "bottom",
      true
    );

    this.layoutService.RegisterActivityBarItem(
      leftActivityBar,
      undefined as any,
      undefined as any,
      settingsIcon,
      "settings",
      "bottom",
      false,
      handleOpenSettingsTab
    );

    this.layoutService.RegisterActivityBarItem(
      rightActivityBar,
      this.geminiLayout.getDomElement() as HTMLDivElement,
      rightActivityBarContent!.getDomElement() as HTMLDivElement,
      GeminiIcon,
      "gemini",
      "top",
      false
    );

    this.layoutService.RegisterActivityBarItem(
      rightActivityBar,
      this.structureLayout.getDomElement()!,
      rightActivityBarContent!.getDomElement() as HTMLDivElement,
      structureIcon,
      "structure",
      "top",
      true
    );

    const statusBar = new StatusBarLayout();
    const settingsController = SettingsController.getInstance();

    function setElementVisibility(element: HTMLElement, visible: boolean) {
      element.style.display = visible ? "flex" : "none";
    }

    const statusBarElement = statusBar.getDomElement();
    const activityBarElement = leftActivityBar.getDomElement();

    const updateStatusBarVisibility = (visible: boolean) =>
      setElementVisibility(statusBarElement, visible);
    const updateActivityBarVisibility = (visible: boolean) =>
      setElementVisibility(activityBarElement!, visible);

    const defaultStatusBarVisibility = settingsController.get(
      "workbench.statusBar.visible"
    );
    const defaultActivityBarVisibility = settingsController.get(
      "workbench.activityBar.visible"
    );

    updateStatusBarVisibility(defaultStatusBarVisibility);
    updateActivityBarVisibility(defaultActivityBarVisibility);

    const watcherStatusBar = settingsController.onChange(
      "workbench.statusBar.visible",
      updateStatusBarVisibility
    );
    const watcherActivityBar = settingsController.onChange(
      "workbench.activityBar.visible",
      updateActivityBarVisibility
    );

    this.settingsWatchers.push(watcherStatusBar, watcherActivityBar);

    const statusBarController = new StatusBarController();

    const mainItem = statusBarController.createActivityItem({ id: "fileName" });
    const languageItem = statusBarController.createActivityItem({
      id: "language",
    });
    const spacingItem = statusBarController.createActivityItem({
      id: "spacing",
    });
    const lineItem = statusBarController.createActivityItem({ id: "line" });
    const encodingItem = statusBarController.createActivityItem({
      id: "encoding",
    });

    mainItem.textContent = "main";
    languageItem.textContent = "Python";
    spacingItem.textContent = "Spaces: 4";
    encodingItem.textContent = "UTF-8";
    lineItem.textContent = "Ln 1, Col 35";

    statusBarController.addItemToPrimary(mainItem);

    let debounceTimer: number | null = null;

    watch(
      (s) => s.main.editor_active_tab,
      (next) => {
        if (debounceTimer) clearTimeout(debounceTimer);

        debounceTimer = window.setTimeout(() => {
          debounceTimer = null;

          this.cursorListener?.dispose();
          this.cursorListener = null;

          mainItem.textContent = next?.name ?? "main";

          if (next && next.uri && this.editorService.editor) {
            const { line, column } = this.editorService.getLineCols() || {};
            const { spaces } = this.editorService.getIndent() || {};
            const fileType = get_file_types(next.name);
            const language =
              fileType.charAt(0).toUpperCase() + fileType.slice(1);

            lineItem.textContent = `Ln ${line}, Col ${column}`;
            spacingItem.textContent = `Spaces: ${spaces}`;
            languageItem.textContent = language;

            statusBarController.addItemToGlobal(lineItem);
            statusBarController.addItemToGlobal(encodingItem);
            statusBarController.addItemToGlobal(spacingItem);
            statusBarController.addItemToGlobal(languageItem);

            this.cursorListener =
              this.editorService.editor.onDidChangeCursorPosition((e) => {
                lineItem.textContent = `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
              });
          } else {
            ["indent", "line", "encoding", "spacing", "language"].forEach(
              (id) => {
                statusBarController.removeItemById(id);
              }
            );
          }
        }, 50);
      }
    );

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
        const paneEl = rightPane.getDomElement();
        if (!paneEl) return;

        if (next.right === "off") {
          this.splitterLayout.hideTopPane(paneEl);
        } else {
          this.splitterLayout.showTopPane(paneEl);
        }
      }
    );

    watch(
      (s) => s.main.panel_state,
      (next) => {
        if (next.bottom === "on") {
          this.splitterLayout.toggleBottomSplitter(true);
        } else {
          this.splitterLayout.toggleBottomSplitter(false);
        }
      }
    );

    watch(
      (s) => s.main.panel_state,
      (next) => {
        window.uistate.set_panel_state(next);
      }
    );

    watch(
      (s) => s.main.editor_tabs,
      (next) => {
        window.uistate.set_editor_tabs(next);
      }
    );

    watch(
      (s) => s.main.active_activityBaritem,
      (next) => {
        window.uistate.set_active_activity_bar_item(next);
      }
    );

    dispatch(update_panel_state(this.panelState!));
    dispatch(update_editor_tabs(this.editorTabs!));
    dispatch(update_active_activitybar_item(this.activeActivityBarItem!));

    this.registerRunButtonHandler();
    this.loadScrollbar();
  }

  private registerRunButtonHandler() {
    commands.addCommand("workbench.editor.run", async () => {
      const { left, right } = store.getState().main.panel_state;
      const activeEditorTab = select((s) =>
        s.main.editor_tabs.find((t) => t.active)
      );

      if (!activeEditorTab || !activeEditorTab.uri) {
        window.dialog.showError({
          title: "Error",
          content: "Please open an editor to run a file.",
        });
        return;
      }

      const currentFilePath = activeEditorTab.uri;

      if (!currentFilePath.endsWith(".py")) {
        window.dialog.showError({
          title: "Error: Invalid file type",
          content: "Only Python files are allowed to run.",
        });
        return;
      }

      const command = `${window.python.getPythonPath()} "${currentFilePath}"`;
      const terminal = await this.terminalManager.executeCommand(command);

      if (!terminal) {
        window.dialog.showError({
          title: "Error",
          content: "Please open a terminal to run a file.",
        });
        return;
      }

      dispatch(
        update_panel_state({
          left,
          right,
          bottom: "on",
        })
      );

      const active_activity_bar_item = select(
        (s) => s.main.active_activityBaritem
      );

      dispatch(
        update_active_activitybar_item({
          left: {
            ...active_activity_bar_item.left,
            bottom: "run",
          },
          right: {
            ...active_activity_bar_item.right,
          },
        })
      );

      this.geminiLayout.scrollToBottom();
    });
  }
}
