import PerfectScrollbar from "perfect-scrollbar";
import { ElementCore } from "./elementCore.js";

export class TabsLayout extends ElementCore {
  private wrapper: HTMLDivElement;
  private extraButtonsContainer?: HTMLDivElement;
  private ps: PerfectScrollbar;

  constructor(
    private parent: HTMLDivElement,
    private props?: any[]
  ) {
    super();
    this.elementEl = document.createElement("div");
    this.elementEl.className = "tabs-layout-container";
    this.elementEl.style.height = "42px";
    this.elementEl.style.width = "100%";
    this.elementEl.style.position = "relative";
    this.elementEl.style.display = "flex";
    this.elementEl.style.alignItems = "flex-end";

    this.wrapper = document.createElement("div");
    this.wrapper.className = "tabs-layout-wrapper scrollbar-container";
    this.wrapper.style.flex = "1";
    this.wrapper.style.display = "flex";
    this.wrapper.style.alignItems = "center";
    this.wrapper.style.minHeight = "0";

    this.elementEl.appendChild(this.wrapper);

    this.ps = new PerfectScrollbar(this.wrapper, {
      wheelPropagation: false,
      suppressScrollY: true,
      suppressScrollX: false,
    });

    this.fixScrollbarPosition();

    if (Array.isArray(this.props) && this.props.length > 0) {
      this.extraButtonsContainer = document.createElement("div");
      this.extraButtonsContainer.className =
        "tabs-layout-extra-buttons scrollbar-container";
      this.extraButtonsContainer.style.display = "flex";
      this.extraButtonsContainer.style.alignItems = "center";

      this.elementEl.appendChild(this.extraButtonsContainer);

      this.props.forEach((buttonEl) => {
        if (buttonEl instanceof HTMLElement) {
          this.extraButtonsContainer!.appendChild(buttonEl);
        }
      });
    }

    this.parent.appendChild(this.elementEl);

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

    requestAnimationFrame(() => {
      this.ps.update();
      this.fixScrollbarPosition();
    });
  }

  private fixScrollbarPosition(scrollbar?: PerfectScrollbar) {
    const element = scrollbar ? this.extraButtonsContainer : this.wrapper;

    if (element) {
      requestAnimationFrame(() => {
        const rail = element.querySelector(".ps__rail-x") as HTMLElement;
        if (rail) {
          rail.style.bottom = "0px";
          rail.style.top = "auto";
          rail.style.transform = "none";
          rail.style.height = "6px";
        }
      });
    }
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

        this.fixScrollbarPosition();
      }

      this.clearDropIndicators();
    });

    this.wrapper.appendChild(tab);
    requestAnimationFrame(() => {
      this.wrapper.scrollLeft = this.wrapper.scrollWidth;
      this.ps.update();

      this.fixScrollbarPosition();
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

    this.fixScrollbarPosition();
  }

  public hide() {
    this.elementEl!.style.display = "none";
  }

  public show() {
    this.elementEl!.style.display = "flex";
    requestAnimationFrame(() => {
      this.ps.update();
      this.fixScrollbarPosition();
    });
  }

  public refresh() {
    this.ps.update();

    this.fixScrollbarPosition();
  }
}
