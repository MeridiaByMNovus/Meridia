import { EditorService } from "../../../editor/common/EditorService.js";
import { dispatch } from "../../common/store/store.js";
import { getIconForFile } from "../../service/IconService/IconService.js";

export class TabLayout {
  public tab: HTMLDivElement;

  constructor(
    private icon: string,
    private name: string,
    private active: boolean,
    private content: HTMLDivElement,
    private contentWrapper: HTMLDivElement,
    private getStoreTabs: () => any,
    private updateStoreTabs: Function,
    private isEditor?: boolean
  ) {
    this.tab = document.createElement("div");
    this.setupTab();
  }

  private setupTab() {
    this.tab.className = `tab-layout-wrapper${this.active ? " active" : ""}`;

    const name = document.createElement("span");
    name.className = "text-wrap";
    name.innerHTML = this.name;

    const icon = document.createElement("img");
    icon.alt = this.icon;
    icon.src = `./code/resources/assets/fileIcons/${getIconForFile(this.icon)}`;

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

    this.tab.appendChild(icon);
    this.tab.appendChild(name);
    this.tab.appendChild(iconWrapper);
    iconWrapper.appendChild(dot);
    iconWrapper.appendChild(close);

    const currentTab = this.getStoreTabs().find(
      (t: any) => t.name === this.name
    );
    const isTouched = !!currentTab?.is_touched;

    if (isTouched) {
      this.tab.classList.add("touched");
    }

    this.tab.onclick = () => {
      const tabs = this.getStoreTabs();
      const updatedTabs = tabs.map((t: any) => ({
        ...t,
        active: t.name === this.name,
      }));
      dispatch(this.updateStoreTabs(updatedTabs));
    };

    const handleRemove = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const tabs = this.getStoreTabs();
      const index = tabs.findIndex((t: any) => t.name === this.name);
      if (index === -1) return;
      if (this.isEditor) EditorService.get().close(tabs[index].uri);
      const filtered = tabs.slice(0, index).concat(tabs.slice(index + 1));
      const isActiveClosed = tabs[index].active;
      let updatedTabs = filtered;
      if (isActiveClosed && filtered.length > 0) {
        const newActiveIndex =
          index >= filtered.length ? filtered.length - 1 : index;
        updatedTabs = filtered.map((t: any, i: any) => ({
          ...t,
          active: i === newActiveIndex,
        }));
      }
      dispatch(this.updateStoreTabs(updatedTabs));
      this.tab.remove();
    };

    close.onclick = handleRemove;

    this.tab.onmousedown = (e) => {
      if (e.button === 1) handleRemove(e);
    };

    return this.tab;
  }
}
