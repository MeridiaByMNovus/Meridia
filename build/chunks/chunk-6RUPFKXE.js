import {
  CoreEl,
  init_workbench_part_el
} from "./chunk-X5EF5M4F.js";
import {
  __esm
} from "./chunk-KH45J4DC.js";

// src/code/workbench/browser/workbench.parts/workbench.part.splitter.ts
var Splitter;
var init_workbench_part_splitter = __esm({
  "src/code/workbench/browser/workbench.parts/workbench.part.splitter.ts"() {
    init_workbench_part_el();
    Splitter = class extends CoreEl {
      _panels;
      _direction;
      _onSizeChangeCallback;
      _panelsVisible;
      _sizes;
      _originalSizes;
      _gutters = [];
      _minSize = 5;
      _storageKey;
      constructor(panels, direction = "horizontal", sizes, onSizeChangeCallback, storageKey) {
        super();
        this._panels = panels;
        this._direction = direction;
        this._onSizeChangeCallback = onSizeChangeCallback;
        this._panelsVisible = panels.map(() => true);
        this._storageKey = storageKey || `splitter-${direction}-${panels.length}`;
        this._loadSizesFromStorage(sizes);
        this._originalSizes = [...this._sizes];
        this._createSplitter();
        this._applySizes();
      }
      _loadSizesFromStorage(defaultSizes) {
        const storedSizes = window.storage.get(this._storageKey);
        if (storedSizes && Array.isArray(storedSizes) && storedSizes.length === this._panels.length) {
          this._sizes = [...storedSizes];
        } else {
          this._sizes = defaultSizes ?? new Array(this._panels.length).fill(100 / this._panels.length);
        }
      }
      _saveSizesToStorage() {
        window.storage.store(this._storageKey, [...this._sizes]);
      }
      _createSplitter() {
        this._el = document.createElement("div");
        this._el.className = this._direction === "horizontal" ? "splitter-horizontal" : "splitter-vertical";
        this._el.style.display = "flex";
        this._el.style.flexDirection = this._direction === "horizontal" ? "row" : "column";
        this._el.style.width = "100%";
        this._el.innerHTML = "";
        for (let i = 0; i < this._panels.length; i++) {
          const panel = this._panels[i];
          if (!panel) return;
          panel.style.flexShrink = "0";
          panel.style.overflow = "auto";
          panel.style.minWidth = "0";
          panel.style.minHeight = "0";
          this._el.appendChild(panel);
          if (i < this._panels.length - 1) {
            const gutter = document.createElement("div");
            gutter.className = this._direction === "horizontal" ? "gutter gutter-horizontal" : "gutter gutter-vertical";
            gutter.style.cursor = this._direction === "horizontal" ? "col-resize" : "row-resize";
            gutter.style.flexShrink = "0";
            gutter.style.userSelect = "none";
            if (this._direction === "horizontal") {
              gutter.style.width = "10px";
              gutter.style.height = "100%";
            } else {
              gutter.style.height = "10px";
              gutter.style.width = "100%";
            }
            this._el.appendChild(gutter);
            this._gutters.push(gutter);
            this._addGutterDragListeners(gutter, i);
          }
        }
      }
      _addGutterDragListeners(gutter, gutterIndex) {
        let dragState = null;
        const onPointerDown = (e) => {
          e.preventDefault();
          gutter.setPointerCapture(e.pointerId);
          dragState = {
            startPos: this._direction === "horizontal" ? e.clientX : e.clientY,
            prevPanelIndex: gutterIndex,
            nextPanelIndex: gutterIndex + 1,
            prevPanelSize: this._sizes[gutterIndex],
            nextPanelSize: this._sizes[gutterIndex + 1],
            direction: this._direction
          };
          document.addEventListener("pointermove", onPointerMove);
          document.addEventListener("pointerup", onPointerUp, { once: true });
        };
        const onPointerMove = (e) => {
          if (!dragState) return;
          e.preventDefault();
          const currentPos = this._direction === "horizontal" ? e.clientX : e.clientY;
          const delta = currentPos - dragState.startPos;
          const splitterSize = this._direction === "horizontal" ? this._el.clientWidth : this._el.clientHeight;
          const percentDelta = delta / splitterSize * 100;
          let newPrevSize = dragState.prevPanelSize + percentDelta;
          let newNextSize = dragState.nextPanelSize - percentDelta;
          if (newPrevSize < this._minSize) {
            newPrevSize = this._minSize;
            newNextSize = dragState.prevPanelSize + dragState.nextPanelSize - newPrevSize;
          } else if (newNextSize < this._minSize) {
            newNextSize = this._minSize;
            newPrevSize = dragState.prevPanelSize + dragState.nextPanelSize - newNextSize;
          }
          this._sizes = [...this._sizes];
          this._sizes[dragState.prevPanelIndex] = newPrevSize;
          this._sizes[dragState.nextPanelIndex] = newNextSize;
          this._originalSizes[dragState.prevPanelIndex] = newPrevSize;
          this._originalSizes[dragState.nextPanelIndex] = newNextSize;
          this._applySizes();
          this._saveSizesToStorage();
          if (this._onSizeChangeCallback) this._onSizeChangeCallback();
        };
        const onPointerUp = (e) => {
          if (!dragState) return;
          gutter.releasePointerCapture(e.pointerId);
          document.removeEventListener("pointermove", onPointerMove);
          dragState = null;
        };
        gutter.addEventListener("pointerdown", onPointerDown);
      }
      _collapsePanel(index) {
        if (index < 0 || index >= this._panels.length) return;
        this._panelsVisible[index] = false;
        this._panels[index].style.display = "none";
        const visibleCount = this._panelsVisible.filter((v) => v).length;
        if (visibleCount === 0) return;
        const equalSize = 100 / visibleCount;
        this._sizes = this._panelsVisible.map((v) => v ? equalSize : 0);
        this._applySizes();
        this._saveSizesToStorage();
        if (this._onSizeChangeCallback) this._onSizeChangeCallback();
      }
      _applySizes() {
        let totalVisibleSize = 0;
        for (let i = 0; i < this._panels.length; i++) {
          if (this._panelsVisible[i]) {
            totalVisibleSize += this._sizes[i] ?? 0;
          }
        }
        const tolerance = 0.1;
        const shouldNormalize = Math.abs(totalVisibleSize - 100) > tolerance;
        this._panels.forEach((panel, i) => {
          if (this._panelsVisible[i]) {
            let size;
            if (shouldNormalize && totalVisibleSize > 0) {
              size = this._sizes[i] / totalVisibleSize * 100;
            } else {
              size = this._sizes[i];
            }
            if (this._direction === "horizontal") {
              panel.style.width = `${size}%`;
              panel.style.display = "";
            } else {
              panel.style.height = `${size}%`;
              panel.style.display = "";
            }
          } else {
            panel.style.display = "none";
          }
        });
        this._gutters.forEach((gutter, i) => {
          if (this._panelsVisible[i] && this._panelsVisible[i + 1]) {
            gutter.style.display = "";
          } else {
            gutter.style.display = "none";
          }
        });
      }
      _getMiddlePanelIndex() {
        if (this._panels.length === 3) {
          return 1;
        }
        return Math.floor(this._panels.length / 2);
      }
      _redistributeSizesForToggle(toggledIndex, isShowing) {
        const middleIndex = this._getMiddlePanelIndex();
        if (this._panels.length === 3 && middleIndex !== toggledIndex) {
          const currentSizes = [...this._sizes];
          if (isShowing) {
            let restoredSize = this._originalSizes[toggledIndex];
            if (!restoredSize || restoredSize === 0) {
              restoredSize = 100 / this._panels.length;
            }
            const middleCurrentSize = currentSizes[middleIndex];
            const newMiddleSize = Math.max(
              this._minSize,
              middleCurrentSize - restoredSize
            );
            this._sizes[toggledIndex] = restoredSize;
            this._sizes[middleIndex] = newMiddleSize;
            for (let i = 0; i < this._panels.length; i++) {
              if (i !== toggledIndex && i !== middleIndex) {
                this._sizes[i] = currentSizes[i];
              }
            }
          } else {
            const hiddenSize = currentSizes[toggledIndex];
            this._sizes[middleIndex] = currentSizes[middleIndex] + hiddenSize;
            this._sizes[toggledIndex] = 0;
            for (let i = 0; i < this._panels.length; i++) {
              if (i !== toggledIndex && i !== middleIndex) {
                this._sizes[i] = currentSizes[i];
              }
            }
          }
        } else {
          const visibleCount = this._panelsVisible.filter((v) => v).length;
          if (visibleCount === 0) return;
          if (isShowing) {
            let targetSize = this._originalSizes[toggledIndex];
            if (!targetSize || targetSize === 0) {
              targetSize = 100 / this._panels.length;
            }
            const remainingSpace = 100 - targetSize;
            const otherVisibleCount = visibleCount - 1;
            const sizeForOthers = otherVisibleCount > 0 ? remainingSpace / otherVisibleCount : 0;
            this._sizes = this._panelsVisible.map((visible, i) => {
              if (!visible) return 0;
              if (i === toggledIndex) return targetSize;
              return sizeForOthers;
            });
          } else {
            const equalSize = 100 / visibleCount;
            this._sizes = this._panelsVisible.map(
              (visible) => visible ? equalSize : 0
            );
          }
        }
      }
      togglePanel(index) {
        if (index < 0 || index >= this._panels.length) return;
        this._panels[index].style.transition = "none";
        const wasVisible = this._panelsVisible[index];
        this._panelsVisible[index] = !this._panelsVisible[index];
        this._redistributeSizesForToggle(index, !wasVisible);
        this._applySizes();
        this._saveSizesToStorage();
        void this._panels[index].offsetWidth;
        this._panels[index].style.transition = "";
        if (this._onSizeChangeCallback) this._onSizeChangeCallback();
      }
      setPanel(index, visibility) {
        if (index < 0 || index >= this._panels.length) return;
        const currentVisibility = this._panelsVisible[index];
        if (currentVisibility === visibility) {
          return;
        }
        this._panels[index].style.transition = "none";
        this._panelsVisible[index] = visibility;
        this._redistributeSizesForToggle(index, visibility);
        this._applySizes();
        this._saveSizesToStorage();
        void this._panels[index].offsetWidth;
        this._panels[index].style.transition = "";
        if (this._onSizeChangeCallback) this._onSizeChangeCallback();
      }
      getIndex(el) {
        let current = el;
        const index = this._panels.indexOf(current);
        if (index !== -1) return index;
        return index;
      }
      setSizes(newSizes) {
        if (!Array.isArray(newSizes) || newSizes.length !== this._panels.length) {
          return;
        }
        if (!newSizes.every((size) => typeof size === "number" && size >= 0)) {
          return;
        }
        const total = newSizes.reduce((sum, size) => sum + size, 0);
        let normalizedSizes;
        if (Math.abs(total - 100) > 0.1) {
          if (total === 0) {
            const visibleCount = this._panelsVisible.filter((v) => v).length;
            const equalSize = visibleCount > 0 ? 100 / visibleCount : 0;
            normalizedSizes = this._panelsVisible.map(
              (visible) => visible ? equalSize : 0
            );
          } else {
            normalizedSizes = newSizes.map((size) => size / total * 100);
          }
        } else {
          normalizedSizes = [...newSizes];
        }
        for (let i = 0; i < normalizedSizes.length; i++) {
          if (this._panelsVisible[i] && normalizedSizes[i] < this._minSize) {
            normalizedSizes[i] = this._minSize;
          } else if (!this._panelsVisible[i]) {
            normalizedSizes[i] = 0;
          }
        }
        const adjustedTotal = normalizedSizes.reduce((sum, size) => sum + size, 0);
        if (adjustedTotal > 100) {
          const scaleFactor = 100 / adjustedTotal;
          normalizedSizes = normalizedSizes.map((size) => size * scaleFactor);
        }
        this._sizes = [...normalizedSizes];
        this._originalSizes = [...normalizedSizes];
        this._applySizes();
        this._saveSizesToStorage();
        if (this._onSizeChangeCallback) {
          this._onSizeChangeCallback();
        }
      }
    };
  }
});

export {
  Splitter,
  init_workbench_part_splitter
};
