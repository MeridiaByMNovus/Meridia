import * as monaco from "monaco-editor";
import {
  LanguageServerConfig,
  LanguageServerProvider,
} from "./LanguageServerProvider";

export class LanguageServerRegistry {
  private static instance: LanguageServerRegistry | null = null;
  private providers = new Map<string, typeof LanguageServerProvider>();
  private activeProviders = new Map<string, LanguageServerProvider>();

  private constructor() {}

  public static getInstance(): LanguageServerRegistry {
    if (!LanguageServerRegistry.instance) {
      LanguageServerRegistry.instance = new LanguageServerRegistry();
    }
    return LanguageServerRegistry.instance;
  }

  public registerProvider(
    providerClass: typeof LanguageServerProvider,
    config: LanguageServerConfig
  ): void {
    this.providers.set(config.language, providerClass);
  }

  public async getProviderForFile(
    editor: monaco.editor.IStandaloneCodeEditor,
    filePath: string
  ): Promise<LanguageServerProvider | null> {
    const extension = this.getFileExtension(filePath);

    console.log(extension);
    console.log(this.providers);

    for (const [language, ProviderClass] of this.providers) {
      const tempProvider = new (ProviderClass as any)(editor, {
        fileExtensions: [],
      });
      if (
        tempProvider.supportsFileExtension &&
        tempProvider.supportsFileExtension(extension)
      ) {
        const existingProvider = this.activeProviders.get(language);
        if (existingProvider) {
          return existingProvider;
        }

        const config = this.getConfigForLanguage(language);
        if (config) {
          const provider = new (ProviderClass as any)(editor, config);
          this.activeProviders.set(language, provider);
          return provider;
        }
      }
    }

    return null;
  }

  public getProviderForLanguage(
    editor: monaco.editor.IStandaloneCodeEditor,
    language: string
  ): LanguageServerProvider | null {
    const ProviderClass = this.providers.get(language);
    if (!ProviderClass) return null;

    let provider = this.activeProviders.get(language);
    if (!provider) {
      const config = this.getConfigForLanguage(language);
      if (config) {
        provider = new (ProviderClass as any)(editor, config);
        this.activeProviders.set(language, provider as LanguageServerProvider);
      }
    }

    return provider || null;
  }

  private getConfigForLanguage(language: string): LanguageServerConfig | null {
    const configs: Record<string, LanguageServerConfig> = {
      python: {
        name: "Python Language Server",
        language: "python",
        workerPath: "./workers/python.worker.js",
        fileExtensions: [".py", ".pyw"],
        features: {
          diagnostics: true,
          completion: true,
          hover: true,
          signatureHelp: true,
        },
      },
      typescript: {
        name: "TypeScript Language Server",
        language: "typescript",
        workerPath: "./workers/typescript.worker.js",
        fileExtensions: [".ts", ".tsx"],
      },
      javascript: {
        name: "JavaScript Language Server",
        language: "javascript",
        workerPath: "./workers/javascript.worker.js",
        fileExtensions: [".js", ".jsx"],
      },
    };

    return configs[language] || null;
  }

  private getFileExtension(filePath: string): string {
    const lastDot = filePath.lastIndexOf(".");
    return lastDot === -1 ? "" : filePath.substring(lastDot).toLowerCase();
  }

  public disposeAll(): void {
    for (const provider of this.activeProviders.values()) {
      provider.dispose();
    }
    this.activeProviders.clear();
  }

  public disposeProvider(language: string): void {
    const provider = this.activeProviders.get(language);
    if (provider) {
      provider.dispose();
      this.activeProviders.delete(language);
    }
  }

  public getRegisteredLanguages(): string[] {
    return Array.from(this.providers.keys());
  }
}
