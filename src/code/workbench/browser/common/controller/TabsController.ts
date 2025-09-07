export interface TabsConfig {
  height?: string;
  customBg?: string;
  extraButtons?: HTMLElement[];
}

export class TabsController {
  private wrapper: HTMLDivElement;
  private extraButtonsContainer?: HTMLDivElement;
  private isDestroyed = false;

  constructor(
    private container: HTMLDivElement,
    private config: TabsConfig = {}
  ) {
    this.wrapper = this.createWrapper();
    this.setupExtraButtons();
    this.attachEventListeners();
  }

  private createWrapper(): HTMLDivElement {
    const wrapper = document.createElement("div");
    wrapper.className = "tabs-layout-wrapper scrollbar-container";
    return wrapper;
  }

  private setupExtraButtons() {
    if (
      Array.isArray(this.config.extraButtons) &&
      this.config.extraButtons.length > 0
    ) {
      this.extraButtonsContainer = document.createElement("div");
      this.extraButtonsContainer.className = "tabs-layout-extra-buttons";
      this.extraButtonsContainer.style.cssText = `
        display: flex;
        align-items: center;
        flex-shrink: 0;
      `;

      this.config.extraButtons.forEach((buttonEl) => {
        if (buttonEl instanceof HTMLElement) {
          this.extraButtonsContainer!.appendChild(buttonEl);
        }
      });
    }
  }

  private attachEventListeners() {
    this.wrapper.addEventListener("wheel", (e) => this.handleWheelScroll(e), {
      passive: false,
    });

    // Fix scrollbar position after DOM updates
    const observer = new MutationObserver(() => {
      if (!this.isDestroyed) {
        this.updateScrollbar();
      }
    });

    observer.observe(this.wrapper, {
      childList: true,
      subtree: true,
    });
  }

  private handleWheelScroll(e: WheelEvent) {
    const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (delta !== 0) {
      this.wrapper.scrollLeft += delta;
      e.preventDefault();
      e.stopPropagation();
      this.updateScrollbar();
    }
  }

  public addTab(tab: HTMLDivElement): void {
    if (this.isDestroyed) return;

    this.setupTabDragAndDrop(tab);
    this.wrapper.appendChild(tab);

    requestAnimationFrame(() => {
      this.scrollToEnd();
      this.updateScrollbar();
    });
  }

  private setupTabDragAndDrop(tab: HTMLDivElement) {
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
      this.handleDragOver(tab);
    });

    tab.addEventListener("drop", (e) => {
      e.preventDefault();
      this.handleDrop(tab);
    });
  }

  private handleDragOver(tab: HTMLDivElement) {
    const draggingEl = this.wrapper.querySelector(".dragging");
    if (draggingEl && draggingEl !== tab) {
      this.clearDropIndicators();
      tab.classList.add("drag-over");
    }
  }

  private handleDrop(dropTarget: HTMLDivElement) {
    const draggingEl = this.wrapper.querySelector(".dragging") as HTMLElement;
    if (draggingEl && draggingEl !== dropTarget) {
      const tabs = Array.from(this.wrapper.children);
      const dropIndex = tabs.indexOf(dropTarget);
      const dragIndex = tabs.indexOf(draggingEl);

      if (dragIndex < dropIndex) {
        dropTarget.after(draggingEl);
      } else {
        dropTarget.before(draggingEl);
      }

      this.updateScrollbar();
    }
    this.clearDropIndicators();
  }

  private clearDropIndicators() {
    this.wrapper
      .querySelectorAll(".drag-over")
      .forEach((el) => el.classList.remove("drag-over"));
  }

  public removeAllTabs(): void {
    if (this.isDestroyed) return;

    this.wrapper.innerHTML = "";
    this.updateScrollbar();
  }

  public scrollToEnd(): void {
    if (this.isDestroyed) return;

    this.wrapper.scrollLeft = this.wrapper.scrollWidth;
  }

  public updateScrollbar(): void {
    if (this.isDestroyed) return;

    requestAnimationFrame(() => {});
  }

  public show(): void {
    if (this.isDestroyed) return;

    requestAnimationFrame(() => {
      this.updateScrollbar();
    });
  }

  public getWrapper(): HTMLDivElement {
    return this.wrapper;
  }

  public getExtraButtonsContainer(): HTMLDivElement | undefined {
    return this.extraButtonsContainer;
  }

  public destroy(): void {
    if (this.isDestroyed) return;

    this.isDestroyed = true;

    try {
    } catch (error) {
      console.warn("Error destroying PerfectScrollbar:", error);
    }
  }
}
