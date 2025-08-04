import { ITab } from "../../../../../typings/types.js";
import { EditorLayout } from "../editorLayout.js";
import { ActivityBarContentLayout } from "../activityBarContentLayout.js";
import { ActivtyBarItemLayout } from "../activityBarItemLayout.js";
import { ActivityBar } from "../activityBarLayout.js";
import { SplitterPaneLayout } from "../splitterPaneLayout.js";
import { TabLayout } from "../tabLayout.js";
import { TabsLayout } from "../tabsLayout.js";
import { TerminalLayoutWrapper } from "../terminalLayoutWrapper.js";
import { SplitterLayout } from "../splitterLayout.js";

export class LayoutService {
  constructor() {}

  public getPane(id: string) {
    return document.getElementById(id) as HTMLDivElement;
  }

  public RegisterLayout(id: string) {
    const mainWrapper = document.querySelector(
      ".main-wrapper"
    ) as HTMLDivElement;
    const layoutRow = document.createElement("div");
    layoutRow.className = "layout-row";
    layoutRow.id = id;
    mainWrapper.appendChild(layoutRow);

    return layoutRow;
  }

  public RegisterSplitterPane(
    id: string,
    splitterLayout: SplitterLayout,
    position: "top" | "bottom",
    size: number = 100
  ) {
    const splitterPane = new SplitterPaneLayout(id);

    if (position === "top")
      splitterLayout.addTopSplitterPane(splitterPane.render(), size);
    else splitterLayout.addBottomSplitterPane(splitterPane.render());

    return splitterPane;
  }

  public RegisterActivityBarContent(
    pane: SplitterPaneLayout,
    uniqueId: string,
    style?: [
      {
        attribute: string;
        value: string;
      },
    ]
  ) {
    const activityBarContent = new ActivityBarContentLayout(uniqueId);
    const activityBarContentElement = activityBarContent.render();
    style?.forEach(({ attribute, value }) => {
      activityBarContentElement.style.setProperty(attribute, value);
    });

    pane.addContent(activityBarContentElement);
    return activityBarContent;
  }

  public RegisterActivityBarItem(
    activityBar: ActivityBar,
    content: HTMLDivElement,
    contentWrapper: HTMLDivElement,
    icon: string,
    id: string,
    position: "top" | "bottom",
    activeByDefault: boolean,
    onClickHook?: Function
  ) {
    const activityBarItem = new ActivtyBarItemLayout(
      activityBar,
      icon,
      id,
      content,
      contentWrapper,
      position,
      activeByDefault,
      onClickHook
    );

    return activityBarItem;
  }

  public RegisterTabsLayout(parent: HTMLDivElement, props?: any[]) {
    const tabsWrapper = new TabsLayout(parent, props);
    return tabsWrapper;
  }

  public RegisterTabLayout(
    name: string,
    active: boolean,
    content: HTMLElement,
    contentWrapper: HTMLDivElement,
    tabsLayout: TabsLayout,
    storeTabs: () => ITab[],
    updateStoreTabs: Function,
    isEditor: boolean,
    onTabClickHook?: Function,
    fileIcon?: string,
    customIcon?: string,
    tabData?: ITab
  ) {
    const tab = new TabLayout(
      name,
      active,
      content,
      contentWrapper,
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

  public RegisterEditorLayout(splitterPane: SplitterPaneLayout) {
    const editorLayout = new EditorLayout();
    const rendered = editorLayout.render();
    splitterPane.addContent(rendered);
    return editorLayout;
  }

  public RegisterTerminalLayout(splitterPane: SplitterPaneLayout) {
    const terminalLayout = new TerminalLayoutWrapper();
    const rendered = terminalLayout.render();
    splitterPane.addContent(rendered);
    return terminalLayout;
  }
}
