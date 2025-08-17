import * as monaco from "monaco-editor";
import {
  LanguageServerConfig,
  LanguageServerProvider,
} from "./LanguageServerProvider";
import { MonacoPyrightProvider } from "monaco-pyright-lsp";

export class PyrightProvider extends LanguageServerProvider {
  private provider: any;

  constructor(editor: monaco.editor.IStandaloneCodeEditor) {
    const config: LanguageServerConfig = {
      name: "Python Language Server (Pyright)",
      language: "python",
      workerPath: "./workers/python.worker.js",
      fileExtensions: [".py", ".pyw"],
      features: {
        diagnostics: true,
        completion: true,
        hover: true,
        signatureHelp: true,
      },
    };
    super(editor, config);
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      this.provider = new MonacoPyrightProvider(`${this.config.workerPath}`, {
        features: {
          hover: true,
          signatureHelp: true,
          rename: true,
          completion: true,
          diagnostic: true,
          findDefinition: true,
        },
      });

      await this.provider.init(monaco);
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize Pyright provider:", error);
      throw error;
    }
  }

  async setupDiagnostics(): Promise<void> {
    if (!this.initialized || !this.provider) {
      throw new Error("Provider not initialized");
    }

    try {
      await this.provider.setupDiagnostics(this.editor);
    } catch (error) {
      console.error("Failed to setup diagnostics:", error);
    }
  }

  dispose(): void {
    if (this.provider && typeof this.provider.dispose === "function") {
      this.provider.dispose();
    }
    this.initialized = false;
  }
}
