import Split from "split.js";

export class SplitterLayout {
  private topSplitter: HTMLDivElement;
  private bottomSplitter: HTMLDivElement;
  private topHorizontalPanes: HTMLElement[] = [];
  private bottomHorizontalPanes: HTMLElement[] = [];

  constructor(
    parent: HTMLElement,
    topHeightPercent: number,
    bottomHeightPercent: number
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
      gutterSize: 4,
      gutterStyle: (dimension, gutterSize) => ({
        [dimension]: `${gutterSize}px`,
      }),
      snapOffset: 0,
      gutter: (index, direction) => this.createGutter(direction),
      cursor: "row-resize",
    });
  }

  public addTopSplitterPane(pane: HTMLElement, sizePercent?: number) {
    this.topHorizontalPanes.push(pane);
    const sizes = this.calculateSizes(
      this.topHorizontalPanes.length,
      sizePercent
    );
    this.renderHorizontalSplit(
      this.topSplitter,
      this.topHorizontalPanes,
      sizes
    );
  }

  public addBottomSplitterPane(pane: HTMLElement) {
    this.bottomHorizontalPanes.push(pane);
    this.renderHorizontalSplit(this.bottomSplitter, this.bottomHorizontalPanes);
  }

  private calculateSizes(total: number, newSize?: number): number[] {
    const sizes: number[] = [];

    if (total === 1) {
      sizes.push(newSize ?? 100);
      return sizes;
    }

    const remaining = 100 - (newSize ?? 100 / total);
    const sizeForOthers = remaining / (total - 1);

    for (let i = 0; i < total; i++) {
      if (i === total - 1) {
        sizes.push(newSize ?? 100 / total);
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
      gutterSize: 4,
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
