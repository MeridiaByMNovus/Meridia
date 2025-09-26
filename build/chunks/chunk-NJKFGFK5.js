import {
  getIcon,
  init_workbench_utils
} from "./chunk-XIEV3R25.js";
import {
  init_workbench_store_selector,
  select,
  watch
} from "./chunk-EEHJVTSK.js";
import {
  dispatch,
  init_workbench_store
} from "./chunk-FPULJOSR.js";
import {
  init_workbench_store_slice,
  update_editor_tabs
} from "./chunk-EWJVXHY4.js";
import {
  closeIcon,
  init_workbench_icons
} from "./chunk-UTYDY5QB.js";
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

// src/code/workbench/browser/workbench.layout.editor.ts
var Editor;
var init_workbench_layout_editor = __esm({
  "src/code/workbench/browser/workbench.layout.editor.ts"() {
    init_workbench_standalone();
    init_workbench_store();
    init_workbench_store_selector();
    init_workbench_store_slice();
    init_workbench_utils();
    init_workbench_icons();
    init_workbench_part_el();
    Editor = class extends CoreEl {
      constructor() {
        super();
        this._createEl();
      }
      _createEl() {
        this._el = document.createElement("div");
        this._el.className = "editor";
        const _tabs = select((s) => s.main.editor_tabs);
        const IEditorTabs = document.createElement("div");
        IEditorTabs.className = "tabs scrollbar-container y-disable";
        const editorArea = document.createElement("div");
        editorArea.className = "editor-area";
        const closeTab = (tabUri, event) => {
          if (event) {
            event.stopPropagation();
          }
          const currentTabs = select((s) => s.main.editor_tabs);
          const tabIndex = currentTabs.findIndex((t) => t.uri === tabUri);
          if (tabIndex === -1) return;
          const closingTab = currentTabs[tabIndex];
          const isClosingActiveTab = closingTab.active;
          const updatedTabs = currentTabs.filter((t) => t.uri !== tabUri);
          if (isClosingActiveTab && updatedTabs.length > 0) {
            const newActiveIndex = tabIndex < updatedTabs.length ? tabIndex : updatedTabs.length - 1;
            const tabToActivate = updatedTabs[newActiveIndex];
            updatedTabs[newActiveIndex] = {
              name: tabToActivate.name,
              uri: tabToActivate.uri,
              active: true,
              is_touched: tabToActivate.is_touched,
              ...tabToActivate.icon && { icon: tabToActivate.icon }
            };
          }
          dispatch(update_editor_tabs(updatedTabs));
          const editor = getStandalone("editor");
          if (editor && editor.close) {
            editor.close(tabUri);
          }
        };
        function renderIEditorTabs(_tabs2) {
          const editor = getStandalone("editor");
          const activeTab = _tabs2.find((t) => t.active);
          if (activeTab && editor) {
            if (editor._editor) {
              editor._open(activeTab);
            } else {
              editor._mount();
              setTimeout(() => {
                editor._open(activeTab);
              }, 0);
            }
          }
          IEditorTabs.innerHTML = "";
          _tabs2.forEach((_tab) => {
            const _tabEl = document.createElement("div");
            _tabEl.className = `tab ${_tab.active ? "active" : ""}`;
            _tabEl.onclick = (e) => {
              if (e.target.closest(".close-icon")) {
                return;
              }
              const _tabs3 = select((s) => s.main.editor_tabs);
              const newTabs = _tabs3.map((t) => ({
                ...t,
                active: t.uri === _tab.uri
              }));
              dispatch(update_editor_tabs(newTabs));
            };
            const icon = document.createElement("span");
            icon.className = "icon";
            if (_tab.icon) icon.innerHTML = _tab.icon;
            else icon.innerHTML = getIcon(_tab.name);
            const name = document.createElement("span");
            name.className = "name";
            name.textContent = _tab.name;
            const iconWrapper = document.createElement("div");
            iconWrapper.className = `icon-wrapper ${_tab.is_touched ? "is_touched" : ""}`;
            const _closeIcon = document.createElement("span");
            _closeIcon.className = "close-icon";
            _closeIcon.innerHTML = closeIcon;
            _closeIcon.onclick = (e) => {
              closeTab(_tab.uri, e);
            };
            const dotIcon = document.createElement("span");
            dotIcon.className = "dot-icon";
            iconWrapper.appendChild(_closeIcon);
            iconWrapper.appendChild(dotIcon);
            _tabEl.appendChild(icon);
            _tabEl.appendChild(name);
            _tabEl.appendChild(iconWrapper);
            IEditorTabs.appendChild(_tabEl);
          });
        }
        if (_tabs.length > 0) {
          renderIEditorTabs(_tabs);
        }
        watch(
          (s) => s.main.editor_tabs,
          (next) => {
            renderIEditorTabs(next);
          }
        );
        this._el.appendChild(IEditorTabs);
        this._el.appendChild(editorArea);
      }
    };
  }
});

export {
  Editor,
  init_workbench_layout_editor
};
