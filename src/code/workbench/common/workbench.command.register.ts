import { DevPanelTabs } from "../browser/workbench.parts/workbench.part.dev.panel/workbench.part.dev.panel.tabs.js";
import { Run } from "../browser/workbench.parts/workbench.part.dev.panel/workbench.part.dev.run.js";
import { addCommand } from "./workbench.command.js";
import { Editor } from "./workbench.editor/workbench.editor.js";
import { getStandalone } from "./workbench.standalone.js";

addCommand("workbench.editor.run", async (_path: string) => {
  const _run = getStandalone("run") as Run;
  const _editor = getStandalone("editor") as Editor;
  _editor._save(_path);
  const _tabs = getStandalone("dev-panel-tabs") as DevPanelTabs;
  await _tabs._set("run");
  _run._run(_path);
});

addCommand("workbench.editor.stop", async (_path: string) => {
  const _run = getStandalone("run") as Run;
  const _tabs = getStandalone("dev-panel-tabs") as DevPanelTabs;
  await _tabs._set("run");
  _run._stop(_path);
});
