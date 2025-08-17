import { ITab } from "../../../../../../typings/types.js";
import { dispatch } from "../../../../common/store/store.js";

export class TabManager<T extends ITab> {
  public tabs: T[] = [];

  constructor(private updateTabMethod: Function) {}

  public createInstance(): TabManager<T> {
    return new TabManager<T>(this.updateTabMethod);
  }

  public addTab(tab: T): void {
    const existingTabIndex = this.tabs.findIndex((t) => t.id === tab.id);

    if (existingTabIndex !== -1) {
      this.switchToTab(tab.id);
      return;
    }

    const deactivatedTabs = this.tabs.map((t) => ({ ...t, active: false }));

    const newTab = { ...tab, active: true };
    const updatedTabs = [...deactivatedTabs, newTab];

    this.tabs = updatedTabs;
    dispatch(this.updateTabMethod(updatedTabs));
  }

  public removeTab(tab: T): void {
    const updatedTabs = this.tabs.filter((t) => t.id !== tab.id);

    if (tab.active && updatedTabs.length > 0) {
      updatedTabs[updatedTabs.length - 1].active = true;
    }

    this.tabs = updatedTabs;
    dispatch(this.updateTabMethod(updatedTabs));
  }

  public removeAllTabs(): void {
    this.tabs = [];
    dispatch(this.updateTabMethod([]));
  }

  public switchToTab(tabId: string): void {
    const updatedTabs = this.tabs.map((tab) => ({
      ...tab,
      active: tab.id === tabId,
    }));

    this.tabs = updatedTabs;
    dispatch(this.updateTabMethod(updatedTabs));
  }

  public getActiveTab(): T | undefined {
    return this.tabs.find((tab) => tab.active);
  }

  public getTabById(tabId: string): T | undefined {
    return this.tabs.find((tab) => tab.id === tabId);
  }

  public getAllTabs(): T[] {
    return [...this.tabs];
  }

  public hasTab(tabId: string): boolean {
    return this.tabs.some((tab) => tab.id === tabId);
  }

  public getTabCount(): number {
    return this.tabs.length;
  }

  public updateTab(tabId: string, updates: Partial<T>): void {
    const updatedTabs = this.tabs.map((tab) =>
      tab.id === tabId ? { ...tab, ...updates } : tab
    );

    this.tabs = updatedTabs;
    dispatch(this.updateTabMethod(updatedTabs));
  }

  public moveTab(fromIndex: number, toIndex: number): void {
    if (
      fromIndex < 0 ||
      fromIndex >= this.tabs.length ||
      toIndex < 0 ||
      toIndex >= this.tabs.length
    ) {
      return;
    }

    const updatedTabs = [...this.tabs];
    const [movedTab] = updatedTabs.splice(fromIndex, 1);
    updatedTabs.splice(toIndex, 0, movedTab);

    this.tabs = updatedTabs;
    dispatch(this.updateTabMethod(updatedTabs));
  }

  public closeTabByUri(uri: string): void {
    const tabToClose = this.tabs.find((tab) => tab.uri === uri);
    if (tabToClose) {
      this.removeTab(tabToClose);
    }
  }

  public switchToTabByUri(uri: string): void {
    const tab = this.tabs.find((tab) => tab.uri === uri);
    if (tab) {
      this.switchToTab(tab.id);
    }
  }
}
