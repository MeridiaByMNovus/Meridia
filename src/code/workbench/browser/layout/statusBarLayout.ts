export class StatusBarLayout {
  constructor() {
    this.createStatusBar();
  }

  private createStatusBar() {
    const statusBarWrapper = document.createElement("div");
    statusBarWrapper.className = "status-bar";

    (document.querySelector(".main-wrapper") as HTMLDivElement).appendChild(
      statusBarWrapper
    );
  }

  getDomElement() {
    return document.querySelector(".status-bar") as HTMLDivElement;
  }
}
