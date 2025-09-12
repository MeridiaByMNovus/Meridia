import monaco from "monaco-editor";
import { PyrightProvider } from "../../platform/extension/pyright-api.js";

let globalPyrightProvider: PyrightProvider | null = null;

export async function initializePyrightProvider(
  editor: monaco.editor.IStandaloneCodeEditor
) {
  if (!editor) return;

  if (!globalPyrightProvider) {
    globalPyrightProvider = new PyrightProvider(editor);
    await globalPyrightProvider.init();
  }
}

export function disposePyrightProvider() {
  if (globalPyrightProvider) {
    globalPyrightProvider.dispose();

    globalPyrightProvider = null;
  }
}
