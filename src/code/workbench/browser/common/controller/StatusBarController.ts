type StatusItemOptions = {
  id: string;
  icon?: string;
  tooltip?: string;
  onClick?: () => void;
};

export class StatusBarController {
  private StatusBar!: HTMLDivElement;
  private primarySection!: HTMLDivElement;
  private globalSection!: HTMLDivElement;

  constructor() {
    this.render();
  }

  static getInstance() {
    return new StatusBarController();
  }

  private render() {
    this.StatusBar = document.querySelector(".status-bar") as HTMLDivElement;
    if (!this.StatusBar) {
      throw new Error("No element with class 'status-bar' found in the DOM");
    }

    let existingPrimary = this.StatusBar.querySelector(
      ".status-bar-primary"
    ) as HTMLDivElement | null;
    if (existingPrimary) {
      this.primarySection = existingPrimary;
    } else {
      this.primarySection = document.createElement("div");
      this.primarySection.className = "status-bar-primary";
      this.StatusBar.appendChild(this.primarySection);
    }

    let existingGlobal = this.StatusBar.querySelector(
      ".status-bar-global"
    ) as HTMLDivElement | null;
    if (existingGlobal) {
      this.globalSection = existingGlobal;
    } else {
      this.globalSection = document.createElement("div");
      this.globalSection.className = "status-bar-global";
      this.StatusBar.appendChild(this.globalSection);
    }
  }

  addItemToPrimary(spanItem: HTMLSpanElement) {
    if (!this.primarySection.contains(spanItem)) {
      this.primarySection.appendChild(spanItem);
    }
  }

  addItemToGlobal(spanItem: HTMLSpanElement) {
    if (!this.globalSection.contains(spanItem)) {
      this.globalSection.appendChild(spanItem);
    }
  }

  changeItemById(id: string, newContent: string) {
    const item = document.getElementById(id);
    if (item) item.innerHTML = newContent;
  }

  removeItemById(id: string) {
    const item = document.getElementById(id);
    if (item) item.remove();
  }

  createActivityItem(options: StatusItemOptions): HTMLSpanElement {
    let btn = document.getElementById(options.id) as HTMLSpanElement | null;
    if (btn) {
      btn.className = "status-bar-item";
      btn.innerHTML = options.icon ?? "";
      btn.title = options.tooltip ?? "";
      btn.onclick = null;
      if (options.onClick) btn.addEventListener("click", options.onClick);
    } else {
      btn = document.createElement("span");
      btn.id = options.id;
      btn.className = "status-bar-item";
      btn.innerHTML = options.icon ?? "";
      if (options.tooltip) btn.title = options.tooltip;
      if (options.onClick) btn.addEventListener("click", options.onClick);
    }
    return btn;
  }
}
