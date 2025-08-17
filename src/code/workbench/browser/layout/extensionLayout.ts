import { ElementCore } from "./elementCore.js";

export class ExtensionLayout extends ElementCore {
  private extensionManager = window.extensionManager;

  constructor() {
    super();
    this.elementEl = document.createElement("div");
    this.elementEl.className = "extension-layout";

    this.renderAsync();
  }

  private async renderAsync() {
    const searchBarWrapper = document.createElement("div");
    const searchBar = document.createElement("input");

    searchBarWrapper.appendChild(searchBar);

    const extensionsContainer = document.createElement("div");
    extensionsContainer.className = "extensions-container";

    for (const extension of this.extensionManager.getAllExtensions()) {
      const manifest = extension.manifest;

      const extensionItem = document.createElement("div");
      extensionItem.className = "extension-item";

      const extensionIconPart = document.createElement("div");
      const extensionInfoPart = document.createElement("div");

      const name = document.createElement("p");
      const description = document.createElement("p");
      const author = document.createElement("p");

      name.className = "name text-wrap";
      description.className = "description text-wrap";
      author.className = "author text-wrap";

      name.textContent = manifest.name;
      description.textContent = manifest.description;
      author.textContent = manifest.author.name;

      extensionIconPart.className = "extension-icon";
      extensionInfoPart.className = "extension-info";

      extensionInfoPart.appendChild(name);
      extensionInfoPart.appendChild(description);
      extensionInfoPart.appendChild(author);

      extensionItem.appendChild(extensionIconPart);
      extensionItem.appendChild(extensionInfoPart);

      extensionItem.onclick = () => {
        this.extensionManager.openExtension(extension);
      };

      extensionsContainer.appendChild(extensionItem);
    }

    this.elementEl!.appendChild(searchBarWrapper);
    this.elementEl!.appendChild(extensionsContainer);

    console.log("Loaded extensions:", this.extensionManager.getAllExtensions());
  }
}
