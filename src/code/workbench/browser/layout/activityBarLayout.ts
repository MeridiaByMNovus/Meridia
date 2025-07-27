export class ActivityBar {
  private layoutRow: HTMLDivElement;
  private ActivityBarWrapper: HTMLDivElement;
  private topActivityBarWrapper: HTMLDivElement;
  private bottomActivityBarWrapper: HTMLDivElement;

  constructor(private position: "left" | "right") {
    this.layoutRow = document.querySelector(".layout-row") as HTMLDivElement;
    this.ActivityBarWrapper = document.createElement("div");

    this.topActivityBarWrapper = document.createElement("div");
    this.bottomActivityBarWrapper = document.createElement("div");

    this.setupActivityBar();
  }

  private setupActivityBar() {
    this.ActivityBarWrapper.className = `activity-bar ${this.position}`;
    this.ActivityBarWrapper.id = `activity-bar-${this.position}`;

    this.topActivityBarWrapper.id = `activity-bar-${this.position}-top`;
    this.bottomActivityBarWrapper.id = `activity-bar-${this.position}-bottom`;

    this.ActivityBarWrapper.appendChild(this.topActivityBarWrapper);
    this.ActivityBarWrapper.appendChild(this.bottomActivityBarWrapper);

    this.layoutRow.appendChild(this.ActivityBarWrapper);
  }

  public addActivityBarItem(item: HTMLDivElement, position: "top" | "bottom") {
    if (position === "top") {
      this.topActivityBarWrapper.appendChild(item);
    } else {
      this.bottomActivityBarWrapper.appendChild(item);
    }
  }
}
