import * as monaco from "monaco-editor";

export interface LanguageServerConfig {
  name: string;
  language: string;
  workerPath: string;
  fileExtensions: string[];
  features?: {
    diagnostics?: boolean;
    completion?: boolean;
    hover?: boolean;
    signatureHelp?: boolean;
    formatting?: boolean;
    references?: boolean;
    rename?: boolean;
  };
}

export abstract class LanguageServerProvider {
  protected editor: monaco.editor.IStandaloneCodeEditor;
  protected config: LanguageServerConfig;
  protected initialized: boolean = false;

  constructor(
    editor: monaco.editor.IStandaloneCodeEditor,
    config: LanguageServerConfig
  ) {
    this.editor = editor;
    this.config = config;
  }

  abstract init(): Promise<void>;
  abstract setupDiagnostics(): Promise<void>;
  abstract dispose(): void;

  protected async loadWorker(): Promise<Worker> {
    const workerUrl = `${this.config.workerPath}?ts=${Date.now()}`;
    return new Worker(workerUrl, { type: "module" });
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public getConfig(): LanguageServerConfig {
    return this.config;
  }

  public supportsFileExtension(extension: string): boolean {
    return this.config.fileExtensions.includes(extension.toLowerCase());
  }
}
