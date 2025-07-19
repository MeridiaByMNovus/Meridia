import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "../../workbench/react-hooks/store";
import { WelcomeWizard } from "../../workbench/browser/window/welcome-wizard";

const welcome_wizard = createRoot(document.querySelector("#welcome_wizard"));
welcome_wizard.render(
  <Provider store={store}>
    <WelcomeWizard />
  </Provider>
);
