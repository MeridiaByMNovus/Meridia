import PerfectScrollbar from "perfect-scrollbar";

export class TabsLayout {
  private wrapper: HTMLDivElement;
  private ps: PerfectScrollbar;

  constructor(private parent: HTMLDivElement) {
    this.wrapper = document.createElement("div");
    this.wrapper.className = "tabs-layout-wrapper scrollbar-container";
    this.parent.appendChild(this.wrapper);

    this.ps = new PerfectScrollbar(this.wrapper, {
      wheelPropagation: false,
      suppressScrollY: true,
    });

    this.wrapper.addEventListener(
      "wheel",
      (e) => {
        const delta =
          Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;

        if (delta !== 0) {
          this.wrapper.scrollLeft += delta;
          e.preventDefault();
          e.stopPropagation();
          this.ps.update();
        }
      },
      { passive: false }
    );

    requestAnimationFrame(() => this.ps.update());
  }

  public addTab(tab: HTMLDivElement) {
    this.wrapper.appendChild(tab);
    this.ps.update();
  }

  public removeAllTabs() {
    this.wrapper.innerHTML = "";
    this.ps.update();
  }

  public hide() {
    this.wrapper.style.display = "none";
  }

  public show() {
    this.wrapper.style.display = "flex";
    requestAnimationFrame(() => this.ps.update());
  }

  public refresh() {
    this.ps.update();
  }
}
