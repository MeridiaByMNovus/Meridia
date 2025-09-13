import * as monaco from "monaco-editor";
import { EventEmitter } from "events";
import { ITab } from "../../../typings/types.js";

export type RPCRequest = { id: number; method: string; args: any[] };
export type RPCResponse = { id: number; result?: any; error?: string };

class Core extends EventEmitter {
  private commandRegistry = new Map<string, (...args: any[]) => any>();

  public workbench = {
    file: {
      openTab: (tab: ITab) => {
        this.emit("workbench.file.openTab", tab);
        return tab;
      },
      closeTab: (tabId: string) => {
        this.emit("workbench.file.closeTab", tabId);
      },
      saveTab: (tabId: string) => {
        this.emit("workbench.file.saveTab", tabId);
      },
      saveAllTabs: () => {
        this.emit("workbench.file.saveAllTabs");
      },
    },
    tab: {
      registerContent: (uri: string, content: HTMLElement) => {
        this.emit("workbench.tab.registerContent", uri, content);
      },
      unregisterContent: (uri: string) => {
        this.emit("workbench.tab.unregisterContent", uri);
      },
      setActiveTab: (tabId: string) => {
        this.emit("workbench.tab.setActiveTab", tabId);
      },
      getActiveItem: () => {
        const results = this.emitCollect("workbench.tab.getActiveItem");
        return results[0];
      },
    },
    titlebar: {
      registerAction: (innerHtml: string, id: string, action: () => void) => {
        this.emit("workbench.titlebar.registerAction", innerHtml, id, action);
      },
      unregisterAction: (id: string) => {
        this.emit("workbench.titlebar.unregisterAction", id);
      },
    },
    activityBar: {
      registerItem: (
        id: string,
        icon: string,
        position: "top" | "bottom",
        content: HTMLElement,
        onClickHook?: () => void
      ) => {
        this.emit(
          "workbench.activityBar.registerItem",
          id,
          icon,
          position,
          content,
          onClickHook
        );
      },
      unregisterItem: (id: string) => {
        this.emit("workbench.activityBar.unregisterItem", id);
      },
      setActiveItem: (id: string) => {
        this.emit("workbench.activityBar.setActiveItem", id);
      },
      getActiveItem: () => {
        const results = this.emitCollect("workbench.activityBar.getActiveItem");
        return results[0];
      },
    },
    statusBar: {
      registerItem: (item: HTMLSpanElement) => {
        this.emit("workbench.statusBar.registerItem", item);
      },
      unregisterItem: (item: HTMLSpanElement) => {
        this.emit("workbench.statusBar.unregisterItem", item);
      },
      updateItem: (item: HTMLSpanElement, content: string) => {
        this.emit("workbench.statusBar.updateItem", item, content);
      },
    },
  };

  public editor = {
    getEditor: () => {
      const results = this.emitCollect("workbench.editor.getEditor");
      return results[0] as monaco.editor.IStandaloneCodeEditor | undefined;
    },
    setContent: (content: string) => {
      this.emit("workbench.editor.setContent", content);
    },
    appendContent: (content: string) => {
      this.emit("workbench.editor.appendContent", content);
    },
    deleteLine: (lineNumber: number) => {
      this.emit("workbench.editor.deleteLine", lineNumber);
    },
    deleteLines: (startLine: number, endLine: number) => {
      this.emit("workbench.editor.deleteLines", startLine, endLine);
    },
    addDecorations: (decorations: any[]) => {
      this.emit("workbench.editor.addDecorations", decorations);
    },
    removeDecorations: (decorationIds: string[]) => {
      this.emit("workbench.editor.removeDecorations", decorationIds);
    },
    setCursorPosition: (position: { line: number; column: number }) => {
      this.emit("workbench.editor.setCursorPosition", position);
    },
    getContent: (): string => {
      const results = this.emitCollect("workbench.editor.getContent");
      return results[0] ?? "";
    },
    replaceContent: (range: any, newText: string) => {
      this.emit("workbench.editor.replaceContent", range, newText);
    },
    insertContent: (position: any, newText: string) => {
      this.emit("workbench.editor.insertContent", position, newText);
    },
    getLine: (lineNumber: number): string => {
      const results = this.emitCollect("workbench.editor.getLine", lineNumber);
      return results[0] ?? "";
    },
    getLines: (startLine: number, endLine: number): string[] => {
      const results = this.emitCollect(
        "workbench.editor.getLines",
        startLine,
        endLine
      );
      return results[0] ?? [];
    },
    undo: () => {
      this.emit("workbench.editor.undo");
    },
    redo: () => {
      this.emit("workbench.editor.redo");
    },
    findText: (query: string, options?: any) => {
      const results = this.emitCollect(
        "workbench.editor.findText",
        query,
        options
      );
      return results[0];
    },
    replaceText: (query: string, replacement: string, options?: any) => {
      this.emit("workbench.editor.replaceText", query, replacement, options);
    },
    setSelection: (range: any) => {
      this.emit("workbench.editor.setSelection", range);
    },
    getSelection: () => {
      const results = this.emitCollect("workbench.editor.getSelection");
      return results[0];
    },
    scrollToLine: (lineNumber: number) => {
      this.emit("workbench.editor.scrollToLine", lineNumber);
    },
    on: (event: string, callback: () => void) => {
      this.on(event, callback);
    },
    off: (event: string, callback: () => void) => {
      this.off(event, callback);
    },
    clearContent: () => {
      this.emit("workbench.editor.clearContent");
    },
    getCursorPosition: () => {
      const results = this.emitCollect("workbench.editor.getCursorPosition");
      return results[0] ?? { line: 0, column: 0 };
    },
    isModified: (): boolean => {
      const results = this.emitCollect("workbench.editor.isModified");
      return results[0] ?? false;
    },
    setLanguageMode: (mode: string) => {
      this.emit("workbench.editor.setLanguageMode", mode);
    },
    getDecorations: () => {
      const results = this.emitCollect("workbench.editor.getDecorations");
      return results[0] ?? [];
    },
    foldLine: (lineNumber: number) => {
      this.emit("workbench.editor.foldLine", lineNumber);
    },
    unfoldLine: (lineNumber: number) => {
      this.emit("workbench.editor.unfoldLine", lineNumber);
    },
    toggleLineComment: (lineNumber: number) => {
      this.emit("workbench.editor.toggleLineComment", lineNumber);
    },
    getWordAtPosition: (position: { line: number; column: number }) => {
      const results = this.emitCollect(
        "workbench.editor.getWordAtPosition",
        position
      );
      return results[0];
    },
    getAllWords: (): string[] => {
      const results = this.emitCollect("workbench.editor.getAllWords");
      return results[0] ?? [];
    },
    formatDocument: () => {
      this.emit("workbench.editor.formatDocument");
    },
    toggleFoldAtLine: (lineNumber: number) => {
      this.emit("workbench.editor.toggleFoldAtLine", lineNumber);
    },
    revealRange: (range: any) => {
      this.emit("workbench.editor.revealRange", range);
    },
    replaceSelection: (newText: string) => {
      this.emit("workbench.editor.replaceSelection", newText);
    },
    onDidChangeContent: (callback: () => void) => {
      this.on("workbench.editor.didChangeContent", callback);
    },
  };

  registerCommand(name: string, fn: (...args: any[]) => any) {
    this.commandRegistry.set(name, fn);
  }

  public filesystem = {
    createFile: (filePath: string, content: string) => {
      const response = this.emitCollect(
        "filesystem.createFile",
        filePath,
        content
      );
      return response;
    },
    deleteFile: (filePath: string) => {
      const response = this.emitCollect("filesystem.deleteFile", filePath);
      return response;
    },
    renameFile: (filePath: string, newName: string) => {
      const response = this.emitCollect(
        "filesystem.renameFile",
        filePath,
        newName
      );
      return response;
    },
    moveFile: (filePath: string, newPath: string) => {
      const response = this.emitCollect(
        "filesystem.moveFile",
        filePath,
        newPath
      );
      return response;
    },
    changeFileContent: (filePath: string, content: string) => {
      const response = this.emitCollect(
        "filesystem.changeFileContent",
        filePath,
        content
      );
      return response;
    },
  };

  processRPC(msg: RPCRequest): RPCResponse {
    const { id, method, args } = msg;
    const command = this.commandRegistry.get(method);
    if (!command) return { id, error: "Command not found" };
    try {
      const result = command(...args);
      this.emit(method, ...args);
      return { id, result };
    } catch (e) {
      return { id, error: (e as Error).message };
    }
  }

  emitCollect(event: string, ...args: any[]): any[] {
    const listeners = this.listeners(event);
    return listeners.map((listener) => listener(...args));
  }
}

export { Core, ITab };
