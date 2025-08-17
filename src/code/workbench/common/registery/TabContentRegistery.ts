export type TabContent = HTMLElement | (() => HTMLElement);

export const TabContentRegistry = new Map<string, TabContent>();
