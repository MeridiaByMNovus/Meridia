import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "../../src/helpers/store";
import App from "../../src/utilites/app";

const root = createRoot(document.querySelector("#root"));
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
