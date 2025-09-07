import Split from "split.js";

export class SplitterController {
  private verticalSplitInstance: ReturnType<typeof Split> | null = null;
  private topHorizontalSplitInstance: ReturnType<typeof Split> | null = null;
  private bottomHorizontalSplitInstance: ReturnType<typeof Split> | null = null;

  private isDestroyed = false;
  private isRecalculating = false;

  constructor(private onResize?: () => void) {}

  public createVerticalSplit(
    panes: HTMLElement[],
    sizes: number[],
    onSizeChange: (sizes: number[]) => void
  ): ReturnType<typeof Split> {
    return Split(panes, {
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
      onDragStart: () => this.setDragState("row-resize"),
      onDrag: onSizeChange,
      onDragEnd: () => {
        this.clearDragState();
        this.onResize?.();
      },
    });
  }

  public createHorizontalSplit(
    container: HTMLElement,
    panes: HTMLElement[],
    sizes: number[],
    onDrag: () => void,
    onDragEnd: () => void
  ): ReturnType<typeof Split> {
    if (this.isDestroyed || panes.length === 0) {
      throw new Error(
        "Cannot render split on destroyed instance or empty panes"
      );
    }

    container.innerHTML = "";
    const wrappers = this.createPaneWrappers(container, panes);

    return Split(wrappers, {
      sizes:
        sizes.length === wrappers.length
          ? sizes
          : this.generateEqualSizes(wrappers.length),
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
      onDragStart: () => this.setDragState("col-resize"),
      onDrag: onDrag,
      onDragEnd: () => {
        this.clearDragState();
        onDragEnd();
      },
    });
  }

  public setSplitSizes(
    splitInstance: ReturnType<typeof Split> | null,
    sizes: number[]
  ) {
    if (splitInstance && sizes.length > 0) {
      splitInstance.setSizes(sizes);
    }
  }

  public destroySplit(splitInstance: ReturnType<typeof Split> | null) {
    if (splitInstance) {
      try {
        splitInstance.destroy();
      } catch (error) {
        console.warn("Error destroying split instance:", error);
      }
    }
    return null;
  }

  public calculateSizes(
    container: HTMLElement,
    allPanes: HTMLElement[]
  ): Map<HTMLElement, number> {
    const sizesMap = new Map<HTMLElement, number>();

    if (this.isDestroyed || !container) return sizesMap;

    try {
      const wrappers = Array.from(container.children).filter((el) =>
        el.classList.contains("split-horizontal-pane")
      ) as HTMLDivElement[];

      if (wrappers.length === 0) return sizesMap;

      const containerWidth = container.offsetWidth;
      if (containerWidth <= 0) return sizesMap;

      let totalWidth = 0;
      const widths = wrappers.map((wrapper) => {
        const width = wrapper.offsetWidth;
        totalWidth += width;
        return width;
      });

      if (totalWidth <= 0) return sizesMap;

      wrappers.forEach((wrapper, index) => {
        const pane = wrapper.firstElementChild as HTMLElement;
        if (pane && allPanes.includes(pane)) {
          const percentage = (widths[index] / totalWidth) * 100;
          const normalizedPercentage = Math.max(5, Math.min(95, percentage));
          sizesMap.set(pane, normalizedPercentage);
        }
      });
    } catch (error) {
      console.warn("Error calculating sizes:", error);
    }

    return sizesMap;
  }

  public normalizeSizes(sizes: number[]): number[] {
    if (sizes.length === 0) return [];
    if (sizes.length === 1) return [100];

    const total = sizes.reduce((sum, size) => sum + Math.max(0, size), 0);
    if (total <= 0) return this.generateEqualSizes(sizes.length);

    return sizes.map((size) => {
      const normalized = (Math.max(0, size) / total) * 100;
      return Math.max(5, normalized);
    });
  }

  public generateEqualSizes(count: number): number[] {
    if (count <= 0) return [];
    const size = 100 / count;
    return Array(count).fill(size);
  }

  public debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout | null = null;
    return ((...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    }) as T;
  }

  private createPaneWrappers(
    container: HTMLElement,
    panes: HTMLElement[]
  ): HTMLElement[] {
    return panes.map((pane) => {
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

    this.bindGlobalCleanup();
    return gutter;
  }

  private setDragState(cursor: string) {
    document.body.style.cursor = cursor;
    document.body.classList.add("dragging-gutter");
  }

  private clearDragState() {
    document.body.style.cursor = "";
    document.body.classList.remove("dragging-gutter");
  }

  private bindGlobalCleanup() {
    if (!window["__gutter_cleanup_bound__"]) {
      const cleanup = () => this.clearDragState();
      window.addEventListener("mouseup", cleanup);
      window.addEventListener("blur", cleanup);
      window.addEventListener("mouseleave", cleanup);
      window["__gutter_cleanup_bound__"] = true;
    }
  }

  public destroy() {
    this.isDestroyed = true;
    this.isRecalculating = false;
  }

  public get destroyed() {
    return this.isDestroyed;
  }

  public get recalculating() {
    return this.isRecalculating;
  }

  public setRecalculating(value: boolean) {
    this.isRecalculating = value;
  }
}
