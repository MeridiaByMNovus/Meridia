export class SplitterPaneLayout {
  constructor(private id: string) {}

  public render() {
    const splitterPane = document.createElement("div");
    splitterPane.id = this.id;
    splitterPane.className = "splitter-pane-layout ";

    return splitterPane;
  }

  public addContent(content: HTMLDivElement) {
    const splitterPane = document.getElementById(this.id) as HTMLDivElement;

    splitterPane.appendChild(content);
  }

  public getDomElement() {
    return document.getElementById(this.id) as HTMLDivElement;
  }
}
