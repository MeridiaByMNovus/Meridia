import { ElementCore } from "./elementCore.js";

export class ActivityBar extends ElementCore {
  private layoutRow: HTMLDivElement;
  private topActivityBarWrapper: HTMLDivElement;
  private bottomActivityBarWrapper: HTMLDivElement;
  private activeItem: HTMLDivElement | null = null;

  constructor(public position: "left" | "right") {
    super();

    this.layoutRow = document.querySelector(".layout-row") as HTMLDivElement;
    this.elementEl = document.createElement("div");

    this.topActivityBarWrapper = document.createElement("div");
    this.bottomActivityBarWrapper = document.createElement("div");

    this.setupActivityBar();
  }

  private setupActivityBar() {
    this.elementEl!.className = `activity-bar ${this.position}`;
    this.elementEl!.id = `activity-bar-${this.position}`;

    this.topActivityBarWrapper.id = `activity-bar-${this.position}-top`;
    this.bottomActivityBarWrapper.id = `activity-bar-${this.position}-bottom`;

    this.elementEl!.appendChild(this.topActivityBarWrapper);
    this.elementEl!.appendChild(this.bottomActivityBarWrapper);

    this.layoutRow.appendChild(this.elementEl!);
  }

  public addActivityBarItem(item: HTMLDivElement, position: "top" | "bottom") {
    item.addEventListener("click", () => this.setActiveItem(item));
    if (position === "top") {
      this.topActivityBarWrapper.appendChild(item);
    } else {
      this.bottomActivityBarWrapper.appendChild(item);
    }
  }

  public setActiveItem(item: HTMLDivElement) {
    // remove active from previous
    if (this.activeItem) {
      this.activeItem.classList.remove("active");
    }
    // set new active
    this.activeItem = item;
    this.activeItem.classList.add("active");
  }

  public getActiveItem() {
    return this.activeItem;
  }

  public getDomElement() {
    return this.elementEl;
  }
}
