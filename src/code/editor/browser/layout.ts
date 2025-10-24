import { Editor as _editor } from "../standalone/standalone.js";
import { getStandalone } from "../../workbench/common/standalone.js";
import { dispatch } from "../../workbench/common/store/store.js";
import { select, watch } from "../../workbench/common/store/selector.js";
import { update_editor_tabs } from "../../workbench/common/store/slice.js";
import { getFileIcon, getIcon } from "../../workbench/common/utils.js";
import { IEditorTab } from "../../workbench/types.js";
import { closeIcon } from "../../workbench/browser/media/icons.js";
import { CoreEl } from "../../workbench/browser/parts/el.js";

export class Editor extends CoreEl {
  private _editorTabs!: HTMLDivElement;
  private _editorAra!: HTMLDivElement;
  private _emptyState!: HTMLDivElement;

  constructor() {
    super();
    this._createEl();
  }

  private _createEl() {
    this._el = document.createElement("div");
    this._el.className = "editor";

    this._editorTabs = document.createElement("div");
    this._editorTabs.className = "tabs scrollbar-container y-disable";

    this._editorAra = document.createElement("div");
    this._editorAra.className = "editor-area";

    this._emptyState = document.createElement("div");
    this._emptyState.className = "empty-state";

    const backgroundImage = document.createElement("span");
    backgroundImage.innerHTML = getIcon("../images/background.svg");
    this._emptyState.appendChild(backgroundImage);

    const _close = (tabUri: string, event?: Event) => {
      if (event) {
        event.stopPropagation();
      }

      const currentTabs = select((s) => s.main.editor_tabs);
      const tabIndex = currentTabs.findIndex((t) => t.uri === tabUri);

      if (tabIndex === -1) return;

      const closingTab = currentTabs[tabIndex]!;
      const isClosingActiveTab = closingTab.active;

      const updatedTabs = currentTabs.filter((t) => t.uri !== tabUri);

      if (isClosingActiveTab && updatedTabs.length > 0) {
        const newActiveIndex =
          tabIndex < updatedTabs.length ? tabIndex : updatedTabs.length - 1;

        const tabToActivate = updatedTabs[newActiveIndex]!;
        updatedTabs[newActiveIndex] = {
          name: tabToActivate.name,
          uri: tabToActivate.uri,
          active: true,
          is_touched: tabToActivate.is_touched,
          ...(tabToActivate.icon && { icon: tabToActivate.icon }),
        } as IEditorTab;
      }

      dispatch(update_editor_tabs(updatedTabs));

      const editor = getStandalone("editor") as _editor;
      if (editor) editor._close(tabUri);
    };

    const _render = (_tabs: IEditorTab[]) => {
      const editor = getStandalone("editor") as _editor;
      const activeTab = _tabs.find((t) => t.active);

      if (_tabs.length === 0) {
        this._editorTabs.style.display = "none";
        this._editorAra.style.display = "none";
        this._emptyState.style.display = "flex";
        if (editor) editor._visiblity(false);
        return;
      } else {
        this._editorTabs.style.display = "flex";
        this._editorAra.style.display = "block";
        this._emptyState.style.display = "none";
        if (editor) editor._visiblity(true);
      }

      if (activeTab) {
        if (activeTab.uri.startsWith("tab://")) {
          if (editor) editor._visiblity(false);
        } else {
          if (editor) {
            if (editor._editor) {
              editor._open(activeTab);
            } else {
              editor._mount();
            }
          }
        }
      }

      this._editorTabs.innerHTML = "";
      _tabs.forEach((_tab) => {
        const _tabEl = document.createElement("div");
        _tabEl.className = `tab ${_tab.active ? "active" : ""}`;

        _tabEl.onclick = (e) => {
          if ((e.target as HTMLElement).closest(".close-icon")) {
            return;
          }

          const _tabs = select((s) => s.main.editor_tabs);
          const newTabs = _tabs.map((t) => ({
            ...t,
            active: t.uri === _tab.uri,
          }));

          dispatch(update_editor_tabs(newTabs));
        };

        const icon = document.createElement("span");
        icon.className = "icon";

        if (_tab.icon) icon.innerHTML = _tab.icon;
        else icon.innerHTML = getFileIcon(_tab.name);

        const name = document.createElement("span");
        name.className = "name";
        name.textContent = _tab.name;

        const iconWrapper = document.createElement("div");
        iconWrapper.className = `icon-wrapper ${
          _tab.is_touched ? "is_touched" : ""
        }`;

        const _closeIcon = document.createElement("span");
        _closeIcon.className = "close-icon";
        _closeIcon.innerHTML = closeIcon;

        _closeIcon.onclick = (e) => {
          _close(_tab.uri, e);
        };

        const dotIcon = document.createElement("span");
        dotIcon.className = "dot-icon";

        iconWrapper.appendChild(_closeIcon);
        iconWrapper.appendChild(dotIcon);

        _tabEl.appendChild(icon);
        _tabEl.appendChild(name);
        _tabEl.appendChild(iconWrapper);

        this._editorTabs.appendChild(_tabEl);

        if (_tab.active) {
          const container = this._editorTabs;
          const offsetLeft = _tabEl.offsetLeft;
          const tabWidth = _tabEl.offsetWidth;
          const containerScrollLeft = container.scrollLeft;
          const containerWidth = container.clientWidth;

          if (offsetLeft < containerScrollLeft) {
            container.scrollLeft = offsetLeft;
          } else if (
            offsetLeft + tabWidth >
            containerScrollLeft + containerWidth
          ) {
            container.scrollLeft = offsetLeft + tabWidth - containerWidth;
          }
        }
      });
    };

    const _tabs = select((s) => s.main.editor_tabs);

    if (_tabs.length > 0) {
      _render(_tabs);
    } else {
      this._editorTabs.style.display = "none";
      this._editorAra.style.display = "none";
      this._emptyState.style.display = "flex";
    }

    watch(
      (s) => s.main.editor_tabs,
      (next) => {
        _render(next);
      }
    );

    this._el.appendChild(this._editorTabs);
    this._el.appendChild(this._editorAra);
    this._el.appendChild(this._emptyState);
  }

  rerender() {
    const _tabs = select((s) => s.main.editor_tabs);

    const editor = getStandalone("editor") as _editor;
    const activeTab = _tabs.find((t) => t.active);

    if (_tabs.length === 0) {
      this._editorTabs.style.display = "none";
      this._editorAra.style.display = "none";
      this._emptyState.style.display = "flex";
      if (editor) editor._visiblity(false);
      return;
    } else {
      this._editorTabs.style.display = "flex";
      this._editorAra.style.display = "block";
      this._emptyState.style.display = "none";
      if (editor) editor._visiblity(true);
    }

    if (activeTab) {
      if (activeTab.uri.startsWith("tab://")) {
        if (editor) editor._visiblity(false);
      } else {
        if (editor) {
          if (editor._editor) {
            editor._open(activeTab);
          } else {
            editor._mount();
          }
        }
      }
    }

    this._editorTabs.innerHTML = "";
    _tabs.forEach((_tab) => {
      const _tabEl = document.createElement("div");
      _tabEl.className = `tab ${_tab.active ? "active" : ""}`;

      _tabEl.onclick = (e) => {
        if ((e.target as HTMLElement).closest(".close-icon")) {
          return;
        }

        const _tabs = select((s) => s.main.editor_tabs);
        const newTabs = _tabs.map((t) => ({
          ...t,
          active: t.uri === _tab.uri,
        }));

        dispatch(update_editor_tabs(newTabs));
      };

      const icon = document.createElement("span");
      icon.className = "icon";

      if (_tab.icon) icon.innerHTML = _tab.icon;
      else icon.innerHTML = getFileIcon(_tab.name);

      const name = document.createElement("span");
      name.className = "name";
      name.textContent = _tab.name;

      const iconWrapper = document.createElement("div");
      iconWrapper.className = `icon-wrapper ${
        _tab.is_touched ? "is_touched" : ""
      }`;

      const _closeIcon = document.createElement("span");
      _closeIcon.className = "close-icon";
      _closeIcon.innerHTML = closeIcon;

      _closeIcon.onclick = (e) => {
        _close(_tab.uri, e);
      };

      const dotIcon = document.createElement("span");
      dotIcon.className = "dot-icon";

      iconWrapper.appendChild(_closeIcon);
      iconWrapper.appendChild(dotIcon);

      _tabEl.appendChild(icon);
      _tabEl.appendChild(name);
      _tabEl.appendChild(iconWrapper);

      this._editorTabs.appendChild(_tabEl);

      if (_tab.active) {
        const container = this._editorTabs;
        const offsetLeft = _tabEl.offsetLeft;
        const tabWidth = _tabEl.offsetWidth;
        const containerScrollLeft = container.scrollLeft;
        const containerWidth = container.clientWidth;

        if (offsetLeft < containerScrollLeft) {
          container.scrollLeft = offsetLeft;
        } else if (
          offsetLeft + tabWidth >
          containerScrollLeft + containerWidth
        ) {
          container.scrollLeft = offsetLeft + tabWidth - containerWidth;
        }
      }

      const _close = (tabUri: string, event?: Event) => {
        if (event) {
          event.stopPropagation();
        }

        const currentTabs = select((s) => s.main.editor_tabs);
        const tabIndex = currentTabs.findIndex((t) => t.uri === tabUri);

        if (tabIndex === -1) return;

        const closingTab = currentTabs[tabIndex]!;
        const isClosingActiveTab = closingTab.active;

        const updatedTabs = currentTabs.filter((t) => t.uri !== tabUri);

        if (isClosingActiveTab && updatedTabs.length > 0) {
          const newActiveIndex =
            tabIndex < updatedTabs.length ? tabIndex : updatedTabs.length - 1;

          const tabToActivate = updatedTabs[newActiveIndex]!;
          updatedTabs[newActiveIndex] = {
            name: tabToActivate.name,
            uri: tabToActivate.uri,
            active: true,
            is_touched: tabToActivate.is_touched,
            ...(tabToActivate.icon && { icon: tabToActivate.icon }),
          } as IEditorTab;
        }

        dispatch(update_editor_tabs(updatedTabs));

        const editor = getStandalone("editor") as _editor;
        if (editor) editor._close(tabUri);
      };
    });
  }
}
