export class SidebarContentLayout {
  constructor(private uniqueId: string) {}

  public render() {
    const sidebarContentWrapper = document.createElement("div");
    sidebarContentWrapper.className = `content-wrapper content-wrapper-${this.uniqueId} scrollbar-container`;

    return sidebarContentWrapper;
  }

  public getDomElement() {
    return document.querySelector(
      `.content-wrapper-${this.uniqueId}`
    ) as HTMLDivElement;
  }
}
