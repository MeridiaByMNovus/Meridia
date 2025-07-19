import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "../../workbench/react-hooks/store";
import App from "../../workbench/browser/react/app";

const root = createRoot(document.querySelector("#root"));
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
