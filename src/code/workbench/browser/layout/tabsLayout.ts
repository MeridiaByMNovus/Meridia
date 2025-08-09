import PerfectScrollbar from "perfect-scrollbar";

export class TabsLayout {
  private container: HTMLDivElement;
  private wrapper: HTMLDivElement;
  private extraButtonsContainer?: HTMLDivElement;
  private ps: PerfectScrollbar;
  private ps2?: PerfectScrollbar;

  constructor(
    private parent: HTMLDivElement,
    private props?: any[]
  ) {
    this.container = document.createElement("div");
    this.container.className = "tabs-layout-container";
    this.container.style.height = "42px";
    this.container.style.width = "100%";

    this.wrapper = document.createElement("div");
    this.wrapper.className = "tabs-layout-wrapper scrollbar-container";

    this.container.appendChild(this.wrapper);

    this.ps = new PerfectScrollbar(this.wrapper, {
      wheelPropagation: false,
      suppressScrollY: true,
      suppressScrollX: false,
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
    tab.draggable = true;

    tab.addEventListener("dragstart", (e) => {
      tab.classList.add("dragging");
      e.dataTransfer?.setData("text/plain", "");
      e.dataTransfer!.effectAllowed = "move";
    });

    tab.addEventListener("dragend", () => {
      tab.classList.remove("dragging");
      this.clearDropIndicators();
    });

    tab.addEventListener("dragover", (e) => {
      e.preventDefault();
      const draggingEl = this.wrapper.querySelector(".dragging");
      if (draggingEl !== tab) {
        this.wrapper.querySelectorAll(".drag-over").forEach((el) => {
          if (el !== tab) el.classList.remove("drag-over");
        });
        tab.classList.add("drag-over");
      }
    });

    tab.addEventListener("drop", (e) => {
      e.preventDefault();
      const draggingEl = this.wrapper.querySelector(".dragging") as HTMLElement;
      if (draggingEl && draggingEl !== tab) {
        const dropTarget = tab;
        const tabs = Array.from(this.wrapper.children);
        const dropIndex = tabs.indexOf(dropTarget);
        const dragIndex = tabs.indexOf(draggingEl);

        if (dragIndex < dropIndex) {
          dropTarget.after(draggingEl);
        } else {
          dropTarget.before(draggingEl);
        }

        this.ps.update();
        this.ps2?.update();
      }

      this.clearDropIndicators();
    });

    this.wrapper.appendChild(tab);
    requestAnimationFrame(() => {
      this.wrapper.scrollLeft = this.wrapper.scrollWidth;
      this.ps.update();
      this.ps2?.update();
    });
  }

  private clearDropIndicators() {
    this.wrapper
      .querySelectorAll(".drag-over")
      .forEach((el) => el.classList.remove("drag-over"));
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
