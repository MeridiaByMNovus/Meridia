import { Core } from "./core.js";
import { store, dispatch } from "../../workbench/common/store/store.js";
import { update_editor_tabs } from "../../workbench/common/store/mainSlice.js";
import { ExtensionPageLayout } from "../../workbench/browser/extensionPageLayout.js";

export type ExtensionManifest = {
  name: string;
  main: string;
  type?: string;
  enabled?: boolean;
  version?: string;
  author: {
    name: string;
    email?: string;
    website?: string;
  };
  description: string;
  license?: string;
  repository?: {
    type: string;
    url: string;
  };
  readme: string;
  keywords: string[];
  homepage?: string;
};

export type LoadedExtension = {
  manifest: ExtensionManifest;
  module: any;
};

export class ExtensionManager {
  private core: Core;
  private extensionsPath: string;
  private extensions: Map<string, LoadedExtension> = new Map();

  constructor(core: Core, extensionsPath: string) {
    this.core = core;
    this.extensionsPath = extensionsPath;
  }

  openExtension(ext: LoadedExtension) {
    const id = `extension-${ext.manifest.name.toLowerCase().replace(/\s+/g, "-")}`;

    this.core.workbench.tab.registerContent(
      `elements://extension-page-${id}`,
      new ExtensionPageLayout(ext).getDomElement()
    );

    const existingTabs = store.getState().main.editor_tabs;
    const existingTab = existingTabs.find((t) => t.id === id);

    if (existingTab) {
      dispatch(
        update_editor_tabs(
          existingTabs.map((t) => ({
            ...t,
            active: t.id === id,
          }))
        )
      );
    } else {
      const updatedTabs = [
        ...existingTabs.map((t) => ({ ...t, active: false })),
        {
          id: id,
          name: ext.manifest.name,
          active: true,
          content: `elements://extension-page-${id}`,
          fileIcon: "Extension",
        },
      ];
      dispatch(update_editor_tabs(updatedTabs));
    }
  }

  async loadExtensions() {
    const folders = window.filesystem
      .readdirSync(this.extensionsPath)
      .filter((name: string) => {
        const fullPath = window.path.join(this.extensionsPath, name);
        return window.filesystem.isDirectory(fullPath);
      });

    for (const folder of folders) {
      const manifestPath = window.path.join(
        this.extensionsPath,
        folder,
        "manifest.json"
      );

      if (!window.filesystem.existsSync(manifestPath)) continue;

      const manifest: ExtensionManifest = JSON.parse(
        window.filesystem.readFileSync(manifestPath, "utf-8")
      );

      this.extensions.set(manifest.name, {
        manifest,
        module: await import(
          window.path.join(this.extensionsPath, folder, manifest.main)
        ),
      });
    }
  }

  async runExtension(name: string) {
    const ext = this.extensions.get(name);
    if (!ext) return false;

    console.log("running extension", ext);

    if (!ext.module) {
      const folder = window.path.join(this.extensionsPath, name);
      const mainPath = window.path.join(folder, ext.manifest.main);

      if (!window.filesystem.existsSync(mainPath)) return false;

      const extensionModule = await import(mainPath);
      ext.module = extensionModule;
    }

    if (ext.module.activate) {
      ext.module.activate(this.core);
      ext.manifest.enabled = true;
      return true;
    }

    return false;
  }

  async runAllExtensions() {
    const results: Record<string, boolean> = {};
    for (const name of this.extensions.keys()) {
      results[name] = await this.runExtension(name);
    }
    return results;
  }

  disableExtension(name: string) {
    const ext = this.extensions.get(name);
    if (!ext) return false;
    if (ext.manifest.enabled && ext.module?.deactivate) {
      ext.module.deactivate(this.core);
      ext.manifest.enabled = false;
      return true;
    }
    return false;
  }

  async reloadExtension(name: string) {
    const ext = this.extensions.get(name);
    if (!ext) return false;
    if (ext.module?.deactivate) ext.module.deactivate(this.core);

    const folder = window.path.join(this.extensionsPath, name);
    const mainPath = window.path.join(folder, ext.manifest.main);

    const extensionModule = await import(mainPath);
    ext.module = extensionModule;

    return false;
  }

  getAllExtensions(): LoadedExtension[] {
    return Array.from(this.extensions.values());
  }
}
