type ActivityItemOptions = {
  id: string;
  icon?: string;
  tooltip?: string;
  onClick?: () => void;
};

export class ActivityBarController {
  private activityBarWrapper!: HTMLDivElement;
  private primarySection!: HTMLDivElement;
  private globalSection!: HTMLDivElement;

  constructor() {
    this.render();
  }

  private render() {
    this.activityBarWrapper = document.querySelector(
      ".activity-bar-wrapper"
    ) as HTMLDivElement;

    this.primarySection = document.createElement("div");
    this.primarySection.className = "activity-bar-primary";

    this.globalSection = document.createElement("div");
    this.globalSection.className = "activity-bar-global";

    this.activityBarWrapper.appendChild(this.primarySection);
    this.activityBarWrapper.appendChild(this.globalSection);
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

  createActivityItem(options: ActivityItemOptions): HTMLSpanElement {
    const btn = document.createElement("span");
    btn.id = options.id;
    btn.className = "activity-item";
    btn.innerHTML = options.icon ?? "";
    if (options.tooltip) btn.title = options.tooltip;
    if (options.onClick) btn.addEventListener("click", options.onClick);
    return btn;
  }
}
