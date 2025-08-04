import Split from "split.js";

export class SplitterLayout {
  private topSplitter: HTMLDivElement;
  private bottomSplitter: HTMLDivElement;
  private topHorizontalPanes: HTMLElement[] = [];
  private bottomHorizontalPanes: HTMLElement[] = [];
  private verticalSizes: number[] = [50, 50];

  private topSizesMap = new Map<HTMLElement, number>();
  private bottomSizesMap = new Map<HTMLElement, number>();

  private verticalSplitInstance: ReturnType<typeof Split> | null = null;
  private topHorizontalSplitInstance: ReturnType<typeof Split> | null = null;
  private bottomHorizontalSplitInstance: ReturnType<typeof Split> | null = null;

  constructor(
    parent: HTMLElement,
    topHeightPercent: number,
    bottomHeightPercent: number,
    private onResize?: () => void
  ) {
    const wrapper = document.createElement("div");
    wrapper.className = "splitter-layout-wrapper";

    this.topSplitter = document.createElement("div");
    this.bottomSplitter = document.createElement("div");

    this.topSplitter.className = "top-splitter-layout-wrapper";
    this.bottomSplitter.className = "bottom-splitter-layout-wrapper";

    wrapper.appendChild(this.topSplitter);
    wrapper.appendChild(this.bottomSplitter);
    parent.appendChild(wrapper);

    this.verticalSizes = [topHeightPercent, bottomHeightPercent];
    this.verticalSplitInstance = Split(
      [this.topSplitter, this.bottomSplitter],
      {
        sizes: this.verticalSizes,
        minSize: [50, 50],
        direction: "vertical",
        gutterSize: 2,
        gutterStyle: (dimension, gutterSize) => ({
          [dimension]: `${gutterSize}px`,
        }),
        snapOffset: 0,
        gutter: (_, direction) => this.createGutter(direction),
        cursor: "row-resize",
        onDrag: (sizes) => {
          this.verticalSizes = sizes;
          this.onResize?.();
        },
      }
    );
  }

  public addTopSplitterPane(pane: HTMLElement, sizePercent?: number) {
    this.topHorizontalPanes.push(pane);
    if (sizePercent !== undefined) this.topSizesMap.set(pane, sizePercent);
    pane.style.display = "block";
    this.recalculateTopSizes();
  }

  public hideTopPane(pane: HTMLElement) {
    if (!this.topHorizontalPanes.includes(pane)) return;
    this.storeSizes(
      this.topSplitter,
      this.topHorizontalPanes,
      this.topSizesMap
    );
    pane.style.display = "none";
    this.recalculateTopSizes();
  }

  public showTopPane(pane: HTMLElement) {
    if (!this.topHorizontalPanes.includes(pane)) return;
    pane.style.display = "block";
    this.recalculateTopSizes();
  }

  public removeTopSplitterPane(pane: HTMLElement) {
    const index = this.topHorizontalPanes.indexOf(pane);
    if (index !== -1) {
      this.topHorizontalPanes.splice(index, 1);
      this.topSizesMap.delete(pane);
      this.recalculateTopSizes();
    }
  }

  private recalculateTopSizes() {
    const visible = this.topHorizontalPanes.filter(
      (p) => p.style.display !== "none"
    );

    if (this.topHorizontalSplitInstance) {
      this.topHorizontalSplitInstance.destroy();
      this.topHorizontalSplitInstance = null;
    }

    if (visible.length === 0) {
      this.topSplitter.innerHTML = "";
      return;
    }

    let sizes: number[] = [];

    if (visible.length === 1) {
      sizes = [100];
    } else {
      sizes = this.getStoredSizes(visible, this.topSizesMap);
    }

    this.topHorizontalSplitInstance = this.renderHorizontalSplit(
      this.topSplitter,
      visible,
      sizes,
      this.topHorizontalPanes,
      this.topSizesMap
    );
    this.onResize?.();
  }

  public addBottomSplitterPane(pane: HTMLElement, sizePercent?: number) {
    this.bottomHorizontalPanes.push(pane);
    if (sizePercent !== undefined) this.bottomSizesMap.set(pane, sizePercent);
    pane.style.display = "block";
    this.recalculateBottomSizes();
  }

  public hideBottomPane(pane: HTMLElement) {
    if (!this.bottomHorizontalPanes.includes(pane)) return;
    this.storeSizes(
      this.bottomSplitter,
      this.bottomHorizontalPanes,
      this.bottomSizesMap
    );
    pane.style.display = "none";
    this.recalculateBottomSizes();
  }

  public showBottomPane(pane: HTMLElement) {
    if (!this.bottomHorizontalPanes.includes(pane)) return;
    pane.style.display = "block";
    this.recalculateBottomSizes();
  }

  public removeBottomSplitterPane(pane: HTMLElement) {
    const index = this.bottomHorizontalPanes.indexOf(pane);
    if (index !== -1) {
      this.bottomHorizontalPanes.splice(index, 1);
      this.bottomSizesMap.delete(pane);
      this.recalculateBottomSizes();
    }
  }

  private recalculateBottomSizes() {
    const visible = this.bottomHorizontalPanes.filter(
      (p) => p.style.display !== "none"
    );

    if (this.bottomHorizontalSplitInstance) {
      this.bottomHorizontalSplitInstance.destroy();
      this.bottomHorizontalSplitInstance = null;
    }

    if (visible.length === 0) {
      this.bottomSplitter.innerHTML = "";
      return;
    }

    const sizes =
      visible.length === 1
        ? [100]
        : this.getStoredSizes(visible, this.bottomSizesMap);

    this.bottomHorizontalSplitInstance = this.renderHorizontalSplit(
      this.bottomSplitter,
      visible,
      sizes,
      this.bottomHorizontalPanes,
      this.bottomSizesMap
    );
    this.onResize?.();
  }

  private renderHorizontalSplit(
    container: HTMLElement,
    panes: HTMLElement[],
    sizes: number[],
    allPanes: HTMLElement[],
    sizesMap: Map<HTMLElement, number>
  ): ReturnType<typeof Split> {
    container.innerHTML = "";
    const wrappers = panes.map((pane) => {
      const wrapper = document.createElement("div");
      wrapper.className = "split-horizontal-pane";
      wrapper.appendChild(pane);
      container.appendChild(wrapper);
      return wrapper;
    });

    return Split(wrappers, {
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
      onDrag: () => this.storeSizes(container, allPanes, sizesMap),
    });
  }

  private storeSizes(
    container: HTMLElement,
    allPanes: HTMLElement[],
    sizesMap: Map<HTMLElement, number>
  ) {
    const wrappers = Array.from(container.children).filter((el) =>
      el.classList.contains("split-horizontal-pane")
    ) as HTMLDivElement[];

    const total = wrappers.reduce((acc, w) => acc + w.offsetWidth, 0);

    wrappers.forEach((wrapper) => {
      const pane = wrapper.firstElementChild as HTMLElement;
      if (pane && allPanes.includes(pane)) {
        const size = (wrapper.offsetWidth / total) * 100;
        sizesMap.set(pane, size);
      }
    });
  }

  private getStoredSizes(
    panes: HTMLElement[],
    sizesMap: Map<HTMLElement, number>
  ): number[] {
    const result: number[] = [];
    let remaining = 100;
    let untracked = 0;

    for (const pane of panes) {
      const size = sizesMap.get(pane);
      if (size !== undefined) {
        result.push(size);
        remaining -= size;
      } else {
        result.push(-1);
        untracked++;
      }
    }

    const fallbackSize = untracked > 0 ? remaining / untracked : 0;
    return result.map((s) => (s === -1 ? fallbackSize : s));
  }

  private createGutter(direction: "horizontal" | "vertical"): HTMLDivElement {
    const gutter = document.createElement("div");
    gutter.className = `gutter gutter-${direction}`;

    if (!window["__gutter_cleanup_bound__"]) {
      const cleanup = () => document.body.classList.remove("dragging-gutter");
      window.addEventListener("mouseup", cleanup);
      window.addEventListener("blur", cleanup);
      window.addEventListener("mouseleave", cleanup);
      window["__gutter_cleanup_bound__"] = true;
    }

    return gutter;
  }

  private recalculateVerticalSizes() {
    if (this.verticalSplitInstance) {
      this.verticalSplitInstance.destroy();
      this.verticalSplitInstance = null;
    }

    const panes: HTMLElement[] = [];
    const sizes: number[] = [];

    if (this.topSplitter.style.display !== "none") {
      panes.push(this.topSplitter);
    }
    if (this.bottomSplitter.style.display !== "none") {
      panes.push(this.bottomSplitter);
    }

    const count = panes.length;
    if (count === 0) return;

    if (count === 1) {
      sizes.push(100);
    } else {
      if (this.verticalSizes.length === 2) {
        sizes.push(...this.verticalSizes);
      } else {
        sizes.push(50, 50);
      }
    }

    this.verticalSplitInstance = Split(panes, {
      sizes,
      minSize: 50,
      direction: "vertical",
      gutterSize: 2,
      gutterStyle: (dimension, gutterSize) => ({
        [dimension]: `${gutterSize}px`,
      }),
      snapOffset: 0,
      gutter: (_, direction) => this.createGutter(direction),
      cursor: "row-resize",
      onDrag: (sizes) => {
        this.verticalSizes = sizes;
        this.onResize?.();
      },
    });
  }

  public getTopSplitterDomElement() {
    return this.topSplitter;
  }

  public getBottomSplitterDomElement() {
    return this.bottomSplitter;
  }

  public toggleTopSplitter(visible: boolean) {
    this.topSplitter.style.display = visible ? "flex" : "none";
    this.recalculateVerticalSizes();
    this.onResize?.();
  }

  public toggleBottomSplitter(visible: boolean) {
    this.bottomSplitter.style.display = visible ? "block" : "none";
    this.recalculateVerticalSizes();
    this.onResize?.();
  }

  public destroy() {
    if (this.verticalSplitInstance) {
      this.verticalSplitInstance.destroy();
      this.verticalSplitInstance = null;
    }
    if (this.topHorizontalSplitInstance) {
      this.topHorizontalSplitInstance.destroy();
      this.topHorizontalSplitInstance = null;
    }
    if (this.bottomHorizontalSplitInstance) {
      this.bottomHorizontalSplitInstance.destroy();
      this.bottomHorizontalSplitInstance = null;
    }
  }
}
