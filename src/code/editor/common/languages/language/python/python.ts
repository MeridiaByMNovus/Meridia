import * as monaco from "monaco-editor";
import { MonacoPyrightProvider } from "monaco-pyright-lsp";
import { LanguageProvider } from "../../../../../platform/editor/language/provider.js";
import { LanguageManifest } from "../../../../../platform/editor/language/types.js";

export class Python extends LanguageProvider {
  private provider: MonacoPyrightProvider | null = null;
  public manifest: LanguageManifest | null = null;
  constructor() {
    const manifest: LanguageManifest = {
      name: "python-support",
      ext: [".py"],
      worker: "/worker/python.worker.js",
      type: "browser",
      main: "python.js",
    };
    super(manifest);

    this.manifest = manifest;
  }

  async activate(editor: monaco.editor.IStandaloneCodeEditor) {
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
    await this.provider.setupDiagnostics(editor);

    return this.provider;
  }

  dispose() {
    this.provider?.stopDiagnostics();
    this.provider?.lspClient.worker.terminate();
  }
}
