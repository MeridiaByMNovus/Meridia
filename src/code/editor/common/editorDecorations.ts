import * as monaco from "monaco-editor";

export class EditorDecorations {
  private editor: monaco.editor.IStandaloneCodeEditor;
  private decorationIds: string[] = [];
  private tabColors = ["#FF6F61", "#6B5B95", "#88B04B", "#FFA500"];
  private pendingUpdate: number | null = null;
  private isUpdating: boolean = false;

  constructor(editor: monaco.editor.IStandaloneCodeEditor) {
    this.editor = editor;
    this.scheduleTabDecorationsUpdate();
    this.editor.updateOptions({ glyphMargin: true });
    this.editor.onDidChangeModel(() => {
      this.scheduleTabDecorationsUpdate();
    });
    this.editor.onDidChangeModelContent(() => {
      this.scheduleTabDecorationsUpdate();
    });
  }

  private scheduleTabDecorationsUpdate() {
    if (this.pendingUpdate !== null) {
      clearTimeout(this.pendingUpdate);
    }
    this.pendingUpdate = window.setTimeout(() => {
      this.updateTabLevelDecorations();
      this.pendingUpdate = null;
    }, 30);
  }

  public updateTabLevelDecorations() {
    if (this.isUpdating) return;
    this.isUpdating = true;
    try {
      if (!this.editor) return;
      const model = this.editor.getModel();
      if (!model) return;
      const newDecorations: monaco.editor.IModelDeltaDecoration[] = [];
      const tabSize = this.editor.getOption("tabSize" as any) || 4;
      const colorCount = this.tabColors.length;
      for (
        let lineNumber = 1;
        lineNumber <= model.getLineCount();
        lineNumber++
      ) {
        const lineContent = model.getLineContent(lineNumber);
        if (!lineContent) continue;
        const leadingWhitespace = lineContent.match(/^(\s*)/)?.[1] || "";
        let tabLevel = 0;
        for (const ch of leadingWhitespace) {
          if (ch === "\t") {
            tabLevel++;
          } else {
            tabLevel += 1 / tabSize;
          }
        }
        tabLevel = Math.floor(tabLevel);
        if (tabLevel > 0) {
          const colorIndex = ((tabLevel - 1) % colorCount) + 1;
          const firstNonWhitespaceColumn = leadingWhitespace.length + 1;
          newDecorations.push({
            range: new monaco.Range(
              lineNumber,
              1,
              lineNumber,
              firstNonWhitespaceColumn
            ),
            options: {
              isWholeLine: false,
              className: `tab-level-background tab-level-${colorIndex}`,
            },
          });
        }
      }
      this.decorationIds = this.editor.deltaDecorations(
        this.decorationIds,
        newDecorations
      );
    } finally {
      this.isUpdating = false;
    }
  }
}
