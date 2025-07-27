export class ActivityBarLayout {
  constructor() {
    this.createActivityBar();
  }

  private createActivityBar() {
    const activityBarWrapper = document.createElement("div");
    activityBarWrapper.className = "activity-bar-wrapper";

    (document.querySelector(".main-wrapper") as HTMLDivElement).appendChild(
      activityBarWrapper
    );
  }
}
