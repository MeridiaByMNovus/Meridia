import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "../../src/helpers/store";
import { ToolsWindow } from "../../src/components/tools/toolsWindow";

const toolsWindow = createRoot(document.querySelector("#toolsWindow"));
toolsWindow.render(
  <Provider store={store}>
    <ToolsWindow />
  </Provider>
);
