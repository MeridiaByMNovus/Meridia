import { EditorService } from "../../../editor/common/EditorService.js";
import { dispatch } from "../../common/store/store.js";
import { getIconForFile } from "../../service/IconService/IconService.js";

export class TabLayout {
  public tabDomElement: HTMLDivElement;
  private tabId: string;

  constructor(
    private name: string,
    private active: boolean,
    private content: HTMLElement,
    private contentWrapper: HTMLDivElement,
    private getStoreTabs: () => any,
    private updateStoreTabs: Function,
    private isEditor?: boolean,
    private onTabClickHook?: Function,
    private fileIcon?: string,
    private customIcon?: string,
    private tabData?: any
  ) {
    this.tabDomElement = document.createElement("div");
    this.tabId = tabData?.id || this.generateFallbackId();
    this.setupTab();
  }

  private generateFallbackId(): string {
    const baseId = this.tabData?.uri || this.tabData?.content || this.name;
    return btoa(baseId)
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 10);
  }

  private findTabInStore(): any {
    const tabs = this.getStoreTabs();

    let currentTab = null;

    if (this.tabId) {
      currentTab = tabs.find((t: any) => t.id === this.tabId);
      if (currentTab) return currentTab;
    }

    if (this.tabData?.uri) {
      currentTab = tabs.find((t: any) => t.uri === this.tabData.uri);
      if (currentTab) return currentTab;
    }

    if (this.tabData?.content) {
      currentTab = tabs.find((t: any) => t.content === this.tabData.content);
      if (currentTab) return currentTab;
    }

    currentTab = tabs.find((t: any) => {
      const nameMatches = t.name === this.name;
      const typeMatches = !!t.content === !!this.tabData?.content;
      return nameMatches && typeMatches;
    });

    return currentTab;
  }

  private setupTab() {
    this.tabDomElement.className = `tab-layout-wrapper${
      this.active ? " active" : ""
    }`;

    const name = document.createElement("span");
    name.className = "text-wrap";
    name.innerHTML = this.name;

    const icon = document.createElement("div");
    icon.className = "tab-icon";

    if (this.customIcon) {
      // Use custom icon HTML
      icon.innerHTML = this.customIcon;
    } else {
      // Use file icon image
      const img = document.createElement("img");
      img.alt = this.fileIcon ? this.fileIcon : "file.py";
      img.src = `./code/resources/assets/fileIcons/${getIconForFile(
        this.fileIcon ? this.fileIcon : "file.py"
      )}`;
      icon.appendChild(img);
    }

    const iconWrapper = document.createElement("div");
    iconWrapper.className = "icon-wrapper";

    const dot = document.createElement("span");
    dot.className = "touch-dot";

    const close = document.createElement("span");
    close.className = "close-icon";
    close.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" width="800px" height="800px" viewBox="-0.5 0 25 25" fill="none">
  <path d="M3 21.32L21 3.32001" stroke="#ccc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M3 3.32001L21 21.32" stroke="#ccc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

    this.tabDomElement.appendChild(icon);
    this.tabDomElement.appendChild(name);
    this.tabDomElement.appendChild(iconWrapper);
    iconWrapper.appendChild(dot);
    iconWrapper.appendChild(close);

    const currentTab = this.findTabInStore();
    const isTouched = !!currentTab?.is_touched;

    if (isTouched) {
      this.tabDomElement.classList.add("touched");
    }

    this.tabDomElement.onclick = () => {
      const tabs = this.getStoreTabs();
      const currentTab = this.findTabInStore();

      if (!currentTab) {
        return;
      }

      const updatedTabs = tabs.map((t: any) => ({
        ...t,
        active: t.id === currentTab.id,
      }));

      dispatch(this.updateStoreTabs(updatedTabs));

      if (this.onTabClickHook) this.onTabClickHook();
    };

    const handleRemove = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const tabs = this.getStoreTabs();
      const currentTabToRemove = this.findTabInStore();

      if (!currentTabToRemove) return;

      const index = tabs.findIndex((t: any) => t.id === currentTabToRemove.id);
      if (index === -1) return;

      // Close editor if it's an editor tab
      if (this.isEditor && !this.tabData?.content) {
        EditorService.get().close(tabs[index].uri);
      }

      // For terminal tabs, the Layout class will handle cleanup via the watch function
      // We just need to remove from the store and the Layout will dispose the terminal instance

      const filtered = tabs.slice(0, index).concat(tabs.slice(index + 1));
      const isActiveClosed = tabs[index].active;
      let updatedTabs = filtered;

      // If the active tab was closed and there are other tabs, activate an adjacent one
      if (isActiveClosed && filtered.length > 0) {
        const newActiveIndex =
          index >= filtered.length ? filtered.length - 1 : index;
        updatedTabs = filtered.map((t: any, i: any) => ({
          ...t,
          active: i === newActiveIndex,
        }));
      }

      dispatch(this.updateStoreTabs(updatedTabs));
      this.tabDomElement.remove();
    };

    close.onclick = handleRemove;

    // Middle mouse button click to close tab
    this.tabDomElement.onmousedown = (e) => {
      if (e.button === 1) handleRemove(e);
    };

    return this.tabDomElement;
  }
}
