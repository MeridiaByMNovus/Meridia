import { ITab } from "../../../../../typings/types.js";
import { EditorLayout } from "../../editorLayout.js";
import { ActivityBarContentLayout } from "../../activityBarContentLayout.js";
import { ActivtyBarItemLayout } from "../../activityBarItemLayout.js";
import { ActivityBar } from "../../activityBarLayout.js";
import { SplitterPaneLayout } from "../../splitterPaneLayout.js";
import { TabLayout } from "../../tabLayout.js";
import { TabsLayout } from "../../tabsLayout.js";
import { TerminalLayoutWrapper } from "../../terminalLayoutWrapper.js";
import { SplitterLayout } from "../../splitterLayout.js";
import { TabData } from "../controller/TabController.js";
import { ConsoleLayoutWrapper } from "../../consoleLayoutWrapper.js";
import { RunLayoutWrapper } from "../../runLayoutWrapper.js";

interface StyleProperty {
  attribute: string;
  value: string;
}

interface LayoutCache {
  activityBars: Map<string, ActivityBar>;
  activityBarContents: Map<string, ActivityBarContentLayout>;
  splitterPanes: Map<string, SplitterPaneLayout>;
  tabsLayouts: Map<string, TabsLayout>;
  editorLayouts: Map<string, EditorLayout>;
  terminalLayouts: Map<string, TerminalLayoutWrapper>;
  consoleLayouts: Map<string, ConsoleLayoutWrapper>;
}

export class LayoutService {
  private cache: LayoutCache = {
    activityBars: new Map(),
    activityBarContents: new Map(),
    splitterPanes: new Map(),
    tabsLayouts: new Map(),
    editorLayouts: new Map(),
    terminalLayouts: new Map(),
    consoleLayouts: new Map(),
  };

  constructor() {}

  public destroy(): void {
    this.cache.activityBars.clear();
    this.cache.activityBarContents.clear();
    this.cache.splitterPanes.clear();
    this.cache.tabsLayouts.clear();
    this.cache.editorLayouts.clear();
    this.cache.terminalLayouts.clear();

    document.querySelector(".layout-row")?.remove();
  }

  public getPane(id: string): HTMLDivElement | null {
    return document.getElementById(id) as HTMLDivElement;
  }

  public getCachedActivityBar(id: string): ActivityBar | undefined {
    return this.cache.activityBars.get(id);
  }

  public getCachedActivityBarContent(
    id: string
  ): ActivityBarContentLayout | undefined {
    return this.cache.activityBarContents.get(id);
  }

  public getCachedSplitterPane(id: string): SplitterPaneLayout | undefined {
    return this.cache.splitterPanes.get(id);
  }

  public getActivityBar(position: "left" | "right"): ActivityBar | undefined {
    return this.cache.activityBars.get(`${position}-activity-bar`);
  }

  public getActivityBarContent(
    id: string
  ): ActivityBarContentLayout | undefined {
    return this.cache.activityBarContents.get(id);
  }

  public RegisterLayout(id: string): HTMLDivElement {
    const mainWrapper = document.querySelector(".code") as HTMLDivElement;
    if (!mainWrapper) {
      throw new Error("Main wrapper element not found");
    }

    const layoutRow = document.createElement("div");
    layoutRow.className = "layout-row";
    layoutRow.id = id;
    mainWrapper.appendChild(layoutRow);

    return layoutRow;
  }

  public RegisterActivityBar(
    position: "left" | "right",
    parent?: HTMLElement
  ): ActivityBar {
    const id = `${position}-activity-bar`;

    const existing = this.cache.activityBars.get(id);
    if (existing) {
      return existing;
    }

    const activityBar = new ActivityBar(position);
    this.cache.activityBars.set(id, activityBar);

    if (parent) {
      parent.appendChild(activityBar.getDomElement()!);
    }

    return activityBar;
  }

  public RegisterSplitterPane(
    id: string,
    splitterLayout: SplitterLayout,
    position: "top" | "bottom",
    size: number = 100
  ): SplitterPaneLayout {
    const existing = this.cache.splitterPanes.get(id);
    if (existing) {
      return existing;
    }

    const splitterPane = new SplitterPaneLayout(id);
    this.cache.splitterPanes.set(id, splitterPane);

    if (position === "top") {
      splitterLayout.addTopSplitterPane(splitterPane.getDomElement()!, size);
    } else {
      splitterLayout.addBottomSplitterPane(splitterPane.getDomElement()!);
    }

    return splitterPane;
  }

  public RegisterActivityBarContent(
    pane: SplitterPaneLayout,
    uniqueId: string,
    styles?: StyleProperty[],
    scrollbar?: boolean
  ): ActivityBarContentLayout {
    const existing = this.cache.activityBarContents.get(uniqueId);
    if (existing) {
      return existing;
    }

    const activityBarContent = new ActivityBarContentLayout(
      uniqueId,
      scrollbar
    );
    const activityBarContentElement = activityBarContent.getDomElement()!;

    styles?.forEach(({ attribute, value }) => {
      activityBarContentElement.style.setProperty(attribute, value);
    });

    pane.addContent(activityBarContentElement);
    this.cache.activityBarContents.set(uniqueId, activityBarContent);

    return activityBarContent;
  }

  public RegisterActivityBarItem(
    activityBar: ActivityBar,
    content: HTMLDivElement | null,
    contentWrapper: HTMLDivElement,
    icon: string,
    id: string,
    position: "top" | "bottom",
    activeByDefault: boolean,
    onClickHook?: Function
  ): ActivtyBarItemLayout {
    const activityBarItem = new ActivtyBarItemLayout(
      activityBar,
      icon,
      id,
      content!,
      contentWrapper,
      position,
      activeByDefault,
      onClickHook
    );

    return activityBarItem;
  }

  public RegisterTabsLayout(
    parent: HTMLDivElement,
    props?: any[],
    id?: string,
    customBg?: string
  ): TabsLayout {
    const tabsId = id || `tabs-${Date.now()}`;

    const existing = this.cache.tabsLayouts.get(tabsId);
    if (existing) {
      return existing;
    }

    const tabsWrapper = new TabsLayout(parent, props, customBg);
    this.cache.tabsLayouts.set(tabsId, tabsWrapper);

    return tabsWrapper;
  }

  public RegisterTabLayout(
    name: string,
    active: boolean,
    tabsLayout: TabsLayout,
    storeTabs: () => ITab[],
    updateStoreTabs: (tabs: TabData[]) => void | undefined,
    isEditor: boolean,
    onTabClickHook?: () => void | undefined,
    fileIcon?: string,
    customIcon?: string,
    tabData?: ITab
  ): TabLayout {
    const tab = new TabLayout(
      name,
      active,
      storeTabs,
      updateStoreTabs,
      isEditor,
      onTabClickHook,
      fileIcon,
      customIcon,
      tabData
    );

    tabsLayout.addTab(tab.tabDomElement);
    return tab;
  }

  public RegisterEditorLayout(
    splitterPane: SplitterPaneLayout,
    id?: string
  ): EditorLayout {
    const editorId = id || `editor-${Date.now()}`;

    const existing = this.cache.editorLayouts.get(editorId);
    if (existing) {
      return existing;
    }

    const editorLayout = new EditorLayout();
    const rendered = editorLayout.getDomElement();

    if (rendered) {
      splitterPane.addContent(rendered as HTMLDivElement);
    }

    this.cache.editorLayouts.set(editorId, editorLayout);
    return editorLayout;
  }

  public RegisterTerminalLayout(
    splitterPane: SplitterPaneLayout,
    id?: string
  ): TerminalLayoutWrapper {
    const terminalId = id || `terminal-${Date.now()}`;

    const existing = this.cache.terminalLayouts.get(terminalId);
    if (existing) {
      return existing;
    }

    const terminalLayout = new TerminalLayoutWrapper();
    const domElement = terminalLayout.getDomElement();

    if (domElement) {
      splitterPane.addContent(domElement as HTMLDivElement);
    }

    this.cache.terminalLayouts.set(terminalId, terminalLayout);
    return terminalLayout;
  }

  public RegisterConsoleLayout(
    splitterPane: SplitterPaneLayout,
    id?: string
  ): ConsoleLayoutWrapper {
    const consoleId = id || `console-${Date.now()}`;

    const existing = this.cache.consoleLayouts.get(consoleId);
    if (existing) {
      return existing;
    }

    const consoleLayout = new ConsoleLayoutWrapper();
    const domElement = consoleLayout.getDomElement();

    if (domElement) {
      splitterPane.addContent(domElement as HTMLDivElement);
    }

    this.cache.consoleLayouts.set(consoleId, consoleLayout);
    return consoleLayout;
  }
}
