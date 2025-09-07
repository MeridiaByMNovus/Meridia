import * as monaco from "monaco-editor";
import { ITab } from "../../../../../typings/types";
import { EditorService } from "../../../../editor/common/EditorService.js";
import { Core } from "../../../../platform/extension/core.js";
import { update_editor_tabs } from "../../../common/store/mainSlice";
import { select } from "../../../common/store/selectors.js";
import { dispatch, store } from "../../../common/store/store.js";
import { StatusBarController } from "../controller/StatusBarController";
import { LayoutService } from "../services/LayoutService.js";
import { TabContentManager } from "./tabContentManager";

export function RegisterCoreRequestManager(
  core: Core,
  editorService: EditorService,
  layoutService: LayoutService
) {
  core.on("workbench.tab.registerContent", (uri, content) => {
    TabContentManager.addContent(uri, content);
  });

  core.on("workbench.titlebar.registerAction", (innerHtml, id, action) => {
    const wrapper = document.querySelector(".titlebar") as HTMLDivElement;
    const commandsSection = wrapper.querySelector(
      ".commands"
    ) as HTMLDivElement;
    const actionButton = document.createElement("button");
    actionButton.id = id;
    actionButton.innerHTML = innerHtml;
    actionButton.onclick = action;
    commandsSection.appendChild(actionButton);
  });

  core.on("workbench.file.openTab", async (tab: ITab) => {
    const tabs = store.getState().main.editor_tabs || [];
    const existingTab = tabs.find((t) => t.uri === tab.id);

    if (existingTab) {
      const updatedTabs = tabs.map((tab) => ({
        ...tab,
        active: tab.id === existingTab.id,
      }));

      dispatch(update_editor_tabs(updatedTabs));
    } else {
      const deactivatedTabs = tabs.map((t) => ({ ...t, active: false }));

      const updatedTabs = [...deactivatedTabs, tab];

      dispatch(update_editor_tabs(updatedTabs));
    }
  });

  core.on(
    "workbench.activityBar.registerItem",
    (id, icon, position, content, onClickHook?) => {
      layoutService.RegisterActivityBarItem(
        layoutService.getActivityBar("left")!,
        content,
        layoutService
          .getActivityBarContent("leftActivityBarContent")!
          .getDomElement() as HTMLDivElement,
        icon,
        id,
        position,
        false,
        onClickHook
      );
    }
  );

  core.on("workbench.statusBar.registerItem", (item: HTMLSpanElement) => {
    StatusBarController.getInstance().addItemToGlobal(item);
  });

  core.on("workbench.activityBar.getActiveItem", () => {
    const activeItem = select((s) => s.main.active_activityBaritem);
    return activeItem;
  });

  core.on("workbench.editor.getEditor", () => {
    return editorService.getEditor();
  });

  core.on("workbench.editor.getContent", () => {
    const editor = editorService.getEditor();
    return editor ? editor.getValue() : "";
  });

  core.on("workbench.editor.setContent", (content: string) => {
    const editor = editorService.getEditor();
    if (editor) editor.setValue(content);
  });

  core.on("workbench.editor.appendContent", (content: string) => {
    const editor = editorService.getEditor();
    if (editor) {
      const current = editor.getValue();
      editor.setValue(current + content);
    }
  });

  core.on("workbench.editor.deleteLine", (lineNumber: number) => {
    const editor = editorService.getEditor();
    if (!editor) return;
    const model = editor.getModel();
    if (!model) return;

    const lineCount = model.getLineCount();
    if (lineNumber < 1 || lineNumber > lineCount) return;

    let range;
    if (lineNumber === lineCount) {
      range = new monaco.Range(
        lineNumber,
        1,
        lineNumber,
        model.getLineMaxColumn(lineNumber)
      );
    } else {
      range = new monaco.Range(lineNumber, 1, lineNumber + 1, 1);
    }
    model.pushEditOperations([], [{ range, text: "" }], () => null);
  });

  core.on(
    "workbench.editor.deleteLines",
    (startLine: number, endLine: number) => {
      const editor = editorService.getEditor();
      if (!editor) return;
      const model = editor.getModel();
      if (!model) return;

      const lineCount = model.getLineCount();
      if (startLine < 1 || endLine > lineCount || startLine > endLine) return;
      const range = new monaco.Range(
        startLine,
        1,
        endLine,
        model.getLineMaxColumn(endLine)
      );
      model.pushEditOperations([], [{ range, text: "" }], () => null);
    }
  );

  core.on("workbench.editor.getLine", (lineNumber: number) => {
    const editor = editorService.getEditor();
    if (!editor) return "";
    const model = editor.getModel();
    if (!model) return "";
    if (lineNumber < 1 || lineNumber > model.getLineCount()) return "";
    return model.getLineContent(lineNumber);
  });

  core.on("workbench.editor.getLines", (startLine: number, endLine: number) => {
    const editor = editorService.getEditor();
    if (!editor) return [];
    const model = editor.getModel();
    if (!model) return [];
    const lineCount = model.getLineCount();
    if (startLine < 1) startLine = 1;
    if (endLine > lineCount) endLine = lineCount;
    if (startLine > endLine) return [];
    const lines = [];
    for (let i = startLine; i <= endLine; i++) {
      lines.push(model.getLineContent(i));
    }
    return lines;
  });

  core.on("workbench.editor.undo", () => {
    const editor = editorService.getEditor();
    editor?.trigger("keyboard", "undo", null);
  });

  core.on("workbench.editor.redo", () => {
    const editor = editorService.getEditor();
    editor?.trigger("keyboard", "redo", null);
  });

  core.on("workbench.editor.findText", (query: string, options?: any) => {
    return null;
  });

  core.on(
    "workbench.editor.replaceText",
    (query: string, replacement: string, options?: any) => {
      const editor = editorService.getEditor();
      if (!editor) return;
      const model = editor.getModel();
      if (!model) return;

      const regex = new RegExp(query, options?.flags ?? "g");
      const fullText = model.getValue();
      const newText = fullText.replace(regex, replacement);
      model.setValue(newText);
    }
  );

  core.on("workbench.editor.setSelection", (range: monaco.IRange) => {
    const editor = editorService.getEditor();
    if (!editor) return;
    editor.setSelection(range);
  });

  core.on("workbench.editor.getSelection", () => {
    const editor = editorService.getEditor();
    if (!editor) return null;
    return editor.getSelection();
  });

  core.on("workbench.editor.scrollToLine", (lineNumber: number) => {
    const editor = editorService.getEditor();
    if (!editor) return;
    editor.revealLine(lineNumber);
  });

  core.on("workbench.editor.clearContent", () => {
    const editor = editorService.getEditor();
    if (!editor) return;
    editor.setValue("");
  });

  core.on("workbench.editor.getCursorPosition", () => {
    const editor = editorService.getEditor();
    if (!editor) return { line: 0, column: 0 };
    const position = editor.getPosition();
    return position
      ? { line: position.lineNumber, column: position.column }
      : { line: 0, column: 0 };
  });

  core.on("workbench.editor.isModified", () => {
    return false;
  });

  core.on("workbench.editor.setLanguageMode", (mode: string) => {
    const editor = editorService.getEditor();
    if (!editor) return;
    const model = editor.getModel();
    if (!model) return;
    monaco.editor.setModelLanguage(model, mode);
  });

  core.on("workbench.editor.addDecorations", (decorations: any[]) => {
    const editor = editorService.getEditor();
    if (!editor) return;
    const model = editor.getModel();
    if (!model) return;
  });

  core.on(
    "workbench.editor.removeDecorations",
    (decorationIds: string[]) => {}
  );

  core.on("workbench.editor.foldLine", (lineNumber: number) => {
    const editor = editorService.getEditor();
    if (!editor) return;
    editor.getAction("editor.fold")!.run();
  });

  core.on("workbench.editor.unfoldLine", (lineNumber: number) => {
    const editor = editorService.getEditor();
    if (!editor) return;
    editor.getAction("editor.unfold")!.run();
  });

  core.on("workbench.editor.toggleLineComment", (lineNumber: number) => {
    const editor = editorService.getEditor();
    if (!editor) return;
    editor.setSelection(
      new monaco.Range(
        lineNumber,
        1,
        lineNumber,
        editor.getModel()?.getLineMaxColumn(lineNumber) ?? 1
      )
    );
    editor.trigger("", "editor.action.commentLine", null);
  });

  core.on(
    "workbench.editor.getWordAtPosition",
    (position: { lineNumber: number; column: number }) => {
      const editor = editorService.getEditor();
      if (!editor) return null;
      const model = editor.getModel();
      if (!model) return null;
      return model.getWordAtPosition(position);
    }
  );

  core.on("workbench.editor.getAllWords", () => {
    const editor = editorService.getEditor();
    if (!editor) return [];
    const model = editor.getModel();
    if (!model) return [];
    return model.getValue().match(/\b\w+\b/g) || [];
  });

  core.on("workbench.editor.formatDocument", () => {
    const editor = editorService.getEditor();
    if (!editor) return;
    editor.getAction("editor.action.formatDocument")!.run();
  });

  core.on("workbench.editor.toggleFoldAtLine", (lineNumber: number) => {
    const editor = editorService.getEditor();
    if (!editor) return;
  });

  core.on("workbench.editor.revealRange", (range: monaco.IRange) => {
    const editor = editorService.getEditor();
    if (!editor) return;
    editor.revealRange(range);
  });

  core.on("workbench.editor.replaceSelection", (newText: string) => {
    const editor = editorService.getEditor();
    if (!editor) return;
    const selection = editor.getSelection();
    if (!selection) return;
    editor.executeEdits("", [
      { range: selection, text: newText, forceMoveMarkers: true },
    ]);
  });

  core.on("workbench.editor.didChangeContent", (callback: Function) => {
    const editor = editorService.getEditor();
    if (!editor) return;
    editor.onDidChangeModelContent((e) => callback(e));
  });
}
