import { StandaloneProvider } from "../../../platform/editor/standalone/provider.js";

export class ImageStandalone extends StandaloneProvider {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    super();
    this.container = container;
    this.standalone = container;
  }

  private getFileExtension(path: string): string {
    const lastDot = path.lastIndexOf(".");
    return lastDot === -1 ? "" : path.substring(lastDot).toLowerCase();
  }

  private getMimeType(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      bmp: "image/bmp",
      webp: "image/webp",
      ico: "image/x-icon",
      tiff: "image/tiff",
      tif: "image/tiff",
      svg: "image/svg+xml",
    };
    return mimeTypes[extension.toLowerCase()] || "image/png";
  }

  public async displayImageFile(path: string): Promise<void> {
    this.container.innerHTML = "";

    const container = document.createElement("div");
    container.className = "image-viewer-container scrollbar-container";

    const img = document.createElement("img");
    img.className = "image-viewer-img";

    const info = document.createElement("div");
    info.className = "image-viewer-info";
    info.textContent = `Image: ${path.split("/").pop()}`;

    const handleImageLoad = () => {
      info.textContent += ` (${img.naturalWidth} × ${img.naturalHeight})`;
    };

    const handleImageError = () => {
      img.style.display = "none";
      const errorDiv = document.createElement("div");
      errorDiv.className = "image-viewer-error";

      const mainError = document.createElement("div");
      mainError.textContent = "Unable to load image";

      const details = document.createElement("div");
      details.className = "image-viewer-error-details";
      details.innerHTML = `File: ${path.split("/").pop()}<br>Reason: Security restrictions prevent loading local files`;

      errorDiv.appendChild(mainError);
      errorDiv.appendChild(details);
      container.appendChild(errorDiv);
    };

    img.addEventListener("load", handleImageLoad, { once: true });
    img.addEventListener("error", handleImageError, { once: true });

    try {
      const imageData = await window.filesystem.readFileSync(path, "utf-8");
      if (imageData) {
        const base64 = btoa(
          String.fromCharCode(...new Uint8Array(imageData as any))
        );
        const extension = this.getFileExtension(path).substring(1);
        const mimeType = this.getMimeType(extension);
        img.src = `data:${mimeType};base64,${base64}`;
      } else {
        handleImageError();
      }
    } catch (error) {
      console.error(error);
      handleImageError();
    }

    container.appendChild(img);
    container.appendChild(info);
    this.container.appendChild(container);
  }

  public async displaySvgFile(path: string, content: string): Promise<void> {
    this.container.innerHTML = "";

    const container = document.createElement("div");
    container.className = "svg-viewer-container";

    const svgContainer = document.createElement("div");
    svgContainer.className = "svg-viewer-content scrollbar-container";
    svgContainer.innerHTML = content;

    const info = document.createElement("div");
    info.className = "svg-viewer-info";
    info.textContent = `SVG: ${path.split("/").pop()}`;

    container.appendChild(svgContainer);
    container.appendChild(info);
    this.container.appendChild(container);
  }
}
