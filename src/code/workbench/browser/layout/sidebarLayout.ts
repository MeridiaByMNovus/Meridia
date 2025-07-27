export class Sidebar {
  private layoutRow: HTMLDivElement;
  private sidebarWrapper: HTMLDivElement;
  private topSidebarWrapper: HTMLDivElement;
  private bottomSidebarWrapper: HTMLDivElement;

  constructor(private position: "left" | "right") {
    this.layoutRow = document.querySelector(".layout-row") as HTMLDivElement;
    this.sidebarWrapper = document.createElement("div");

    this.topSidebarWrapper = document.createElement("div");
    this.bottomSidebarWrapper = document.createElement("div");

    this.setupSidebar();
  }

  private setupSidebar() {
    this.sidebarWrapper.className = `panel-sidebar ${this.position}`;
    this.sidebarWrapper.id = `sidebar-${this.position}`;

    this.topSidebarWrapper.id = `sidebar-${this.position}-top`;
    this.bottomSidebarWrapper.id = `sidebar-${this.position}-bottom`;

    this.sidebarWrapper.appendChild(this.topSidebarWrapper);
    this.sidebarWrapper.appendChild(this.bottomSidebarWrapper);

    this.layoutRow.appendChild(this.sidebarWrapper);
  }

  public addSidebarItem(item: HTMLDivElement, position: "top" | "bottom") {
    if (position === "top") {
      this.topSidebarWrapper.appendChild(item);
    } else {
      this.bottomSidebarWrapper.appendChild(item);
    }
  }
}
