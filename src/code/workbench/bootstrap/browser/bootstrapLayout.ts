import { ElementCore } from "../../browser/elementCore.js";

export class BootstrapLayout extends ElementCore {
  private headingEl: HTMLParagraphElement | null = null;

  constructor() {
    super();
    this.render();
  }

  private render() {
    const bootstrapEl = document.querySelector(".bootstrap") as HTMLDivElement;

    this.elementEl = document.createElement("div");
    this.elementEl.className = "bootstrap-wrapper";
    this.elementEl.setAttribute("role", "main");

    this.headingEl = document.createElement("p");
    this.headingEl.className = "heading";
    this.headingEl.setAttribute("aria-live", "polite");

    const contentEl = document.createElement("div");
    contentEl.className = "content-wrapper";

    const welcomeButtonEl = document.createElement("button");
    welcomeButtonEl.textContent = "Continue!";
    welcomeButtonEl.className = "welcome-button";
    welcomeButtonEl.setAttribute("aria-label", "Continue to setup");

    welcomeButtonEl.addEventListener("mousedown", () => {
      welcomeButtonEl.style.transform = "scale(0.95)";
    });
    welcomeButtonEl.addEventListener("mouseup", () => {
      welcomeButtonEl.style.transform = "";
    });

    welcomeButtonEl.onclick = () => {
      this.startBootstrap(contentEl);
    };

    this.elementEl.appendChild(this.headingEl);
    this.elementEl.appendChild(contentEl);
    contentEl.appendChild(welcomeButtonEl);

    bootstrapEl.appendChild(this.elementEl);

    setTimeout(() => {
      this.typeWriter(this.headingEl!, "Welcome to Meridia!", 100);
    }, 3000);
  }

  private startBootstrap(contentEl: HTMLDivElement) {
    contentEl.style.display = "none";
    if (this.headingEl) {
      this.headingEl.textContent = "Initializing Meridia setup...";
    }

    window.ipc.on("bootstrap-message-update", (_: any, message: string) => {
      if (!this.headingEl) return;
      this.headingEl.textContent = message;
    });

    setTimeout(() => {
      window.ipc.send("bootstrap-init-load");
    }, 2000);
  }

  private typeWriter(element: HTMLElement, text: string, speed: number) {
    let i = 0;
    element.textContent = "";

    const typing = () => {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(typing, speed);
      }
    };

    typing();
  }
}
