import PerfectScrollbar from "perfect-scrollbar";

export class TabsLayout {
  private container: HTMLDivElement;
  private wrapper: HTMLDivElement;
  private extraButtonsContainer?: HTMLDivElement;
  private ps: PerfectScrollbar;
  private ps2?: PerfectScrollbar;

  constructor(private parent: HTMLDivElement, private props?: any[]) {
    this.container = document.createElement("div");
    this.container.className = "tabs-layout-container";
    this.container.style.display = "flex";
    this.container.style.flexDirection = "row";
    this.container.style.alignItems = "center";
    this.container.style.width = "100%";

    this.wrapper = document.createElement("div");
    this.wrapper.className = "tabs-layout-wrapper scrollbar-container";
    this.wrapper.style.flex = "1 1 auto";
    this.wrapper.style.overflow = "hidden";

    this.container.appendChild(this.wrapper);

    this.ps = new PerfectScrollbar(this.wrapper, {
      wheelPropagation: false,
      suppressScrollY: true,
    });

    if (Array.isArray(this.props) && this.props.length > 0) {
      this.extraButtonsContainer = document.createElement("div");
      this.extraButtonsContainer.className =
        "tabs-layout-extra-buttons scrollbar-container";
      this.container.appendChild(this.extraButtonsContainer);

      this.ps2 = new PerfectScrollbar(this.extraButtonsContainer, {
        wheelPropagation: false,
        suppressScrollY: true,
      });

      this.props.forEach((buttonEl) => {
        if (buttonEl instanceof HTMLElement) {
          this.extraButtonsContainer!.appendChild(buttonEl);
        }
      });
    }

    this.parent.appendChild(this.container);

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
          this.ps2?.update();
        }
      },
      { passive: false }
    );

    requestAnimationFrame(() => this.ps.update());
    if (this.ps2) requestAnimationFrame(() => this.ps2!.update());
  }

  public addTab(tab: HTMLDivElement) {
    this.wrapper.appendChild(tab);
    this.ps.update();
    this.ps2?.update();
  }

  public removeAllTabs() {
    this.wrapper.innerHTML = "";
    this.ps.update();
    this.ps2?.update();
  }

  public hide() {
    this.container.style.display = "none";
  }

  public show() {
    this.container.style.display = "flex";
    requestAnimationFrame(() => this.ps.update());
    if (this.ps2) requestAnimationFrame(() => this.ps2!.update());
  }

  public refresh() {
    this.ps.update();
    this.ps2?.update();
  }
}
