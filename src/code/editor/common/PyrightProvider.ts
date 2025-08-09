import * as monaco from "monaco-editor";
import { MonacoPyrightProvider } from "monaco-pyright-lsp";

class PyrightCore {
  constructor(protected editor: monaco.editor.IStandaloneCodeEditor) {}

  public async loadPyrightProvider() {
    if (!this.editor) return;

    const provider = new MonacoPyrightProvider(
      `./workers/python.worker.js?ts=${Date.now()}`
    );

    try {
      await provider.init(monaco);
      await provider.setupDiagnostics(this.editor);
    } catch {}
  }
}

export class PyrightProvider extends PyrightCore {
  private static instance: PyrightProvider | null = null;

  constructor(editor: monaco.editor.IStandaloneCodeEditor) {
    super(editor);
  }

  public static getInstance(editor: monaco.editor.IStandaloneCodeEditor) {
    if (!PyrightProvider.instance) {
      PyrightProvider.instance = new PyrightProvider(editor);
    }
    return PyrightProvider.instance;
  }
}
