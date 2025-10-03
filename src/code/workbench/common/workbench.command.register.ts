import { DevPanelTabs } from "../browser/workbench.parts/workbench.part.dev.panel/workbench.part.dev.panel.tabs.js";
import { Run } from "../browser/workbench.parts/workbench.part.dev.panel/workbench.part.dev.run.js";
import { addCommand } from "./workbench.command.js";
import { getStandalone } from "./workbench.standalone.js";

addCommand("workbench.editor.run", (_path: string) => {
  const _run = getStandalone("run") as Run;
  const _tabs = getStandalone("dev-panel-tabs") as DevPanelTabs;
  _tabs._set("run");

  setTimeout(() => {
    _run._run(_path);
  }, 100);
});

addCommand("workbench.editor.stop", (_path: string) => {
  const _run = getStandalone("run") as Run;
  const _tabs = getStandalone("dev-panel-tabs") as DevPanelTabs;
  _tabs._set("run");
  setTimeout(() => {
    _run._stop(_path);
  }, 100);
});
