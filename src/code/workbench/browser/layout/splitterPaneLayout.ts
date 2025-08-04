export class SplitterPaneLayout {
  private domElement?: HTMLDivElement;

  constructor(public id: string) {}

  public render(): HTMLDivElement {
    if (!this.domElement) {
      this.domElement = document.createElement("div");
      this.domElement.id = this.id;
      this.domElement.className = "splitter-pane-layout";
    }
    return this.domElement;
  }

  public mount(parent: HTMLDivElement) {
    const el = this.render();
    parent.appendChild(el);
  }

  public addContent(content: HTMLDivElement) {
    const el = this.getDomElement();
    if (el) {
      el.appendChild(content);
    }
  }

  public getDomElement(): HTMLDivElement | null {
    return (
      this.domElement || (document.getElementById(this.id) as HTMLDivElement)
    );
  }
}
