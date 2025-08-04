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

  private buildTypeStubs(): TypeStubMap {
    const result: TypeStubMap = {};

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

    await this.recreatePyrightProvider();
  }

  private async recreatePyrightProvider() {
    if (this.isDisposed) return;

    // Clean up existing provider
    if (this.pyrightProvider) {
      try {
        if (
          "stopDiagnostics" in this.pyrightProvider &&
          typeof this.pyrightProvider.stopDiagnostics === "function"
        ) {
          this.pyrightProvider.stopDiagnostics();
        }
      } catch (error) {
        console.warn("Error stopping diagnostics:", error);
      }
      this.pyrightProvider = null;
    }

    const typeStubs = this.buildTypeStubs();

    // Hack: append timestamp to force worker recreation
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
        // If disposed during async operation, clean up the new provider
        if (
          "stopDiagnostics" in provider &&
          typeof provider.stopDiagnostics === "function"
        ) {
          provider.stopDiagnostics();
        }
      }
    } catch (error) {
      console.error("Error creating Pyright provider:", error);
      // Clean up on error
      if (
        "stopDiagnostics" in provider &&
        typeof provider.stopDiagnostics === "function"
      ) {
        provider.stopDiagnostics();
      }
    }
  }

  private scheduleTypeStubUpdate() {
    if (this.isDisposed) return;

    if (this.updateTimer) clearTimeout(this.updateTimer);
    this.updateTimer = setTimeout(() => this.updateTypeStubs(), 300);
  }

  public async loadPyrightProvider() {
    if (!this.editor || this.isDisposed) return;

    // Clean up existing IPC listener
    this.cleanupIpcListener();

    // Create new IPC listener
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
        this.scheduleTypeStubUpdate(); // Use update instead of recreation
      }
    };

    window.electron.ipcRenderer.on("file-content-changed", this.ipcListener);

    await this.FileSystemProvider.getPythonFilesContent();
    await this.recreatePyrightProvider(); // Initial creation
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

    // Clear timer
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }

    // Clean up IPC listener
    this.cleanupIpcListener();

    // Clean up Pyright provider
    if (this.pyrightProvider) {
      try {
        // Stop diagnostics - this method exists in monaco-pyright-lsp
        if (
          "stopDiagnostics" in this.pyrightProvider &&
          typeof this.pyrightProvider.stopDiagnostics === "function"
        ) {
          this.pyrightProvider.stopDiagnostics();
        }
      } catch (error) {
        console.warn("Error disposing Pyright provider:", error);
      }
      this.pyrightProvider = null;
    }
  }
}

export class PyrightProvider extends PyrightCore {
  // Static cleanup for managing multiple instances
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

  // Static method to cleanup all instances
  public static disposeAll() {
    for (const instance of PyrightProvider.instances) {
      instance.dispose();
    }
    PyrightProvider.instances.clear();
  }

  // Static method to cleanup all instances except the current one
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
