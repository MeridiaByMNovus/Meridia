import { StandaloneProvider } from "../../../platform/editor/standalone/provider";

export class JupyterStandalone extends StandaloneProvider {
  private filesystem = window.filesystem;
  private path = window.path;

  constructor(container: HTMLElement) {
    super();
    this.standalone = container;
    this.standalone.style.height = "100%";
    this.standalone.style.width = "100%";
  }

  public render(filePath: string) {
    console.log("rendering", this.standalone);
  }
}
