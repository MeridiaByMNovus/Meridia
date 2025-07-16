import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "../../src/helpers/store";
import { WelcomeWizard } from "../../src/ui/welcome-wizard/";

const welcome_wizard = createRoot(document.querySelector("#welcome_wizard"));
welcome_wizard.render(
  <Provider store={store}>
    <WelcomeWizard />
  </Provider>
);
