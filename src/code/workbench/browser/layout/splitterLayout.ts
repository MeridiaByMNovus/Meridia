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

  private isDestroyed = false;
  private isRecalculating = false;

  constructor(
    parent: HTMLElement,
    topHeightPercent: number,
    bottomHeightPercent: number,
    private onResize?: () => void
  ) {
    const wrapper = document.createElement("div");
    wrapper.className = "splitter-layout-wrapper";
    wrapper.style.cssText = `
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
    `;

    this.topSplitter = document.createElement("div");
    this.bottomSplitter = document.createElement("div");

    this.topSplitter.className = "top-splitter-layout-wrapper";
    this.bottomSplitter.className = "bottom-splitter-layout-wrapper";

    this.topSplitter.style.cssText = `
      display: flex;
      width: 100%;
      min-height: 50px;
    `;
    this.bottomSplitter.style.cssText = `
      display: flex;
      width: 100%;
      min-height: 50px;
    `;

    wrapper.appendChild(this.topSplitter);
    wrapper.appendChild(this.bottomSplitter);
    parent.appendChild(wrapper);

    const total = topHeightPercent + bottomHeightPercent;
    if (total > 0) {
      this.verticalSizes = [
        (topHeightPercent / total) * 100,
        (bottomHeightPercent / total) * 100,
      ];
    } else {
      this.verticalSizes = [50, 50];
    }

    this.initializeVerticalSplit();
  }

  private initializeVerticalSplit() {
    if (this.isDestroyed) return;

    this.verticalSplitInstance = Split(
      [this.topSplitter, this.bottomSplitter],
      {
        sizes: this.verticalSizes,
        minSize: [50, 50],
        direction: "vertical",
        gutterSize: 1,
        gutterStyle: (dimension, gutterSize) => ({
          [dimension]: `${gutterSize}px`,
          "background-color": "var(--border-color, #3c3c3c)",
          cursor: "row-resize",
        }),
        snapOffset: 10,
        gutter: (_, direction) => this.createGutter(direction),
        cursor: "row-resize",
        onDragStart: () => {
          document.body.style.cursor = "row-resize";
          document.body.classList.add("dragging-gutter");
        },
        onDrag: (sizes) => {
          if (!this.isDestroyed && sizes && sizes.length >= 2) {
            this.verticalSizes = [...sizes];
            this.debounceResize();
          }
        },
        onDragEnd: () => {
          document.body.style.cursor = "";
          document.body.classList.remove("dragging-gutter");
          this.onResize?.();
        },
      }
    );
  }

  public addTopSplitterPane(pane: HTMLElement, sizePercent?: number) {
    if (this.isDestroyed || this.topHorizontalPanes.includes(pane)) return;

    this.topHorizontalPanes.push(pane);

    if (sizePercent !== undefined && sizePercent > 0) {
      this.topSizesMap.set(pane, Math.max(5, Math.min(95, sizePercent)));
    }

    pane.style.display = "block";
    this.recalculateTopSizes();
  }

  public hideTopPane(pane: HTMLElement) {
    if (!this.topHorizontalPanes.includes(pane) || this.isDestroyed) return;

    this.storeSizes(
      this.topSplitter,
      this.topHorizontalPanes,
      this.topSizesMap
    );

    pane.style.display = "none";
    this.recalculateTopSizes();
  }

  public showTopPane(pane: HTMLElement) {
    if (!this.topHorizontalPanes.includes(pane) || this.isDestroyed) return;

    pane.style.display = "block";
    this.recalculateTopSizes();
  }

  public removeTopSplitterPane(pane: HTMLElement) {
    if (this.isDestroyed) return;

    const index = this.topHorizontalPanes.indexOf(pane);
    if (index !== -1) {
      this.topHorizontalPanes.splice(index, 1);
      this.topSizesMap.delete(pane);

      if (pane.parentElement) {
        pane.parentElement.remove();
      }

      this.recalculateTopSizes();
    }
  }

  private recalculateTopSizes() {
    if (this.isDestroyed || this.isRecalculating) return;

    this.isRecalculating = true;

    try {
      const visible = this.topHorizontalPanes.filter(
        (p) => p.style.display !== "none"
      );

      if (this.topHorizontalSplitInstance) {
        this.topHorizontalSplitInstance.destroy();
        this.topHorizontalSplitInstance = null;
      }

      this.topSplitter.innerHTML = "";

      if (visible.length === 0) {
        this.isRecalculating = false;
        return;
      }

      let sizes: number[] = [];

      if (visible.length === 1) {
        sizes = [100];
      } else {
        sizes = this.getStoredSizes(visible, this.topSizesMap);
        sizes = this.normalizeSizes(sizes);
      }

      this.topHorizontalSplitInstance = this.renderHorizontalSplit(
        this.topSplitter,
        visible,
        sizes,
        this.topHorizontalPanes,
        this.topSizesMap
      );
    } finally {
      this.isRecalculating = false;
      this.debounceResize();
    }
  }

  public addBottomSplitterPane(pane: HTMLElement, sizePercent?: number) {
    if (this.isDestroyed || this.bottomHorizontalPanes.includes(pane)) return;

    this.bottomHorizontalPanes.push(pane);

    if (sizePercent !== undefined && sizePercent > 0) {
      this.bottomSizesMap.set(pane, Math.max(5, Math.min(95, sizePercent)));
    }

    pane.style.display = "block";
    this.recalculateBottomSizes();
  }

  public hideBottomPane(pane: HTMLElement) {
    if (!this.bottomHorizontalPanes.includes(pane) || this.isDestroyed) return;

    this.storeSizes(
      this.bottomSplitter,
      this.bottomHorizontalPanes,
      this.bottomSizesMap
    );

    pane.style.display = "none";
    this.recalculateBottomSizes();
  }

  public showBottomPane(pane: HTMLElement) {
    if (!this.bottomHorizontalPanes.includes(pane) || this.isDestroyed) return;

    pane.style.display = "block";
    this.recalculateBottomSizes();
  }

  public removeBottomSplitterPane(pane: HTMLElement) {
    if (this.isDestroyed) return;

    const index = this.bottomHorizontalPanes.indexOf(pane);
    if (index !== -1) {
      this.bottomHorizontalPanes.splice(index, 1);
      this.bottomSizesMap.delete(pane);

      if (pane.parentElement) {
        pane.parentElement.remove();
      }

      this.recalculateBottomSizes();
    }
  }

  private recalculateBottomSizes() {
    if (this.isDestroyed || this.isRecalculating) return;

    this.isRecalculating = true;

    try {
      const visible = this.bottomHorizontalPanes.filter(
        (p) => p.style.display !== "none"
      );

      if (this.bottomHorizontalSplitInstance) {
        this.bottomHorizontalSplitInstance.destroy();
        this.bottomHorizontalSplitInstance = null;
      }

      this.bottomSplitter.innerHTML = "";

      if (visible.length === 0) {
        this.isRecalculating = false;
        return;
      }

      let sizes: number[] = [];

      if (visible.length === 1) {
        sizes = [100];
      } else {
        sizes = this.getStoredSizes(visible, this.bottomSizesMap);
        sizes = this.normalizeSizes(sizes);
      }

      this.bottomHorizontalSplitInstance = this.renderHorizontalSplit(
        this.bottomSplitter,
        visible,
        sizes,
        this.bottomHorizontalPanes,
        this.bottomSizesMap
      );
    } finally {
      this.isRecalculating = false;
      this.debounceResize();
    }
  }

  private renderHorizontalSplit(
    container: HTMLElement,
    panes: HTMLElement[],
    sizes: number[],
    allPanes: HTMLElement[],
    sizesMap: Map<HTMLElement, number>
  ): ReturnType<typeof Split> {
    if (this.isDestroyed || panes.length === 0) {
      throw new Error(
        "Cannot render split on destroyed instance or empty panes"
      );
    }

    container.innerHTML = "";

    const wrappers = panes.map((pane, index) => {
      const wrapper = document.createElement("div");
      wrapper.className = "split-horizontal-pane";
      wrapper.style.cssText = `
        width: 100%;
        height: 100%;
        overflow: hidden;
        position: relative;
      `;

      pane.style.cssText = `
        width: 100%;
        height: 100%;
        display: block;
      `;

      wrapper.appendChild(pane);
      container.appendChild(wrapper);
      return wrapper;
    });

    const normalizedSizes =
      sizes.length === wrappers.length
        ? sizes
        : this.generateEqualSizes(wrappers.length);

    return Split(wrappers, {
      sizes: normalizedSizes,
      minSize: 50,
      direction: "horizontal",
      gutterSize: 1,
      gutterStyle: (dimension, gutterSize) => ({
        [dimension]: `${gutterSize}px`,
        "background-color": "var(--border-color, #3c3c3c)",
        cursor: "col-resize",
      }),
      snapOffset: 10,
      gutter: (_, direction) => this.createGutter(direction),
      cursor: "col-resize",
      onDragStart: () => {
        document.body.style.cursor = "col-resize";
        document.body.classList.add("dragging-gutter");
      },
      onDrag: () => {
        this.debounceStoreSizes(container, allPanes, sizesMap);
      },
      onDragEnd: () => {
        document.body.style.cursor = "";
        document.body.classList.remove("dragging-gutter");
        this.storeSizes(container, allPanes, sizesMap);
      },
    });
  }

  private debounceStoreSizes = this.debounce(
    (
      container: HTMLElement,
      allPanes: HTMLElement[],
      sizesMap: Map<HTMLElement, number>
    ) => {
      this.storeSizes(container, allPanes, sizesMap);
    },
    16
  );

  private storeSizes(
    container: HTMLElement,
    allPanes: HTMLElement[],
    sizesMap: Map<HTMLElement, number>
  ) {
    if (this.isDestroyed || !container) return;

    try {
      const wrappers = Array.from(container.children).filter((el) =>
        el.classList.contains("split-horizontal-pane")
      ) as HTMLDivElement[];

      if (wrappers.length === 0) return;

      const containerWidth = container.offsetWidth;
      if (containerWidth <= 0) return;

      let totalWidth = 0;
      const widths: number[] = [];

      wrappers.forEach((wrapper) => {
        const width = wrapper.offsetWidth;
        widths.push(width);
        totalWidth += width;
      });

      if (totalWidth <= 0) return;

      wrappers.forEach((wrapper, index) => {
        const pane = wrapper.firstElementChild as HTMLElement;
        if (pane && allPanes.includes(pane)) {
          const percentage = (widths[index] / totalWidth) * 100;
          const normalizedPercentage = Math.max(5, Math.min(95, percentage));
          sizesMap.set(pane, normalizedPercentage);
        }
      });
    } catch (error) {
      console.warn("Error storing sizes:", error);
    }
  }

  private getStoredSizes(
    panes: HTMLElement[],
    sizesMap: Map<HTMLElement, number>
  ): number[] {
    if (panes.length === 0) return [];
    if (panes.length === 1) return [100];

    const result: number[] = [];
    let totalStored = 0;
    let untrackedCount = 0;

    for (const pane of panes) {
      const size = sizesMap.get(pane);
      if (size !== undefined && size > 0) {
        const normalizedSize = Math.max(5, Math.min(95, size));
        result.push(normalizedSize);
        totalStored += normalizedSize;
      } else {
        result.push(-1);
        untrackedCount++;
      }
    }

    const remaining = Math.max(0, 100 - totalStored);
    const fallbackSize = untrackedCount > 0 ? remaining / untrackedCount : 0;

    return result.map((size) =>
      size === -1 ? Math.max(5, fallbackSize) : size
    );
  }

  private normalizeSizes(sizes: number[]): number[] {
    if (sizes.length === 0) return [];
    if (sizes.length === 1) return [100];

    const total = sizes.reduce((sum, size) => sum + Math.max(0, size), 0);

    if (total <= 0) {
      return this.generateEqualSizes(sizes.length);
    }

    return sizes.map((size) => {
      const normalized = (Math.max(0, size) / total) * 100;
      return Math.max(5, normalized);
    });
  }

  private generateEqualSizes(count: number): number[] {
    if (count <= 0) return [];
    const size = 100 / count;
    return Array(count).fill(size);
  }

  private createGutter(direction: "horizontal" | "vertical"): HTMLDivElement {
    const gutter = document.createElement("div");
    gutter.className = `gutter gutter-${direction}`;

    gutter.style.cssText = `
      background-color: var(--border-color, #3c3c3c);
      position: relative;
      z-index: 1;
      ${direction === "horizontal" ? "cursor: col-resize;" : "cursor: row-resize;"}
    `;

    if (!window["__gutter_cleanup_bound__"]) {
      const cleanup = () => {
        document.body.classList.remove("dragging-gutter");
        document.body.style.cursor = "";
      };

      window.addEventListener("mouseup", cleanup);
      window.addEventListener("blur", cleanup);
      window.addEventListener("mouseleave", cleanup);
      window["__gutter_cleanup_bound__"] = true;
    }

    return gutter;
  }

  private recalculateVerticalSizes() {
    if (this.isDestroyed || this.isRecalculating) return;

    this.isRecalculating = true;

    try {
      if (this.verticalSplitInstance) {
        this.verticalSplitInstance.destroy();
        this.verticalSplitInstance = null;
      }

      const panes: HTMLElement[] = [];

      if (this.topSplitter.style.display !== "none") {
        panes.push(this.topSplitter);
      }
      if (this.bottomSplitter.style.display !== "none") {
        panes.push(this.bottomSplitter);
      }

      if (panes.length === 0) {
        this.isRecalculating = false;
        return;
      }

      let sizes: number[] = [];

      if (panes.length === 1) {
        sizes = [100];
      } else if (panes.length === 2) {
        if (
          this.verticalSizes.length === 2 &&
          this.verticalSizes.every((s) => s > 0 && s < 100)
        ) {
          sizes = [...this.verticalSizes];
        } else {
          sizes = [50, 50];
        }
        sizes = this.normalizeSizes(sizes);
      }

      this.verticalSplitInstance = Split(panes, {
        sizes,
        minSize: [50, 50],
        direction: "vertical",
        gutterSize: 1,
        gutterStyle: (dimension, gutterSize) => ({
          [dimension]: `${gutterSize}px`,
          "background-color": "var(--border-color, #3c3c3c)",
          cursor: "row-resize",
        }),
        snapOffset: 10,
        gutter: (_, direction) => this.createGutter(direction),
        cursor: "row-resize",
        onDragStart: () => {
          document.body.style.cursor = "row-resize";
          document.body.classList.add("dragging-gutter");
        },
        onDrag: (newSizes) => {
          if (!this.isDestroyed && newSizes && newSizes.length >= 2) {
            this.verticalSizes = [...newSizes];
            this.debounceResize();
          }
        },
        onDragEnd: () => {
          document.body.style.cursor = "";
          document.body.classList.remove("dragging-gutter");
          this.onResize?.();
        },
      });
    } finally {
      this.isRecalculating = false;
    }
  }

  private debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): T {
    let timeout: NodeJS.Timeout | null = null;
    return ((...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    }) as T;
  }

  private debounceResize = this.debounce(() => {
    if (!this.isDestroyed) {
      this.onResize?.();
    }
  }, 16);

  public getTopSplitterDomElement() {
    return this.topSplitter;
  }

  public getBottomSplitterDomElement() {
    return this.bottomSplitter;
  }

  public toggleTopSplitter(visible: boolean) {
    if (this.isDestroyed) return;

    this.topSplitter.style.display = visible ? "flex" : "none";
    this.recalculateVerticalSizes();
    this.debounceResize();
  }

  public toggleBottomSplitter(visible: boolean) {
    if (this.isDestroyed) return;

    this.bottomSplitter.style.display = visible ? "flex" : "none";
    this.recalculateVerticalSizes();
    this.debounceResize();
  }

  public setSizes(topPercent: number, bottomPercent: number) {
    if (this.isDestroyed) return;

    const total = topPercent + bottomPercent;
    if (total > 0) {
      this.verticalSizes = [
        (topPercent / total) * 100,
        (bottomPercent / total) * 100,
      ];

      if (this.verticalSplitInstance) {
        this.verticalSplitInstance.setSizes(this.verticalSizes);
      }
    }
  }

  public getVerticalSizes(): number[] {
    return [...this.verticalSizes];
  }

  public destroy() {
    if (this.isDestroyed) return;

    this.isDestroyed = true;
    this.isRecalculating = false;

    try {
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
    } catch (error) {}

    this.topHorizontalPanes = [];
    this.bottomHorizontalPanes = [];
    this.topSizesMap.clear();
    this.bottomSizesMap.clear();

    if (this.topSplitter.parentElement) {
      this.topSplitter.parentElement.remove();
    }
  }
}
