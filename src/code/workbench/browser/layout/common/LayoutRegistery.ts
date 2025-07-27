import { ITab } from "../../../../../typings/types.js";
import { EditorLayout } from "../editorLayout.js";
import { SidebarContentLayout } from "../sidebarContentLayout.js";
import { SidebarItemLayout } from "../sidebarItemLayout.js";
import { Sidebar } from "../sidebarLayout.js";
import { SplitterLayout } from "../splitterLayout.js";
import { SplitterPaneLayout } from "../splitterPaneLayout.js";
import { TabLayout } from "../tabLayout.js";
import { TabsLayout } from "../tabsLayout.js";
import { TerminalLayoutWrapper } from "../terminalLayoutWrapper.js";

export class LayoutService {
  constructor() {}

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

  public RegisterSplitterLayout(
    topSplitterHeight: number,
    bottomSplitterHeight: number,
    parent: HTMLDivElement
  ) {
    const splitterLayout = new SplitterLayout(
      parent,
      topSplitterHeight,
      bottomSplitterHeight
    );
    return splitterLayout;
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

  public RegisterSidebar(side: "left" | "right") {
    const sidebar = new Sidebar(side);
    return sidebar;
  }

  public RegisterSidebarContent(
    pane: SplitterPaneLayout,
    uniqueId: string,
    style?: [
      {
        attribute: string;
        value: string;
      }
    ]
  ) {
    const sidebarcontent = new SidebarContentLayout(uniqueId);
    const sidebarContentElement = sidebarcontent.render();
    style?.forEach(({ attribute, value }) => {
      sidebarContentElement.style.setProperty(attribute, value);
    });

    pane.addContent(sidebarContentElement);
    return sidebarcontent;
  }

  public RegisterSidebarItem(
    sidebar: Sidebar,
    content: HTMLDivElement,
    contentWrapper: HTMLDivElement,
    icon: string,
    id: string,
    position: "top" | "bottom",
    activeByDefault: boolean
  ) {
    const sidebaritem = new SidebarItemLayout(
      sidebar,
      icon,
      id,
      content,
      contentWrapper,
      position,
      activeByDefault
    );

    return sidebaritem;
  }

  public RegisterTabsLayout(parent: HTMLDivElement) {
    const tabsWrapper = new TabsLayout(parent);
    return tabsWrapper;
  }

  public RegisterTabLayout(
    icon: string,
    name: string,
    active: boolean,
    content: HTMLDivElement,
    contentWrapper: HTMLDivElement,
    tabsLayout: TabsLayout,
    storeTabs: () => ITab[],
    updateStoreTabs: Function,
    isEditor: boolean
  ) {
    const tab = new TabLayout(
      icon,
      name,
      active,
      content,
      contentWrapper,
      storeTabs,
      updateStoreTabs,
      isEditor
    );
    tabsLayout.addTab(tab.tab);
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
