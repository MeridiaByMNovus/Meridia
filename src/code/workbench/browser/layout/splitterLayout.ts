import Split from "split.js";

export class SplitterLayout {
  private topSplitter: HTMLDivElement;
  private bottomSplitter: HTMLDivElement;
  private topHorizontalPanes: HTMLElement[] = [];
  private bottomHorizontalPanes: HTMLElement[] = [];

  constructor(
    parent: HTMLElement,
    topHeightPercent: number,
    bottomHeightPercent: number,
    private onResize?: () => void
  ) {
    const splitterLayout = document.createElement("div");
    splitterLayout.className = "splitter-layout-wrapper";

    this.topSplitter = document.createElement("div");
    this.bottomSplitter = document.createElement("div");

    this.topSplitter.className = "top-splitter-layout-wrapper";
    this.bottomSplitter.className = "bottom-splitter-layout-wrapper";

    parent.appendChild(splitterLayout);
    splitterLayout.appendChild(this.topSplitter);
    splitterLayout.appendChild(this.bottomSplitter);

    Split([this.topSplitter, this.bottomSplitter], {
      sizes: [topHeightPercent, bottomHeightPercent],
      minSize: [50, 50],
      direction: "vertical",
      gutterSize: 1,
      gutterStyle: (dimension, gutterSize) => ({
        [dimension]: `${gutterSize}px`,
      }),
      snapOffset: 0,
      gutter: (index, direction) => this.createGutter(direction),
      cursor: "row-resize",
      onDrag: () => {
        this.onResize?.();
      },
    });
  }

  public addTopSplitterPane(pane: HTMLElement, sizePercent?: number) {
    this.topHorizontalPanes.push(pane);
    pane.style.display = "block";
    this.recalculateTopSizes(sizePercent);
  }

  public hideTopPane(pane: HTMLElement) {
    if (this.topHorizontalPanes.includes(pane)) {
      pane.style.display = "none";
      this.recalculateTopSizes();
    }
  }

  showTopPane(pane: HTMLElement | null) {
    if (!pane) {
      console.warn("showTopPane called with null or undefined pane");
      return;
    }
    if (!this.topHorizontalPanes.includes(pane)) {
      this.topHorizontalPanes.push(pane);
    }
    if (!pane.parentElement || pane.parentElement !== this.topSplitter) {
      this.topSplitter.appendChild(pane);
    }
    this.recalculateTopSizes();
  }

  public removeTopSplitterPane(pane: HTMLElement) {
    const index = this.topHorizontalPanes.indexOf(pane);
    if (index >= 0) {
      this.topHorizontalPanes.splice(index, 1);
      this.recalculateTopSizes();
    }
  }

  private recalculateTopSizes(newSizePercent?: number) {
    const visiblePanes = this.topHorizontalPanes.filter(
      (pane) => pane.style.display !== "none"
    );

    if (visiblePanes.length === 0) {
      this.topSplitter.innerHTML = "";
      return;
    }

    const sizes = this.calculateSizes(visiblePanes.length, newSizePercent);
    this.renderHorizontalSplit(this.topSplitter, visiblePanes, sizes);
  }

  public addBottomSplitterPane(pane: HTMLElement, sizePercent?: number) {
    this.bottomHorizontalPanes.push(pane);
    pane.style.display = "block";
    this.recalculateBottomSizes(sizePercent);
  }

  public hideBottomPane(pane: HTMLElement) {
    if (this.bottomHorizontalPanes.includes(pane)) {
      pane.style.display = "none";
      this.recalculateBottomSizes();
    }
  }

  public showBottomPane(pane: HTMLElement) {
    if (this.bottomHorizontalPanes.includes(pane)) {
      pane.style.display = "block";
      this.recalculateBottomSizes();
    }
  }

  public removeBottomSplitterPane(pane: HTMLElement) {
    const index = this.bottomHorizontalPanes.indexOf(pane);
    if (index >= 0) {
      this.bottomHorizontalPanes.splice(index, 1);
      this.recalculateBottomSizes();
    }
  }

  private recalculateBottomSizes(newSizePercent?: number) {
    const visiblePanes = this.bottomHorizontalPanes.filter(
      (pane) => pane.style.display !== "none"
    );

    if (visiblePanes.length === 0) {
      this.bottomSplitter.innerHTML = "";
      return;
    }

    const sizes = this.calculateSizes(visiblePanes.length, newSizePercent);
    this.renderHorizontalSplit(this.bottomSplitter, visiblePanes, sizes);
  }

  private calculateSizes(total: number, newSize?: number): number[] {
    if (total === 0) return [];

    const sizes: number[] = [];

    if (total === 1) {
      sizes.push(newSize ?? 100);
      return sizes;
    }

    const lastSize = newSize ?? 100 / total;
    const remaining = 100 - lastSize;
    const sizeForOthers = remaining / (total - 1);

    for (let i = 0; i < total; i++) {
      if (i === total - 1) {
        sizes.push(lastSize);
      } else {
        sizes.push(sizeForOthers);
      }
    }

    return sizes;
  }

  private renderHorizontalSplit(
    container: HTMLElement,
    panes: HTMLElement[],
    sizes: number[] = []
  ) {
    container.innerHTML = "";

    Array.from(container.querySelectorAll(".gutter")).forEach((el) =>
      el.remove()
    );

    const wrappers: HTMLElement[] = [];

    panes.forEach((pane) => {
      const wrapper = document.createElement("div");
      wrapper.className = "split-horizontal-pane";
      wrapper.appendChild(pane);
      container.appendChild(wrapper);
      wrappers.push(wrapper);
    });

    Split(wrappers, {
      sizes: sizes.length === wrappers.length ? sizes : undefined,
      minSize: 50,
      direction: "horizontal",
      gutterSize: 1,
      gutterStyle: (dimension, gutterSize) => ({
        [dimension]: `${gutterSize}px`,
      }),
      snapOffset: 0,
      gutter: (_, direction) => this.createGutter(direction),
      cursor: "col-resize",
    });
  }

  private createGutter(direction: "horizontal" | "vertical"): HTMLDivElement {
    const gutter = document.createElement("div");
    gutter.className = `gutter gutter-${direction}`;

    if (!window["__gutter_cleanup_bound__"]) {
      const cleanup = () => {
        document.body.classList.remove("dragging-gutter");
      };

      window.addEventListener("mouseup", cleanup);
      window.addEventListener("blur", cleanup);
      window.addEventListener("mouseleave", cleanup);

      window["__gutter_cleanup_bound__"] = true;
    }

    return gutter;
  }

  public getTopSplitterDomElement() {
    return this.topSplitter;
  }

  public getBottomSplitterDomElement() {
    return this.bottomSplitter;
  }
}
