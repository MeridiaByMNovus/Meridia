import { SpawnTerminal } from "../../../common/spawnTerminal.js";
import { select, watch } from "../../../common/store/selectors.js";
import { update_terminal_tabs } from "../../../common/store/mainSlice.js";
import { ITab } from "../../../../../typings/types.js";
import { randomUUID } from "../../../common/functions.js";
import { TabManager } from "./tabManager.js";
import { LayoutService } from "../services/LayoutService.js";
import { addIcon } from "../../../common/svgIcons.js";

export class TerminalManager {
  private terminals = new Map<string, SpawnTerminal>();
  private currentTerminal: SpawnTerminal | null = null;
  private terminalContentWrapper!: HTMLDivElement;
  private terminalInstanceWrapper!: HTMLDivElement;
  private terminalTabManager: TabManager<ITab>;
  private layoutService: LayoutService;
  private terminalTabs: any;

  constructor(layoutService: LayoutService) {
    this.layoutService = layoutService;
    this.terminalTabManager = new TabManager(update_terminal_tabs);
    this.setupTerminalUI();
    this.setupWatchers();

    setTimeout(() => {
      this.createInitialTerminalTab();
    }, 0);
  }

  private setupTerminalUI() {
    this.terminalContentWrapper = document.createElement("div");
    this.terminalContentWrapper.className = "terminal-content-wrapper";
    this.terminalContentWrapper.style.width = "100%";
    this.terminalContentWrapper.style.height = "100%";
    this.terminalContentWrapper.style.position = "relative";

    this.terminalInstanceWrapper = document.createElement("div");
    this.terminalInstanceWrapper.className = "terminal-instance-wrapper";
    this.terminalInstanceWrapper.style.width = "100%";
    this.terminalInstanceWrapper.style.height = "100%";
    this.terminalInstanceWrapper.style.position = "relative";

    const addTerminalTabButton = document.createElement("button");
    addTerminalTabButton.innerHTML = addIcon;
    addTerminalTabButton.onclick = async () => {
      await this.createNewTerminalTab();
    };

    this.terminalTabs = this.layoutService.RegisterTabsLayout(
      this.terminalContentWrapper,
      [addTerminalTabButton]
    );

    this.terminalContentWrapper.appendChild(this.terminalInstanceWrapper);
  }

  private setupWatchers() {
    watch(
      (s) => s.main.terminal_tabs,
      (next) => {
        const previous = select((s) => s.main.terminal_tabs);

        if (previous) {
          const removedTabs = previous.filter(
            (prevTab) => !next.find((nextTab) => nextTab.id === prevTab.id)
          );
          removedTabs.forEach((removedTab) => {
            this.disposeTerminal(String(removedTab.uri!));
          });
        }

        this.renderTerminalTabs(next);
      }
    );
  }

  private createInitialTerminalTab() {
    const initialTerminalTab: ITab = {
      id: randomUUID(),
      name: "Local 1",
      fileIcon: "file.bat",
      active: true,
      uri: randomUUID(),
      is_touched: false,
    };

    this.terminalTabManager.addTab(initialTerminalTab);
  }

  public async createNewTerminalTab() {
    const terminalTabs = select((s) => s.main.terminal_tabs) || [];
    const terminalId = randomUUID();
    const terminalNumber = terminalTabs.length + 1;

    const newTerminalTab: ITab = {
      id: terminalId,
      name: `Local ${terminalNumber}`,
      fileIcon: "file.bat",
      active: true,
      uri: terminalId,
      is_touched: false,
    };

    this.terminalTabManager.addTab(newTerminalTab);
  }

  private async createTerminalInstance(
    terminalId: string
  ): Promise<SpawnTerminal> {
    if (this.terminals.has(terminalId)) {
      return this.terminals.get(terminalId)!;
    }

    const terminalContainer = document.createElement("div");
    terminalContainer.className = "terminal-instance";
    terminalContainer.style.width = "100%";
    terminalContainer.style.display = "none";
    terminalContainer.style.position = "relative";

    const updateHeight = () => {
      const availableHeight = this.terminalInstanceWrapper.offsetHeight;
      const calculatedHeight = Math.max(availableHeight - 53);
      terminalContainer.style.height = calculatedHeight + "px";
    };

    updateHeight();

    const observer = new ResizeObserver(() => {
      updateHeight();

      setTimeout(() => {
        const terminal = this.terminals.get(terminalId);
        if (terminal && !terminal.getIsDisposed()) {
          terminal.forceFit();
        }
      }, 100);
    });
    observer.observe(this.terminalInstanceWrapper);

    this.terminalInstanceWrapper.appendChild(terminalContainer);

    const terminalIdStr = String(terminalId);
    let ptyId: number;

    if (terminalIdStr.length >= 8) {
      ptyId = parseInt(terminalIdStr.slice(-8), 16) % 10000;
    } else {
      ptyId =
        terminalIdStr.split("").reduce((acc, char, index) => {
          return acc + char.charCodeAt(0) * (index + 1);
        }, 0) % 10000;
    }

    if (ptyId === 0) ptyId = 1;

    const terminal = new SpawnTerminal(terminalContainer, ptyId, {
      rows: 30,
      cols: 80,
    });

    this.terminals.set(terminalId, terminal);

    await window.ipc.send("ptyInstance.spawn", ptyId);

    return terminal;
  }

  private async switchToTerminal(terminalId: string) {
    const terminalIdStr = String(terminalId);

    if (this.currentTerminal) {
      const currentContainer = this.terminalContentWrapper.querySelector(
        '.terminal-instance[style*="display: block"], .terminal-instance[style*="display: flex"]'
      ) as HTMLElement;
      if (currentContainer) {
        currentContainer.style.display = "none";
      }
    }

    const terminal = await this.createTerminalInstance(terminalIdStr);

    const containers =
      this.terminalContentWrapper.querySelectorAll(".terminal-instance");
    let targetContainer: any = null;

    containers.forEach((container) => {
      const containerElement = container as HTMLElement;
      if (
        terminal.terminal.element?.parentElement?.parentElement ===
        containerElement
      ) {
        targetContainer = containerElement;
      }
    });

    if (targetContainer) {
      targetContainer.style.display = "block";
      this.currentTerminal = terminal;

      setTimeout(() => {
        if (!terminal.getIsDisposed()) {
          terminal.forceFit();
        }
      }, 150);
    }
  }

  private disposeTerminal(terminalId: string) {
    const terminalIdStr = String(terminalId);
    const terminal = this.terminals.get(terminalIdStr);
    if (terminal) {
      terminal.dispose();
      this.terminals.delete(terminalIdStr);

      const containers =
        this.terminalContentWrapper.querySelectorAll(".terminal-instance");
      containers.forEach((container) => {
        const containerElement = container as HTMLElement;
        if (
          terminal.terminal.element?.parentElement?.parentElement ===
          containerElement
        ) {
          containerElement.remove();
        }
      });
    }
  }

  private renderTerminalTabs(tabs: ITab[]) {
    this.terminalTabManager.tabs = tabs;

    const getTerminalTabsState = () => select((s) => s.main.terminal_tabs);

    if (tabs.length === 0) {
      this.terminalTabs.hide();
      return;
    }
    this.terminalTabs.show();
    this.terminalTabs.removeAllTabs();

    tabs.forEach(async (tab) => {
      this.layoutService.RegisterTabLayout(
        tab.name,
        tab.active,
        this.terminalTabs,
        getTerminalTabsState,
        update_terminal_tabs as any,
        false,
        () => {
          this.switchToTerminal(String(tab.uri!));
        },
        tab.fileIcon as string,
        undefined,
        tab
      );
    });

    const activeTerminal = tabs.find((t) => t.active);
    if (activeTerminal) {
      this.switchToTerminal(String(activeTerminal.uri!));
    }
  }

  public getContentWrapper(): HTMLDivElement {
    return this.terminalContentWrapper;
  }

  public getCurrentTerminal(): SpawnTerminal | null {
    return this.currentTerminal;
  }

  public getActiveTerminalTab(): ITab | undefined {
    return select((s) => s.main.terminal_tabs.find((t) => t.active));
  }

  public async executeCommand(command: string): Promise<SpawnTerminal | null> {
    let activeTermTab = this.getActiveTerminalTab();

    if (!activeTermTab) {
      await this.createNewTerminalTab();
      await new Promise((resolve) => setTimeout(resolve, 100));
      activeTermTab = this.getActiveTerminalTab();

      if (!activeTermTab) {
        return null;
      }
    }

    const terminalId = String(activeTermTab.uri);
    let terminal = this.terminals.get(terminalId);

    if (!terminal) {
      terminal = await this.createTerminalInstance(terminalId);
    }

    if (terminal) {
      terminal.executeCommand(command);
    }

    return terminal;
  }
}
