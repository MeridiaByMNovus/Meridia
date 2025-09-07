import { LoadedExtension } from "../../platform/extension/manager.js";

export class ExtensionPageLayout {
  private extensionEl: HTMLDivElement | null = null;

  constructor(private ext: LoadedExtension) {
    this.extensionEl = document.createElement("div");
    this.extensionEl.className = "extension-layout";

    this.renderAsync();
  }

  private async renderAsync() {
    if (!this.extensionEl) return;

    const extEl = document.createElement("div");
    extEl.className = "extension";
    extEl.innerText = this.ext.manifest.name;
    this.extensionEl!.appendChild(extEl);
  }

  public getDomElement(): HTMLDivElement | null {
    return this.extensionEl;
  }
}
