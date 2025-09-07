import { SplitterController } from "./common/controller/SplitterController.js";

export class SplitterLayout {
  private topSplitter!: HTMLDivElement;
  private bottomSplitter!: HTMLDivElement;
  private topHorizontalPanes: HTMLElement[] = [];
  private bottomHorizontalPanes: HTMLElement[] = [];
  private verticalSizes: number[] = [50, 50];

  private topSizesMap = new Map<HTMLElement, number>();
  private bottomSizesMap = new Map<HTMLElement, number>();

  private verticalSplitInstance: any = null;
  private topHorizontalSplitInstance: any = null;
  private bottomHorizontalSplitInstance: any = null;

  private controller: SplitterController;
  private debounceResize: () => void;
  private debounceStoreSizes: (
    container: HTMLElement,
    allPanes: HTMLElement[],
    sizesMap: Map<HTMLElement, number>
  ) => void;

  constructor(
    parent: HTMLElement,
    topHeightPercent: number,
    bottomHeightPercent: number,
    private onResize?: () => void
  ) {
    this.controller = new SplitterController(onResize);
    this.debounceResize = this.controller.debounce(() => {
      if (!this.controller.destroyed) this.onResize?.();
    }, 16);
    this.debounceStoreSizes = this.controller.debounce(
      this.storeSizes.bind(this),
      16
    );

    this.createLayout(parent, topHeightPercent, bottomHeightPercent);
    this.initializeVerticalSplit();
  }

  private createLayout(
    parent: HTMLElement,
    topHeightPercent: number,
    bottomHeightPercent: number
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

    const splitterStyle = `
      display: flex;
      width: 100%;
      min-height: 50px;
    `;
    this.topSplitter.style.cssText = splitterStyle;
    this.bottomSplitter.style.cssText = splitterStyle;

    wrapper.appendChild(this.topSplitter);
    wrapper.appendChild(this.bottomSplitter);
    parent.appendChild(wrapper);

    const total = topHeightPercent + bottomHeightPercent;
    this.verticalSizes =
      total > 0
        ? [
            (topHeightPercent / total) * 100,
            (bottomHeightPercent / total) * 100,
          ]
        : [50, 50];
  }

  private initializeVerticalSplit() {
    if (this.controller.destroyed) return;

    this.verticalSplitInstance = this.controller.createVerticalSplit(
      [this.topSplitter, this.bottomSplitter],
      this.verticalSizes,
      (sizes) => {
        if (!this.controller.destroyed && sizes && sizes.length >= 2) {
          this.verticalSizes = [...sizes];
          this.debounceResize();
        }
      }
    );
  }

  public addTopSplitterPane(pane: HTMLElement, sizePercent?: number) {
    this.addPane(
      pane,
      sizePercent,
      this.topHorizontalPanes,
      this.topSizesMap,
      () => this.recalculateTopSizes()
    );
  }

  public addBottomSplitterPane(pane: HTMLElement, sizePercent?: number) {
    this.addPane(
      pane,
      sizePercent,
      this.bottomHorizontalPanes,
      this.bottomSizesMap,
      () => this.recalculateBottomSizes()
    );
  }

  private addPane(
    pane: HTMLElement,
    sizePercent: number | undefined,
    panes: HTMLElement[],
    sizesMap: Map<HTMLElement, number>,
    recalculate: () => void
  ) {
    if (this.controller.destroyed || panes.includes(pane)) return;

    panes.push(pane);
    if (sizePercent !== undefined && sizePercent > 0) {
      sizesMap.set(pane, Math.max(5, Math.min(95, sizePercent)));
    }
    pane.style.display = "block";
    recalculate();
  }

  public hideTopPane(pane: HTMLElement) {
    this.hidePaneInternal(
      pane,
      this.topHorizontalPanes,
      this.topSplitter,
      this.topSizesMap,
      () => this.recalculateTopSizes()
    );
  }

  public hideBottomPane(pane: HTMLElement) {
    this.hidePaneInternal(
      pane,
      this.bottomHorizontalPanes,
      this.bottomSplitter,
      this.bottomSizesMap,
      () => this.recalculateBottomSizes()
    );
  }

  private hidePaneInternal(
    pane: HTMLElement,
    panes: HTMLElement[],
    container: HTMLElement,
    sizesMap: Map<HTMLElement, number>,
    recalculate: () => void
  ) {
    if (!panes.includes(pane) || this.controller.destroyed) return;
    this.storeSizes(container, panes, sizesMap);
    pane.style.display = "none";
    recalculate();
  }

  public showTopPane(pane: HTMLElement) {
    this.showPaneInternal(pane, this.topHorizontalPanes, () =>
      this.recalculateTopSizes()
    );
  }

  public showBottomPane(pane: HTMLElement) {
    this.showPaneInternal(pane, this.bottomHorizontalPanes, () =>
      this.recalculateBottomSizes()
    );
  }

  private showPaneInternal(
    pane: HTMLElement,
    panes: HTMLElement[],
    recalculate: () => void
  ) {
    if (!panes.includes(pane) || this.controller.destroyed) return;
    pane.style.display = "block";
    recalculate();
  }

  public removeTopSplitterPane(pane: HTMLElement) {
    this.removePaneInternal(
      pane,
      this.topHorizontalPanes,
      this.topSizesMap,
      () => this.recalculateTopSizes()
    );
  }

  public removeBottomSplitterPane(pane: HTMLElement) {
    this.removePaneInternal(
      pane,
      this.bottomHorizontalPanes,
      this.bottomSizesMap,
      () => this.recalculateBottomSizes()
    );
  }

  private removePaneInternal(
    pane: HTMLElement,
    panes: HTMLElement[],
    sizesMap: Map<HTMLElement, number>,
    recalculate: () => void
  ) {
    if (this.controller.destroyed) return;

    const index = panes.indexOf(pane);
    if (index !== -1) {
      panes.splice(index, 1);
      sizesMap.delete(pane);
      if (pane.parentElement) pane.parentElement.remove();
      recalculate();
    }
  }

  private recalculateTopSizes() {
    this.recalculateSizes(
      this.topHorizontalPanes,
      this.topSplitter,
      this.topSizesMap,
      (instance) => {
        this.topHorizontalSplitInstance = instance;
      }
    );
  }

  private recalculateBottomSizes() {
    this.recalculateSizes(
      this.bottomHorizontalPanes,
      this.bottomSplitter,
      this.bottomSizesMap,
      (instance) => {
        this.bottomHorizontalSplitInstance = instance;
      }
    );
  }

  private recalculateSizes(
    panes: HTMLElement[],
    container: HTMLElement,
    sizesMap: Map<HTMLElement, number>,
    setSplitInstance: (instance: any) => void
  ) {
    if (this.controller.destroyed || this.controller.recalculating) return;

    this.controller.setRecalculating(true);

    try {
      const currentInstance =
        container === this.topSplitter
          ? this.topHorizontalSplitInstance
          : this.bottomHorizontalSplitInstance;
      if (currentInstance) {
        this.controller.destroySplit(currentInstance);
        setSplitInstance(null);
      }

      const visible = panes.filter((p) => p.style.display !== "none");
      if (visible.length === 0) return;

      const sizes =
        visible.length === 1
          ? [100]
          : this.controller.normalizeSizes(
              this.getStoredSizes(visible, sizesMap)
            );

      const newInstance = this.controller.createHorizontalSplit(
        container,
        visible,
        sizes,
        () => this.debounceStoreSizes(container, panes, sizesMap),
        () => this.storeSizes(container, panes, sizesMap)
      );

      setSplitInstance(newInstance);
    } finally {
      this.controller.setRecalculating(false);
      this.debounceResize();
    }
  }

  private storeSizes(
    container: HTMLElement,
    allPanes: HTMLElement[],
    sizesMap: Map<HTMLElement, number>
  ) {
    const calculatedSizes = this.controller.calculateSizes(container, allPanes);
    calculatedSizes.forEach((size, pane) => sizesMap.set(pane, size));
  }

  private getStoredSizes(
    panes: HTMLElement[],
    sizesMap: Map<HTMLElement, number>
  ): number[] {
    if (panes.length === 0) return [];
    if (panes.length === 1) return [100];

    let totalStored = 0;
    let untrackedCount = 0;

    const result = panes.map((pane) => {
      const size = sizesMap.get(pane);
      if (size !== undefined && size > 0) {
        const normalizedSize = Math.max(5, Math.min(95, size));
        totalStored += normalizedSize;
        return normalizedSize;
      } else {
        untrackedCount++;
        return -1;
      }
    });

    const remaining = Math.max(0, 100 - totalStored);
    const fallbackSize = untrackedCount > 0 ? remaining / untrackedCount : 0;

    return result.map((size) =>
      size === -1 ? Math.max(5, fallbackSize) : size
    );
  }

  public toggleTopSplitter(visible: boolean) {
    this.topSplitter.style.display = visible ? "flex" : "none";
    this.recalculateVerticalSizes();
    this.debounceResize();
  }

  public toggleBottomSplitter(visible: boolean) {
    this.bottomSplitter.style.display = visible ? "flex" : "none";
    this.recalculateVerticalSizes();
    this.debounceResize();
  }

  private recalculateVerticalSizes() {
    if (this.controller.destroyed || this.controller.recalculating) return;

    this.controller.setRecalculating(true);

    try {
      if (this.verticalSplitInstance) {
        this.verticalSplitInstance = this.controller.destroySplit(
          this.verticalSplitInstance
        );
      }

      const panes = [this.topSplitter, this.bottomSplitter].filter(
        (p) => p.style.display !== "none"
      );
      if (panes.length === 0) return;

      const sizes =
        panes.length === 1
          ? [100]
          : this.controller.normalizeSizes(this.verticalSizes);

      this.verticalSplitInstance = this.controller.createVerticalSplit(
        panes,
        sizes,
        (newSizes) => {
          if (!this.controller.destroyed && newSizes && newSizes.length >= 2) {
            this.verticalSizes = [...newSizes];
            this.debounceResize();
          }
        }
      );
    } finally {
      this.controller.setRecalculating(false);
    }
  }

  public setSizes(topPercent: number, bottomPercent: number) {
    if (this.controller.destroyed) return;

    const total = topPercent + bottomPercent;
    if (total > 0) {
      this.verticalSizes = [
        (topPercent / total) * 100,
        (bottomPercent / total) * 100,
      ];
      this.controller.setSplitSizes(
        this.verticalSplitInstance,
        this.verticalSizes
      );
    }
  }

  public getVerticalSizes(): number[] {
    return [...this.verticalSizes];
  }

  public getTopSplitterDomElement() {
    return this.topSplitter;
  }

  public getBottomSplitterDomElement() {
    return this.bottomSplitter;
  }

  public destroy() {
    if (this.controller.destroyed) return;

    this.verticalSplitInstance = this.controller.destroySplit(
      this.verticalSplitInstance
    );
    this.topHorizontalSplitInstance = this.controller.destroySplit(
      this.topHorizontalSplitInstance
    );
    this.bottomHorizontalSplitInstance = this.controller.destroySplit(
      this.bottomHorizontalSplitInstance
    );

    this.topHorizontalPanes = [];
    this.bottomHorizontalPanes = [];
    this.topSizesMap.clear();
    this.bottomSizesMap.clear();

    if (this.topSplitter.parentElement) {
      this.topSplitter.parentElement.remove();
    }

    this.controller.destroy();
  }
}
