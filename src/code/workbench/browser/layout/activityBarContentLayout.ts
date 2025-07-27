export class ActivityBarContentLayout {
  constructor(private uniqueId: string) {}

  public render() {
    const sidebarContentWrapper = document.createElement("div");
    sidebarContentWrapper.className = `activity-bar-content activity-bar-content-${this.uniqueId} scrollbar-container`;

    return sidebarContentWrapper;
  }

  public getDomElement() {
    return document.querySelector(
      `.activity-bar-content-${this.uniqueId}`
    ) as HTMLDivElement;
  }
}
