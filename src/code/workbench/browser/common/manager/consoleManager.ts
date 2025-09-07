import { SpawnConsole } from "../../../common/spawnConsole.js";
import { select, watch } from "../../../common/store/selectors.js";
import { update_console_tabs } from "../../../common/store/mainSlice.js";
import { ITab } from "../../../../../typings/types.js";
import { randomUUID } from "../../../common/functions.js";
import { TabManager } from "./tabManager.js";
import { LayoutService } from "../services/LayoutService.js";
import { addIcon } from "../../../common/svgIcons.js";

export class ConsoleManager {
  private consoles = new Map<string, SpawnConsole>();
  private currentConsole: SpawnConsole | null = null;
  private consoleContentWrapper!: HTMLDivElement;
  private consoleInstanceWrapper!: HTMLDivElement;
  private consoleTabManager: TabManager<ITab>;
  private layoutService: LayoutService;
  private consoleTabs: any;

  constructor(layoutService: LayoutService) {
    this.layoutService = layoutService;
    this.consoleTabManager = new TabManager(update_console_tabs); // Different action
    this.setupConsoleUI();
    this.setupWatchers();

    // Create initial tab immediately
    setTimeout(() => {
      this.createInitialConsoleTab();
    }, 0);
  }

  private setupConsoleUI() {
    // Create console content wrapper
    this.consoleContentWrapper = document.createElement("div");
    this.consoleContentWrapper.className = "console-content-wrapper";
    this.consoleContentWrapper.style.width = "100%";
    this.consoleContentWrapper.style.height = "100%";
    this.consoleContentWrapper.style.position = "relative";

    // Create console instance wrapper
    this.consoleInstanceWrapper = document.createElement("div");
    this.consoleInstanceWrapper.className = "console-instance-wrapper";
    this.consoleInstanceWrapper.style.width = "100%";
    this.consoleInstanceWrapper.style.height = "100%";
    this.consoleInstanceWrapper.style.position = "relative";

    // Create add console tab button
    const addConsoleTabButton = document.createElement("button");
    addConsoleTabButton.innerHTML = addIcon;
    addConsoleTabButton.onclick = async () => {
      await this.createNewConsoleTab();
    };

    // Setup console tabs layout
    this.consoleTabs = this.layoutService.RegisterTabsLayout(
      this.consoleContentWrapper,
      [addConsoleTabButton]
    );

    this.consoleContentWrapper.appendChild(this.consoleInstanceWrapper);
  }

  private setupWatchers() {
    watch(
      (s) => s.main.console_tabs, // Different state
      (next) => {
        const previous = select((s) => s.main.console_tabs);

        if (previous) {
          const removedTabs = previous.filter(
            (prevTab) => !next.find((nextTab) => nextTab.id === prevTab.id)
          );
          removedTabs.forEach((removedTab) => {
            this.disposeConsole(String(removedTab.uri!));
          });
        }

        this.renderConsoleTabs(next);
      }
    );
  }

  private createInitialConsoleTab() {
    const initialConsoleTab: ITab = {
      id: randomUUID(),
      name: "Console 1",
      fileIcon: "file.bat",
      active: true,
      uri: randomUUID(),
      is_touched: false,
    };

    this.consoleTabManager.addTab(initialConsoleTab);
  }

  public async createNewConsoleTab() {
    const consoleTabs = select((s) => s.main.console_tabs) || [];
    const consoleId = randomUUID();
    const consoleNumber = consoleTabs.length + 1;

    const newConsoleTab: ITab = {
      id: consoleId,
      name: `Console ${consoleNumber}`,
      fileIcon: "file.bat",
      active: true,
      uri: consoleId,
      is_touched: false,
    };

    this.consoleTabManager.addTab(newConsoleTab);
  }

  private async createConsoleInstance(
    consoleId: string
  ): Promise<SpawnConsole> {
    if (this.consoles.has(consoleId)) {
      return this.consoles.get(consoleId)!;
    }

    const consoleContainer = document.createElement("div");
    consoleContainer.className = "console-instance";
    consoleContainer.style.width = "100%";
    consoleContainer.style.display = "none";
    consoleContainer.style.position = "relative";

    const updateHeight = () => {
      const availableHeight = this.consoleInstanceWrapper.offsetHeight;
      const calculatedHeight = Math.max(availableHeight - 53);
      consoleContainer.style.height = calculatedHeight + "px";
    };

    updateHeight();

    const observer = new ResizeObserver(() => {
      updateHeight();

      setTimeout(() => {
        const console = this.consoles.get(consoleId);
        if (console && !console.getIsDisposed()) {
          console.forceFit();
        }
      }, 100);
    });
    observer.observe(this.consoleInstanceWrapper);

    this.consoleInstanceWrapper.appendChild(consoleContainer);

    const consoleIdStr = String(consoleId);
    let ptyId: number;

    if (consoleIdStr.length >= 8) {
      ptyId = parseInt(consoleIdStr.slice(-8), 16) % 10000;
    } else {
      ptyId =
        consoleIdStr.split("").reduce((acc, char, index) => {
          return acc + char.charCodeAt(0) * (index + 1);
        }, 0) % 10000;
    }

    if (ptyId === 0) ptyId = 1;

    const console = new SpawnConsole(consoleContainer, ptyId + 10000, {
      // Different ptyId range
      rows: 30,
      cols: 80,
    });

    this.consoles.set(consoleId, console);

    await window.ipc.send("ptyInstance.spawn", {
      id: ptyId + 10000,
      shell: "/home/timeuser/.local/bin/ipython",
    });

    return console;
  }

  private async switchToConsole(consoleId: string) {
    const consoleIdStr = String(consoleId);

    if (this.currentConsole) {
      const currentContainer = this.consoleContentWrapper.querySelector(
        '.console-instance[style*="display: block"], .console-instance[style*="display: flex"]'
      ) as HTMLElement;
      if (currentContainer) {
        currentContainer.style.display = "none";
      }
    }

    const console = await this.createConsoleInstance(consoleIdStr);

    const containers =
      this.consoleContentWrapper.querySelectorAll(".console-instance");
    let targetContainer: any = null;

    containers.forEach((container) => {
      const containerElement = container as HTMLElement;
      if (
        console.terminal.element?.parentElement?.parentElement ===
        containerElement
      ) {
        targetContainer = containerElement;
      }
    });

    if (targetContainer) {
      targetContainer.style.display = "block";
      this.currentConsole = console;

      setTimeout(() => {
        if (!console.getIsDisposed()) {
          console.forceFit();
        }
      }, 150);
    }
  }

  private disposeConsole(consoleId: string) {
    const consoleIdStr = String(consoleId);
    const console = this.consoles.get(consoleIdStr);
    if (console) {
      console.dispose();
      this.consoles.delete(consoleIdStr);

      const containers =
        this.consoleContentWrapper.querySelectorAll(".console-instance");
      containers.forEach((container) => {
        const containerElement = container as HTMLElement;
        if (
          console.terminal.element?.parentElement?.parentElement ===
          containerElement
        ) {
          containerElement.remove();
        }
      });
    }
  }

  private renderConsoleTabs(tabs: ITab[]) {
    this.consoleTabManager.tabs = tabs;

    const getConsoleTabsState = () => select((s) => s.main.console_tabs);

    if (tabs.length === 0) {
      this.consoleTabs.hide();
      return;
    }
    this.consoleTabs.show();
    this.consoleTabs.removeAllTabs();

    tabs.forEach(async (tab) => {
      this.layoutService.RegisterTabLayout(
        tab.name,
        tab.active,
        this.consoleTabs,
        getConsoleTabsState,
        update_console_tabs as any,
        false,
        () => {
          this.switchToConsole(String(tab.uri!));
        },
        tab.fileIcon as string,
        undefined,
        tab
      );
    });

    const activeConsole = tabs.find((t) => t.active);
    if (activeConsole) {
      this.switchToConsole(String(activeConsole.uri!));
    }
  }

  public getContentWrapper(): HTMLDivElement {
    return this.consoleContentWrapper;
  }

  public getCurrentConsole(): SpawnConsole | null {
    return this.currentConsole;
  }

  public getActiveConsoleTab(): ITab | undefined {
    return select((s) => s.main.console_tabs?.find((t) => t.active));
  }

  public async executeCommand(command: string): Promise<SpawnConsole | null> {
    let activeConsoleTab = this.getActiveConsoleTab();

    if (!activeConsoleTab) {
      await this.createNewConsoleTab();
      await new Promise((resolve) => setTimeout(resolve, 100));
      activeConsoleTab = this.getActiveConsoleTab();

      if (!activeConsoleTab) {
        return null;
      }
    }

    const consoleId = String(activeConsoleTab.uri);
    let console = this.consoles.get(consoleId);

    if (!console) {
      console = await this.createConsoleInstance(consoleId);
    }

    if (console) {
      console.executeCommand(command);
    }

    return console;
  }
}
