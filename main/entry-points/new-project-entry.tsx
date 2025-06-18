import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "../../src/helpers/store";
import NewProject from "../../src/components/new-project";

const newProject = createRoot(document.querySelector("#newProject"));
newProject.render(
  <Provider store={store}>
    <NewProject />
  </Provider>
);
