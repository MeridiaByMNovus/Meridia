import { context } from "../common/extension.context.js";

export function activate(context: context) {
  context.workbench.window.createStatusBarItem({
    _name: "Hello",
    _action: () => {},
    _condition: "",
  });

  context.workbench.setTimeout(() => {
    context.workbench.window.activeTextEditor.save();

    console.log(context.workbench.editor.getActiveEditor().uri);
  }, 2000);
}
