import monaco from "monaco-editor";
import { LanguageManifest } from "../../../platform/editor/language/types.js";

export type LoadedLanguage = {
  manifest: LanguageManifest;
  module: any;
};

export class LanguageSupport {
  private filesystem = window.filesystem;
  private path = window.path;
  private languages: Map<string, LoadedLanguage> = new Map();
  private __dirname = this.path.join(
    this.path.__dirname(),
    "..",
    "..",
    "..",
    "editor",
    "common",
    "languages",
    "language"
  );

  constructor(private editor: monaco.editor.IStandaloneCodeEditor) {
    this.loadLanguages();
  }

  private async loadLanguages() {
    if (!this.filesystem.existsSync(this.__dirname)) {
      return false;
    }

    const folders = this.filesystem
      .readdirSync(this.__dirname)
      .filter((name: string) => {
        const fullPath = this.path.join(this.__dirname, name);
        return this.filesystem.isDirectory(fullPath);
      });

    for (const folder of folders) {
      const manifestPath = this.path.join(
        this.__dirname,
        folder,
        "manifest.json"
      );

      if (!this.filesystem.existsSync(manifestPath)) continue;

      const manifest: LanguageManifest = JSON.parse(
        this.filesystem.readFileSync(manifestPath, "utf-8")
      );

      this.languages.set(manifest.name, {
        manifest,
        module: await import(
          this.path.join(this.__dirname, folder, manifest.main)
        ),
      });
    }

    for (const name of this.languages.keys()) {
      const ext = this.languages.get(name);
      if (!ext) return false;

      if (!ext.module) {
        const folder = this.path.join(this.__dirname, name);
        const mainPath = this.path.join(folder, ext.manifest.main);

        if (!this.filesystem.existsSync(mainPath)) return false;

        const extensionModule = await import(mainPath);
        ext.module = extensionModule;
      }

      if (ext.module) {
        const LanguageCtor =
          ext.module.default ||
          ext.module[ext.manifest.name] ||
          Object.values(ext.module).find((v: any) => typeof v === "function");
        if (!LanguageCtor)
          throw new Error("No constructor found in language module");

        const instance = new LanguageCtor();
        await instance.activate(this.editor);
        return true;
      }

      return false;
    }

    return false;
  }

  dispose() {}
}
