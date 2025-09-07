import { EditorService } from "../../../../editor/common/EditorService.js";
import { dispatch } from "../../../common/store/store.js";
import { getIconForFile } from "../../../service/IconService/IconService.js";

export interface TabData {
  id?: string;
  uri?: string;
  content?: string;
  name?: string;
  active?: boolean;
  is_touched?: boolean;
}

export interface TabConfig {
  name: string;
  active: boolean;
  isEditor?: boolean;
  fileIcon?: string;
  customIcon?: string;
  tabData?: TabData;
}

export class TabController {
  private tabId: string;

  constructor(
    private config: TabConfig,
    private getStoreTabs: () => TabData[],
    private updateStoreTabs: (tabs: TabData[]) => any,
    private onTabClickHook?: () => void
  ) {
    this.tabId = this.generateTabId();
  }

  public createTabElement(): HTMLDivElement {
    const tabElement = document.createElement("div");
    tabElement.className = `tab-layout-wrapper${this.config.active ? " active" : ""}`;

    const { icon, name, iconWrapper } = this.createTabComponents();

    tabElement.appendChild(icon);
    tabElement.appendChild(name);
    tabElement.appendChild(iconWrapper);

    this.attachEventListeners(tabElement, iconWrapper);
    this.updateTabState(tabElement);

    return tabElement;
  }

  private generateTabId(): string {
    if (this.config.tabData?.id) {
      return this.config.tabData.id;
    }

    const baseId =
      this.config.tabData?.uri ||
      this.config.tabData?.content ||
      this.config.name;
    return btoa(baseId)
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 10);
  }

  private createTabComponents() {
    const name = document.createElement("span");
    name.className = "text-wrap";
    name.innerHTML = this.config.name;

    const icon = this.createTabIcon();
    const iconWrapper = this.createIconWrapper();

    return { icon, name, iconWrapper };
  }

  private createTabIcon(): HTMLDivElement {
    const icon = document.createElement("div");
    icon.className = "tab-icon";

    if (this.config.customIcon) {
      icon.innerHTML = this.config.customIcon;
    } else {
      const img = document.createElement("img");
      const iconName = this.config.fileIcon || "file.py";
      img.alt = iconName;
      img.src = `./code/resources/assets/fileIcons/${getIconForFile(iconName)}`;
      icon.appendChild(img);
    }

    return icon;
  }

  private createIconWrapper(): HTMLDivElement {
    const iconWrapper = document.createElement("div");
    iconWrapper.className = "icon-wrapper";

    const dot = document.createElement("span");
    dot.className = "touch-dot";

    const close = document.createElement("span");
    close.className = "close-icon";
    close.innerHTML = this.getCloseIconSvg();

    iconWrapper.appendChild(dot);
    iconWrapper.appendChild(close);

    return iconWrapper;
  }

  private getCloseIconSvg(): string {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="800px" height="800px" viewBox="-0.5 0 25 25" fill="none">
        <path d="M3 21.32L21 3.32001" stroke="#ccc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M3 3.32001L21 21.32" stroke="#ccc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }

  private attachEventListeners(
    tabElement: HTMLDivElement,
    iconWrapper: HTMLDivElement
  ) {
    tabElement.onclick = () => this.handleTabClick();

    const closeButton = iconWrapper.querySelector(".close-icon") as HTMLElement;
    closeButton.onclick = (e) => this.handleTabClose(e, tabElement);

    tabElement.onmousedown = (e) => {
      if (e.button === 1) this.handleTabClose(e, tabElement);
    };
  }

  private updateTabState(tabElement: HTMLDivElement) {
    const currentTab = this.findTabInStore();
    if (currentTab?.is_touched) {
      tabElement.classList.add("touched");
    }
  }

  private findTabInStore(): TabData | null {
    const tabs = this.getStoreTabs();

    // Search by ID first
    if (this.tabId) {
      const tabById = tabs.find((t) => t.id === this.tabId);
      if (tabById) return tabById;
    }

    // Search by URI
    if (this.config.tabData?.uri) {
      const tabByUri = tabs.find((t) => t.uri === this.config.tabData?.uri);
      if (tabByUri) return tabByUri;
    }

    // Search by content
    if (this.config.tabData?.content) {
      const tabByContent = tabs.find(
        (t) => t.content === this.config.tabData?.content
      );
      if (tabByContent) return tabByContent;
    }

    // Fallback: search by name and type
    return (
      tabs.find((t) => {
        const nameMatches = t.name === this.config.name;
        const typeMatches = !!t.content === !!this.config.tabData?.content;
        return nameMatches && typeMatches;
      }) || null
    );
  }

  private handleTabClick() {
    const tabs = this.getStoreTabs();
    const currentTab = this.findTabInStore();

    if (!currentTab) return;

    const updatedTabs = tabs.map((t) => ({
      ...t,
      active: t.id === currentTab.id,
    }));

    dispatch(this.updateStoreTabs(updatedTabs));
    this.onTabClickHook?.();
  }

  private handleTabClose(e: MouseEvent, tabElement: HTMLDivElement) {
    e.preventDefault();
    e.stopPropagation();

    const tabs = this.getStoreTabs();
    const currentTabToRemove = this.findTabInStore();

    if (!currentTabToRemove) return;

    this.onTabClickHook?.();

    const tabIndex = tabs.findIndex((t) => t.id === currentTabToRemove.id);
    if (tabIndex === -1) return;

    this.closeEditorIfNeeded(tabs[tabIndex]);

    const updatedTabs = this.removeTabAndUpdateActive(tabs, tabIndex);
    dispatch(this.updateStoreTabs(updatedTabs));

    tabElement.remove();
  }

  private closeEditorIfNeeded(tab: TabData) {
    if (this.config.isEditor && !this.config.tabData?.content && tab.uri) {
      EditorService.get().close(tab.uri);
    }
  }

  private removeTabAndUpdateActive(
    tabs: TabData[],
    removeIndex: number
  ): TabData[] {
    const filtered = tabs
      .slice(0, removeIndex)
      .concat(tabs.slice(removeIndex + 1));
    const wasActive = tabs[removeIndex].active;

    if (!wasActive || filtered.length === 0) {
      return filtered;
    }

    const newActiveIndex =
      removeIndex >= filtered.length ? filtered.length - 1 : removeIndex;
    return filtered.map((t, i) => ({
      ...t,
      active: i === newActiveIndex,
    }));
  }

  public getTabId(): string {
    return this.tabId;
  }

  public updateConfig(config: Partial<TabConfig>) {
    this.config = { ...this.config, ...config };
  }
}
