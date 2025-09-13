import * as monaco from "monaco-editor";

export class StandaloneProvider {
  public standalone:
    | monaco.editor.IStandaloneCodeEditor
    | monaco.editor.IStandaloneDiffEditor
    | HTMLElement
    | null = null;

  dispose() {
    if (
      "dispose" in this.standalone! &&
      typeof this.standalone.dispose === "function"
    ) {
      this.standalone.dispose();
    }
  }
}
