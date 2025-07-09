import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "../../src/helpers/store";
import NewProject from "../../src/ui/new-project";

const newProject = createRoot(document.querySelector("#new_project"));
newProject.render(
  <Provider store={store}>
    <NewProject />
  </Provider>
);
