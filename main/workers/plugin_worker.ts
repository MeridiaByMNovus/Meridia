import { PluginWorker } from "../../plugins/worker";

export function RegisterPluginWorker() {
  const pluginWorker = new PluginWorker();
  pluginWorker.registerPlugins();
}
