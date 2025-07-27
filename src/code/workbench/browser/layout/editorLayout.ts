export class EditorLayout {
  constructor() {}

  public render() {
    const editorLayoutWrapper = document.createElement("div");
    editorLayoutWrapper.className = "editor-layout-wrapper";

    return editorLayoutWrapper;
  }

  public getDomElement() {
    const editorLayoutWrapper = document.querySelector(
      ".editor-layout-wrapper"
    ) as HTMLDivElement;

    return editorLayoutWrapper;
  }
}
