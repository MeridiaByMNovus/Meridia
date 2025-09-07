import { Bootstrap } from "../../../bootstrap/bootstrap.js";
import { InjectResources } from "../../injectResources.js";

window.onload = async () => {
  InjectResources();

  window.target_window = "bootstrap";

  new Bootstrap();

  window.ipc.on("window-reset", async () => {
    window.location.reload();
  });
};
