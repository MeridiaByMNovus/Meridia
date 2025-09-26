import {
  getRelativePath,
  init_workbench_utils
} from "./chunk-XIEV3R25.js";
import {
  init_workbench_store_selector,
  select,
  watch
} from "./chunk-EEHJVTSK.js";
import {
  init_workbench_store,
  store
} from "./chunk-FPULJOSR.js";
import {
  CoreEl,
  init_workbench_part_el
} from "./chunk-X5EF5M4F.js";
import {
  getStandalone,
  init_workbench_standalone
} from "./chunk-5XOEW5AM.js";
import {
  __esm
} from "./chunk-KH45J4DC.js";

// src/code/workbench/browser/workbench.parts/workbench.part.status.ts
var Statusbar;
var init_workbench_part_status = __esm({
  "src/code/workbench/browser/workbench.parts/workbench.part.status.ts"() {
    init_workbench_standalone();
    init_workbench_store();
    init_workbench_store_selector();
    init_workbench_utils();
    init_workbench_part_el();
    Statusbar = class extends CoreEl {
      _currentSymbol = null;
      constructor() {
        super();
        this._createEl();
      }
      _createEl() {
        this._el = document.createElement("div");
        this._el.className = "statusbar";
        const _breadcrumbContainer = document.createElement("div");
        _breadcrumbContainer.className = "breadcrumb-container";
        const _editor = getStandalone("editor");
        document.addEventListener("statusbar.update.referenace.path", (_event) => {
          const _customEvent = _event;
          const _symbols = _customEvent.detail.message;
          if (_symbols === null || !_symbols || !_symbols.name) {
            this._currentSymbol = null;
            this._updateBreadcrumbWithSymbol(_breadcrumbContainer);
          } else {
            this._currentSymbol = _symbols.name;
            this._updateBreadcrumbWithSymbol(_breadcrumbContainer);
          }
        });
        watch(
          (s) => s.main.editor_tabs,
          (next) => {
            let _root = select((s) => s.main.folder_structure);
            const _active = next.find((t) => t.active);
            const unsubscribe = store.subscribe(() => {
              _root = select((s) => s.main.folder_structure);
              unsubscribe();
            });
            if (!_root || !_root.name) {
              this._renderBreadcrumb(_breadcrumbContainer, ["Root"]);
              return;
            }
            if (!_active || !_active.uri) {
              this._renderBreadcrumb(_breadcrumbContainer, [_root.name]);
              return;
            }
            const relativePath = getRelativePath(_root.uri ?? "", _active.uri);
            const breadcrumbItems = this._createBreadcrumbItems(
              _root.name,
              relativePath
            );
            this._renderBreadcrumb(_breadcrumbContainer, breadcrumbItems);
          }
        );
        const itemSection = document.createElement("div");
        itemSection.className = "item-section";
        this._el.appendChild(_breadcrumbContainer);
        this._el.appendChild(itemSection);
      }
      _createBreadcrumbItems(rootName, relativePath) {
        if (!relativePath || relativePath === "./") {
          return [rootName];
        }
        const pathSegments = relativePath.split(/[/\\]/).filter((segment) => segment.length > 0);
        return [rootName, ...pathSegments];
      }
      _updateBreadcrumbWithSymbol(container) {
        let _root = select((s) => s.main.folder_structure);
        const _activeTabs = select((s) => s.main.editor_tabs);
        const _active = _activeTabs.find((t) => t.active);
        let baseBreadcrumbItems;
        if (!_root || !_root.name) {
          baseBreadcrumbItems = ["Root"];
        } else if (!_active || !_active.uri) {
          baseBreadcrumbItems = [_root.name];
        } else {
          const relativePath = getRelativePath(_root.uri ?? "", _active.uri);
          baseBreadcrumbItems = this._createBreadcrumbItems(
            _root.name,
            relativePath
          );
        }
        const finalItems = this._currentSymbol ? [...baseBreadcrumbItems, this._currentSymbol] : baseBreadcrumbItems;
        this._renderBreadcrumb(container, finalItems);
      }
      _renderBreadcrumb(container, items) {
        container.innerHTML = "";
        items.forEach((item, index) => {
          const breadcrumbItem = document.createElement("span");
          breadcrumbItem.className = "breadcrumb-item";
          if (index === items.length - 1 && this._currentSymbol === item) {
            breadcrumbItem.classList.add("breadcrumb-symbol");
          }
          breadcrumbItem.textContent = item;
          breadcrumbItem.addEventListener("click", () => {
            this._handleBreadcrumbClick(index, items);
          });
          container.appendChild(breadcrumbItem);
          if (index < items.length - 1) {
            const separator = document.createElement("span");
            separator.className = "breadcrumb-separator";
            separator.textContent = " / ";
            container.appendChild(separator);
          }
        });
      }
      _handleBreadcrumbClick(index, items) {
      }
    };
  }
});

export {
  Statusbar,
  init_workbench_part_status
};
