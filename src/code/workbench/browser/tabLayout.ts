import {
  TabController,
  TabConfig,
  TabData,
} from "./common/controller/TabController.js";

export class TabLayout {
  public tabDomElement: HTMLDivElement;
  private controller: TabController;

  constructor(
    name: string,
    active: boolean,
    getStoreTabs: () => TabData[],
    updateStoreTabs: (tabs: TabData[]) => any,
    isEditor?: boolean,
    onTabClickHook?: () => void,
    fileIcon?: string,
    customIcon?: string,
    tabData?: TabData
  ) {
    const config: TabConfig = {
      name,
      active,
      isEditor,
      fileIcon,
      customIcon,
      tabData,
    };

    this.controller = new TabController(
      config,
      getStoreTabs,
      updateStoreTabs,
      onTabClickHook
    );

    this.tabDomElement = this.controller.createTabElement();
  }

  public getTabId(): string {
    return this.controller.getTabId();
  }

  public updateTab(updates: Partial<TabConfig>) {
    this.controller.updateConfig(updates);
    // Recreate the tab element with updated config
    const newElement = this.controller.createTabElement();
    this.tabDomElement.replaceWith(newElement);
    this.tabDomElement = newElement;
  }

  public setActive(active: boolean) {
    if (active) {
      this.tabDomElement.classList.add("active");
    } else {
      this.tabDomElement.classList.remove("active");
    }
  }

  public setTouched(touched: boolean) {
    if (touched) {
      this.tabDomElement.classList.add("touched");
    } else {
      this.tabDomElement.classList.remove("touched");
    }
  }

  public destroy() {
    this.tabDomElement.remove();
  }
}
