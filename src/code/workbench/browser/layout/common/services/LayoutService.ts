import { ITab } from "../../../../../../typings/types.js";
import { EditorLayout } from "../../editorLayout.js";
import { ActivityBarContentLayout } from "../../activityBarContentLayout.js";
import { ActivtyBarItemLayout } from "../../activityBarItemLayout.js";
import { ActivityBar } from "../../activityBarLayout.js";
import { SplitterPaneLayout } from "../../splitterPaneLayout.js";
import { TabLayout } from "../../tabLayout.js";
import { TabsLayout } from "../../tabsLayout.js";
import { TerminalLayoutWrapper } from "../../terminalLayoutWrapper.js";
import { SplitterLayout } from "../../splitterLayout.js";

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
}

export class LayoutService {
  private cache: LayoutCache = {
    activityBars: new Map(),
    activityBarContents: new Map(),
    splitterPanes: new Map(),
    tabsLayouts: new Map(),
    editorLayouts: new Map(),
    terminalLayouts: new Map(),
  };

  constructor() {}

  public destroy(): void {
    // Clean up all cached elements
    this.cache.activityBars.clear();
    this.cache.activityBarContents.clear();
    this.cache.splitterPanes.clear();
    this.cache.tabsLayouts.clear();
    this.cache.editorLayouts.clear();
    this.cache.terminalLayouts.clear();

    // Remove main layout
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

  // Enhanced method with better naming and caching
  public getActivityBar(position: "left" | "right"): ActivityBar | undefined {
    return this.cache.activityBars.get(`${position}-activity-bar`);
  }

  public getActivityBarContent(
    id: string
  ): ActivityBarContentLayout | undefined {
    return this.cache.activityBarContents.get(id);
  }

  public RegisterLayout(id: string): HTMLDivElement {
    const mainWrapper = document.querySelector(
      ".main-wrapper"
    ) as HTMLDivElement;
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

    // Check if already exists
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
    // Check if already exists
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
    // Check if already exists
    const existing = this.cache.activityBarContents.get(uniqueId);
    if (existing) {
      return existing;
    }

    const activityBarContent = new ActivityBarContentLayout(
      uniqueId,
      scrollbar
    );
    const activityBarContentElement = activityBarContent.getDomElement()!;

    // Apply styles if provided
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
    updateStoreTabs: Function,
    isEditor: boolean,
    onTabClickHook?: Function,
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

    // Check if already exists
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

    // Check if already exists
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

  // Additional utility methods that were used in the Layout class

  /**
   * Create a button element with SVG icon
   */
  public createButtonWithIcon(
    svgContent: string,
    onClick?: () => void
  ): HTMLButtonElement {
    const button = document.createElement("button");
    button.innerHTML = svgContent;

    if (onClick) {
      button.onclick = onClick;
    }

    return button;
  }

  /**
   * Create add tab button for editor tabs
   */
  public createAddEditorTabButton(
    onClickHandler: () => void
  ): HTMLButtonElement {
    const svgIcon = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="var(--icon-color)">
      <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
      <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
      <g id="SVGRepo_iconCarrier">
        <title></title>
        <g id="Complete">
          <g data-name="add" id="add-2">
            <g>
              <line fill="none" stroke="var(--icon-color)" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="19" y2="5"></line>
              <line fill="none" stroke="var(--icon-color)" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="5" x2="19" y1="12" y2="12"></line>
            </g>
          </g>
        </g>
      </g>
    </svg>`;

    return this.createButtonWithIcon(svgIcon, onClickHandler);
  }

  /**
   * Create add tab button for terminal tabs
   */
  public createAddTerminalTabButton(
    onClickHandler: () => void
  ): HTMLButtonElement {
    return this.createAddEditorTabButton(onClickHandler); // Same icon for now
  }

  /**
   * Get predefined activity bar icons
   */
  public getActivityBarIcons() {
    return {
      explorer: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="var(--icon-color)">
        <path d="M3 8.2C3 7.07989 3 6.51984 3.21799 6.09202C3.40973 5.71569 3.71569 5.40973 4.09202 5.21799C4.51984 5 5.0799 5 6.2 5H9.67452C10.1637 5 10.4083 5 10.6385 5.05526C10.8425 5.10425 11.0376 5.18506 11.2166 5.29472C11.4184 5.4184 11.5914 5.59135 11.9373 5.93726L12.0627 6.06274C12.4086 6.40865 12.5816 6.5816 12.7834 6.70528C12.9624 6.81494 13.1575 6.89575 13.3615 6.94474C13.5917 7 13.8363 7 14.3255 7H17.8C18.9201 7 19.4802 7 19.908 7.21799C20.2843 7.40973 20.5903 7.71569 20.782 8.09202C21 8.51984 21 9.0799 21 10.2V15.8C21 16.9201 21 17.4802 20.782 17.908C20.5903 18.2843 20.2843 18.5903 19.908 18.782C19.4802 19 18.9201 19 17.8 19H6.2C5.07989 19 4.51984 19 4.09202 18.782C3.71569 18.5903 3.40973 18.2843 3.21799 17.908C3 17.4802 3 16.9201 3 15.8V8.2Z" stroke="var(--icon-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,

      extension: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
        <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
        <g id="SVGRepo_iconCarrier">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M13 3H21V11H13V3ZM15 5H19V9H15V5Z" fill="var(--icon-color)"></path>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M17 21V13H11V7H3V21H17ZM9 9H5V13H9V9ZM5 19L5 15H9V19H5ZM11 19V15H15V19H11Z" fill="var(--icon-color)"></path>
        </g>
      </svg>`,

      settings: `<svg viewBox="0 0 30 30" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns" fill="var(--icon-color)">
        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
        <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
        <g id="SVGRepo_iconCarrier">
          <title>settings</title>
          <desc>Created with Sketch Beta.</desc>
          <defs></defs>
          <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" sketch:type="MSPage">
            <g id="Icon-Set" sketch:type="MSLayerGroup" transform="translate(-101.000000, -360.000000)" fill="var(--icon-color)">
              <path d="M128.52,381.134 L127.528,382.866 C127.254,383.345 126.648,383.508 126.173,383.232 L123.418,381.628 C122.02,383.219 120.129,384.359 117.983,384.799 L117.983,387 C117.983,387.553 117.54,388 116.992,388 L115.008,388 C114.46,388 114.017,387.553 114.017,387 L114.017,384.799 C111.871,384.359 109.98,383.219 108.582,381.628 L105.827,383.232 C105.352,383.508 104.746,383.345 104.472,382.866 L103.48,381.134 C103.206,380.656 103.369,380.044 103.843,379.769 L106.609,378.157 C106.28,377.163 106.083,376.106 106.083,375 C106.083,373.894 106.28,372.838 106.609,371.843 L103.843,370.232 C103.369,369.956 103.206,369.345 103.48,368.866 L104.472,367.134 C104.746,366.656 105.352,366.492 105.827,366.768 L108.582,368.372 C109.98,366.781 111.871,365.641 114.017,365.201 L114.017,363 C114.017,362.447 114.46,362 115.008,362 L116.992,362 C117.54,362 117.983,362.447 117.983,363 L117.983,365.201 C120.129,365.641 122.02,366.781 123.418,368.372 L126.173,366.768 C126.648,366.492 127.254,366.656 127.528,367.134 L128.52,368.866 C128.794,369.345 128.631,369.956 128.157,370.232 L125.391,371.843 C125.72,372.838 125.917,373.894 125.917,375 C125.917,376.106 125.72,377.163 125.391,378.157 L128.157,379.769 C128.631,380.044 128.794,380.656 128.52,381.134 L128.52,381.134 Z M130.008,378.536 L127.685,377.184 C127.815,376.474 127.901,375.749 127.901,375 C127.901,374.252 127.815,373.526 127.685,372.816 L130.008,371.464 C130.957,370.912 131.281,369.688 130.733,368.732 L128.75,365.268 C128.203,364.312 126.989,363.983 126.041,364.536 L123.694,365.901 C122.598,364.961 121.352,364.192 119.967,363.697 L119.967,362 C119.967,360.896 119.079,360 117.983,360 L114.017,360 C112.921,360 112.033,360.896 112.033,362 L112.033,363.697 C110.648,364.192 109.402,364.961 108.306,365.901 L105.959,364.536 C105.011,363.983 103.797,364.312 103.25,365.268 L101.267,368.732 C100.719,369.688 101.044,370.912 101.992,371.464 L104.315,372.816 C104.185,373.526 104.099,374.252 104.099,375 C104.099,375.749 104.185,376.474 104.315,377.184 L101.992,378.536 C101.044,379.088 100.719,380.312 101.267,381.268 L103.25,384.732 C103.797,385.688 105.011,386.017 105.959,385.464 L108.306,384.099 C109.402,385.039 110.648,385.809 112.033,386.303 L112.033,388 C112.033,389.104 112.921,390 114.017,390 L117.983,390 C119.079,390 119.967,389.104 119.967,388 L119.967,386.303 C121.352,385.809 122.598,385.039 123.694,384.099 L126.041,385.464 C126.989,386.017 128.203,385.688 128.75,384.732 L130.733,381.268 C131.281,380.312 130.957,379.088 130.008,378.536 L130.008,378.536 Z M116,378 C114.357,378 113.025,376.657 113.025,375 C113.025,373.344 114.357,372 116,372 C117.643,372 118.975,373.344 118.975,375 C118.975,376.657 117.643,378 116,378 L116,378 Z M116,370 C113.261,370 111.042,372.238 111.042,375 C111.042,377.762 113.261,380 116,380 C118.739,380 120.959,377.762 120.959,375 C120.959,372.238 118.739,370 116,370 L116,370 Z" id="settings" sketch:type="MSShapeGroup"></path>
            </g>
          </g>
        </g>
      </svg>`,

      variable: `<svg fill="var(--icon-color)" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" enable-background="new 0 0 52 52" xml:space="preserve">
        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
        <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
        <g id="SVGRepo_iconCarrier">
          <path d="M42.6,17.8c2.4,0,7.2-2,7.2-8.4c0-6.4-4.6-6.8-6.1-6.8c-2.8,0-5.6,2-8.1,6.3c-2.5,4.4-5.3,9.1-5.3,9.1 l-0.1,0c-0.6-3.1-1.1-5.6-1.3-6.7c-0.5-2.7-3.6-8.4-9.9-8.4c-6.4,0-12.2,3.7-12.2,3.7l0,0C5.8,7.3,5.1,8.5,5.1,9.9 c0,2.1,1.7,3.9,3.9,3.9c0.6,0,1.2-0.2,1.7-0.4l0,0c0,0,4.8-2.7,5.9,0c0.3,0.8,0.6,1.7,0.9,2.7c1.2,4.2,2.4,9.1,3.3,13.5l-4.2,6 c0,0-4.7-1.7-7.1-1.7s-7.2,2-7.2,8.4s4.6,6.8,6.1,6.8c2.8,0,5.6-2,8.1-6.3c2.5-4.4,5.3-9.1,5.3-9.1c0.8,4,1.5,7.1,1.9,8.5 c1.6,4.5,5.3,7.2,10.1,7.2c0,0,5,0,10.9-3.3c1.4-0.6,2.4-2,2.4-3.6c0-2.1-1.7-3.9-3.9-3.9c-0.6,0-1.2,0.2-1.7,0.4l0,0 c0,0-4.2,2.4-5.6,0.5c-1-2-1.9-4.6-2.6-7.8c-0.6-2.8-1.3-6.2-2-9.5l4.3-6.2C35.5,16.1,40.2,17.8,42.6,17.8z"></path>
        </g>
      </svg>`,
    };
  }

  /**
   * Setup visibility watchers for layout elements
   */
  public setupElementVisibilityWatcher(
    element: HTMLElement,
    settingsController: any,
    settingsKey: string,
    watchers: (() => void)[]
  ): void {
    const updateVisibility = (visible: boolean) => {
      element.style.display = visible ? "flex" : "none";
    };

    // Set initial visibility
    const initialVisibility = settingsController.get(settingsKey);
    updateVisibility(initialVisibility);

    // Watch for changes
    const watcher = settingsController.onChange(settingsKey, updateVisibility);
    watchers.push(watcher);
  }

  /**
   * Remove all cached elements by type
   */
  public clearCache(type?: keyof LayoutCache): void {
    if (type) {
      this.cache[type].clear();
    } else {
      Object.values(this.cache).forEach((cache) => cache.clear());
    }
  }

  /**
   * Get cache statistics for debugging
   */
  public getCacheStats(): Record<string, number> {
    return {
      activityBars: this.cache.activityBars.size,
      activityBarContents: this.cache.activityBarContents.size,
      splitterPanes: this.cache.splitterPanes.size,
      tabsLayouts: this.cache.tabsLayouts.size,
      editorLayouts: this.cache.editorLayouts.size,
      terminalLayouts: this.cache.terminalLayouts.size,
    };
  }

  /**
   * Check if service has been initialized
   */
  public isInitialized(): boolean {
    return document.querySelector(".layout-row") !== null;
  }

  /**
   * Force refresh of all cached elements
   */
  public refreshAllElements(): void {
    // This could be extended to actually refresh the UI elements
    console.log("Refreshing all layout elements...");
  }
}
