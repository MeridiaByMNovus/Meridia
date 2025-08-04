import * as monaco from "monaco-editor";
import { MonacoPyrightProvider } from "../worker/python/src/index.js";
import { FileSystemProvider } from "./FileSystemProvider.js";

type TypeStubMap = Record<string, Record<string, string>>;

class PyrightCore {
  private pyrightProvider: MonacoPyrightProvider | null = null;
  private updateTimer: NodeJS.Timeout | null = null;
  private ipcListener:
    | ((event: unknown, data: { path: string; content: string }) => void)
    | null = null;
  private isDisposed = false;

  constructor(
    private editor: monaco.editor.IStandaloneCodeEditor,
    private FileSystemProvider: FileSystemProvider
  ) {}

  private buildTypeStubs(): Record<string, Record<string, string>> {
    const result: Record<string, Record<string, string>> = {};

    this.FileSystemProvider.filteredFilesData.forEach((f) => {
      const fileName = "__init__.pyi";
      const baseName = f.name.replace(/\.py$/, "");
      if (!result[baseName]) result[baseName] = {};
      result[baseName][fileName] = f.content;
    });

    return result;
  }

  private async updateTypeStubs() {
    if (this.isDisposed || !this.pyrightProvider) return;

    const typeStubs = this.buildTypeStubs();

    await this.pyrightProvider.updateOptions(
      {
        typeStubs,
      },
      this.editor
    );
  }

  private scheduleTypeStubUpdate() {
    if (this.isDisposed) return;

    if (this.updateTimer) clearTimeout(this.updateTimer);
    this.updateTimer = setTimeout(() => this.updateTypeStubs(), 300);
  }

  public async loadPyrightProvider() {
    if (!this.editor || this.isDisposed) return;

    this.cleanupIpcListener();

    this.ipcListener = (
      _: unknown,
      { path, content }: { path: string; content: string }
    ) => {
      if (this.isDisposed) return;

      const file = this.FileSystemProvider.filteredFilesData.find(
        (f) => f.path === path
      );

      if (file) {
        file.content = content;
        this.scheduleTypeStubUpdate();
      }
    };

    window.electron.ipcRenderer.on("file-content-changed", this.ipcListener);

    await this.FileSystemProvider.getPythonFilesContent();

    const typeStubs = this.buildTypeStubs();
    const provider = new MonacoPyrightProvider(
      `./workers/python.worker.js?ts=${Date.now()}`,
      { typeStubs }
    );

    try {
      await provider.init(monaco);
      await provider.setupDiagnostics(this.editor);

      if (!this.isDisposed) {
        this.pyrightProvider = provider;
      } else {
        provider.dispose();
      }
    } catch (error) {
      provider.dispose();
    }
  }

  private cleanupIpcListener() {
    if (this.ipcListener) {
      window.electron.ipcRenderer.removeListener(
        "file-content-changed",
        this.ipcListener
      );
      this.ipcListener = null;
    }
  }

  public dispose() {
    this.isDisposed = true;

    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }

    this.cleanupIpcListener();

    if (this.pyrightProvider) {
      try {
        this.pyrightProvider.dispose();
      } catch (error) {}
      this.pyrightProvider = null;
    }
  }
}

export class PyrightProvider extends PyrightCore {
  private static instances: Set<PyrightProvider> = new Set();

  constructor(
    editor: monaco.editor.IStandaloneCodeEditor,
    FileSystemProvider: FileSystemProvider
  ) {
    super(editor, FileSystemProvider);
    PyrightProvider.instances.add(this);
  }

  public dispose() {
    super.dispose();
    PyrightProvider.instances.delete(this);
  }

  public static disposeAll() {
    for (const instance of PyrightProvider.instances) {
      instance.dispose();
    }
    PyrightProvider.instances.clear();
  }

  public static disposeAllExcept(keepInstance: PyrightProvider) {
    for (const instance of PyrightProvider.instances) {
      if (instance !== keepInstance) {
        instance.dispose();
      }
    }
    PyrightProvider.instances.clear();
    PyrightProvider.instances.add(keepInstance);
  }
}
