import * as monaco from "monaco-editor";
import { MonacoPyrightProvider } from "monaco-pyright-lsp";

export class PyrightProvider {
  private provider: any;

  constructor(private editor: monaco.editor.IStandaloneCodeEditor) {}

  async init() {
    this.provider = new MonacoPyrightProvider("./workers/python.worker.js", {
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
    await this.provider.setupDiagnostics(this.editor);

    return this.provider;
  }
}
