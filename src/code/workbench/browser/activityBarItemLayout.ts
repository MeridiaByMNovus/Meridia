import { ActivityBar } from "./activityBarLayout.js";
import { ActivityBarItemController } from "./common/controller/ActivityBarItemController.js";
import { ElementCore } from "./elementCore.js";

export class ActivtyBarItemLayout extends ElementCore {
  constructor(
    public ActivityBar: ActivityBar,
    public icon: string,
    public id: string,
    public content?: HTMLDivElement,
    public contentWrapper?: HTMLDivElement,
    public position: "top" | "bottom" = "top",
    public activeByDefault: boolean = false,
    public onClickHook?: Function
  ) {
    super();
    this.render();
  }

  private render() {
    this.elementEl = document.createElement("div");
    this.elementEl.classList.add("activity-bar-item");
    this.elementEl.innerHTML = this.icon;

    new ActivityBarItemController(this);

    this.ActivityBar.addActivityBarItem(this.elementEl, this.position);
  }

  public get itemId(): string {
    return this.id;
  }

  public get isActiveByDefault(): boolean {
    return this.activeByDefault;
  }
}
