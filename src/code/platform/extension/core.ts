import * as monaco from "monaco-editor";
import { EventEmitter } from "events";
import { ITab } from "../../../typings/types.js";
import { PyrightProvider } from "./pyright-api.js";

export type RPCRequest = { id: number; method: string; args: any[] };
export type RPCResponse = { id: number; result?: any; error?: string };

class Core extends EventEmitter {
  private commandRegistry = new Map<string, (...args: any[]) => any>();
  private currentEditor: monaco.editor.IStandaloneCodeEditor | null = null;

  public workbench = {
    file: {
      openTab: (tab: ITab) => {
        this.emit("workbench.file.openTab", tab);
        return tab;
      },
    },
    tab: {
      registerContent: (uri: string, content: HTMLElement) => {
        this.emit("workbench.tab.registerContent", uri, content);
      },
    },
    titlebar: {
      registerAction: (innerHtml: string, id: string, action: () => void) => {
        this.emit("workbench.titlebar.registerAction", innerHtml, id, action);
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
    },
    statusBar: {
      registerItem: (item: HTMLSpanElement) => {
        this.emit("workbench.statusBar.registerItem", item);
      },
    },
  };

  registerCommand(name: string, fn: (...args: any[]) => any) {
    this.commandRegistry.set(name, fn);
  }

  setCurrentEditor(editor: monaco.editor.IStandaloneCodeEditor) {
    this.currentEditor = editor;
  }

  processRPC(msg: any): any {
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
}

export { Core, PyrightProvider };
