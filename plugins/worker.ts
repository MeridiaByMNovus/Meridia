import { PluginAPI } from "./api/pluginAPI";
import fileData from "./packages.json";

interface ExtensionManifest {
  id: string;
  name: string;
  entry: string;
}

interface LoadedExtension {
  id: string;
  module: any;
}

export class PluginWorker {
  private extensions: LoadedExtension[] = [];

  public async registerPlugins(): Promise<void> {
    try {
      const data: { plugins: ExtensionManifest[] } = fileData;

      for (const ext of data.plugins) {
        await this.loadAndRegister(ext);
      }
    } catch (error) {
      console.error("Error registering plugins:", error);
    }
  }

  private async loadAndRegister(ext: ExtensionManifest): Promise<void> {
    try {
      const module = await import(`./${ext.entry}`);
      if (module.default) {
        this.extensions.push({ id: ext.id, module: module.default });
        module.default.activate();
        PluginAPI.log(`Plugin registered: ${ext.name}`);
      }
    } catch (error) {
      console.error(`Failed to register plugin ${ext.name}:`, error);
    }
  }
}
