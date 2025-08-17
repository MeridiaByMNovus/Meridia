import * as monaco from "monaco-editor";
import { EventEmitter } from "events";
import { ITab } from "../../../typings/types.js";
import {
  LanguageServerConfig,
  LanguageServerProvider,
} from "./LanguageServerProvider.js";
import { LanguageServerRegistry } from "./LanguageServerRegistry.js";
import { PyrightProvider } from "./pyright-api.js";

export type RPCRequest = { id: number; method: string; args: any[] };
export type RPCResponse = { id: number; result?: any; error?: string };

class Core extends EventEmitter {
  private commandRegistry = new Map<string, (...args: any[]) => any>();
  private currentEditor: monaco.editor.IStandaloneCodeEditor | null = null;

  public workbench = {
    file: {
      openTab: (tab: any) => {
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

  public languageServer = {
    registerProvider: (
      providerClass: typeof LanguageServerProvider,
      config: LanguageServerConfig
    ) => {
      LanguageServerRegistry.getInstance().registerProvider(
        providerClass,
        config
      );
    },

    getProviderForFile: async (
      filePath: string
    ): Promise<LanguageServerProvider | null> => {
      if (!this.currentEditor) return null;
      return await LanguageServerRegistry.getInstance().getProviderForFile(
        this.currentEditor,
        filePath
      );
    },

    getProviderForLanguage: (
      language: string
    ): LanguageServerProvider | null => {
      if (!this.currentEditor) return null;
      return LanguageServerRegistry.getInstance().getProviderForLanguage(
        this.currentEditor,
        language
      );
    },

    disposeProvider: (language: string) => {
      LanguageServerRegistry.getInstance().disposeProvider(language);
    },

    getRegisteredLanguages: (): string[] => {
      return LanguageServerRegistry.getInstance().getRegisteredLanguages();
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

export {
  ITab,
  Core,
  LanguageServerProvider,
  LanguageServerRegistry,
  PyrightProvider,
};
