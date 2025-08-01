export class TerminalLayoutWrapper {
  constructor() {}

  public render() {
    const terminalLayoutWrapper = document.createElement("div");
    terminalLayoutWrapper.className = "terminal-layout-wrapper";
    terminalLayoutWrapper.style.width = "100%";
    terminalLayoutWrapper.style.height = "100%";

    return terminalLayoutWrapper;
  }

  public getDomElement() {
    const terminalLayoutWrapper = document.querySelector(
      ".terminal-layout-wrapper"
    ) as HTMLDivElement;
    return terminalLayoutWrapper;
  }
}
