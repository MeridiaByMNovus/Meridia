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

  private render() {
    this.StatusBar = document.querySelector(".status-bar") as HTMLDivElement;

    this.primarySection = document.createElement("div");
    this.primarySection.className = "status-bar-primary";

    this.globalSection = document.createElement("div");
    this.globalSection.className = "status-bar-global";

    this.StatusBar.appendChild(this.primarySection);
    this.StatusBar.appendChild(this.globalSection);
  }

  addItemToPrimary(spanItem: HTMLSpanElement) {
    this.primarySection.appendChild(spanItem);
  }

  addItemToGlobal(spanItem: HTMLSpanElement) {
    this.primarySection.appendChild(spanItem);
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
    const btn = document.createElement("span");
    btn.id = options.id;
    btn.className = "status-bar-item";
    btn.innerHTML = options.icon ?? "";
    if (options.tooltip) btn.title = options.tooltip;
    if (options.onClick) btn.addEventListener("click", options.onClick);
    return btn;
  }
}
