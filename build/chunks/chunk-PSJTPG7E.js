import {
  init_workbench_menu,
  menuItems
} from "./chunk-KVTHJVXD.js";
import {
  init_workbench_store_selector,
  select
} from "./chunk-EEHJVTSK.js";
import {
  dispatch,
  init_workbench_store
} from "./chunk-FPULJOSR.js";
import {
  init_workbench_store_slice,
  update_panel_state
} from "./chunk-EWJVXHY4.js";
import {
  bottomPanelIcon,
  chevronRightIcon,
  hamburgerIcon,
  init_workbench_icons,
  leftPanelIcon,
  rightPanelIcon,
  searchIcon,
  settingsIcon
} from "./chunk-UTYDY5QB.js";
import {
  CoreEl,
  init_workbench_part_el
} from "./chunk-X5EF5M4F.js";
import {
  __esm
} from "./chunk-KH45J4DC.js";

// src/code/workbench/browser/workbench.parts/workbench.part.titlebar.ts
var Titlebar;
var init_workbench_part_titlebar = __esm({
  "src/code/workbench/browser/workbench.parts/workbench.part.titlebar.ts"() {
    init_workbench_menu();
    init_workbench_store();
    init_workbench_store_selector();
    init_workbench_store_slice();
    init_workbench_icons();
    init_workbench_part_el();
    Titlebar = class extends CoreEl {
      dropdownVisible = false;
      dropdownElement = null;
      hamburgerContainer = null;
      activeSubmenus = /* @__PURE__ */ new Set();
      activeItems = /* @__PURE__ */ new Map();
      constructor() {
        super();
        this._createEl();
        this._addEventListeners();
      }
      _createEl() {
        this._el = document.createElement("div");
        this._el.className = "titlebar";
        const leftPanelSection = document.createElement("div");
        leftPanelSection.className = "left-panel-section";
        const leftPanel = document.createElement("span");
        leftPanel.innerHTML = leftPanelIcon;
        leftPanel.onclick = () => {
          const _state = select((s) => s.main.panel_state);
          dispatch(update_panel_state({ ..._state, left: !_state.left }));
        };
        const bottomPanel = document.createElement("span");
        bottomPanel.innerHTML = bottomPanelIcon;
        bottomPanel.onclick = () => {
          const _state = select((s) => s.main.panel_state);
          dispatch(update_panel_state({ ..._state, bottom: !_state.bottom }));
        };
        const rightPanel = document.createElement("span");
        rightPanel.innerHTML = rightPanelIcon;
        rightPanel.onclick = () => {
          const _state = select((s) => s.main.panel_state);
          dispatch(update_panel_state({ ..._state, right: !_state.right }));
        };
        this.hamburgerContainer = document.createElement("span");
        this.hamburgerContainer.className = "menu-button dropdown-container";
        this.hamburgerContainer.innerHTML = hamburgerIcon;
        this.hamburgerContainer.onclick = (e) => {
          e.stopPropagation();
          this._toggleDropdown();
        };
        this.dropdownElement = this._createDropdownMenu();
        this.hamburgerContainer.appendChild(this.dropdownElement);
        leftPanelSection.appendChild(leftPanel);
        leftPanelSection.appendChild(bottomPanel);
        leftPanelSection.appendChild(rightPanel);
        leftPanelSection.appendChild(this.hamburgerContainer);
        const centerSearchSection = document.createElement("div");
        centerSearchSection.className = "center-panel-section";
        const searchBar = document.createElement("div");
        searchBar.innerHTML = searchIcon;
        centerSearchSection.appendChild(searchBar);
        const rightControlsSection = document.createElement("div");
        rightControlsSection.className = "right-panel-section";
        const menuOptionsContainer = document.createElement("div");
        menuOptionsContainer.className = "menu-options-container";
        const windowButtonsContainer = document.createElement("div");
        windowButtonsContainer.className = "window-controls";
        const settings = document.createElement("span");
        settings.innerHTML = settingsIcon;
        const minimize = document.createElement("div");
        minimize.className = "circle";
        const maximize = document.createElement("div");
        maximize.className = "circle";
        const close = document.createElement("div");
        close.className = "circle";
        menuOptionsContainer.appendChild(settings);
        windowButtonsContainer.appendChild(minimize);
        windowButtonsContainer.appendChild(maximize);
        windowButtonsContainer.appendChild(close);
        rightControlsSection.appendChild(menuOptionsContainer);
        rightControlsSection.appendChild(windowButtonsContainer);
        this._el.appendChild(leftPanelSection);
        this._el.appendChild(centerSearchSection);
        this._el.appendChild(rightControlsSection);
      }
      _createDropdownMenu() {
        const dropdown = document.createElement("div");
        dropdown.className = "hamburger-dropdown";
        this._buildDropdownItems(dropdown, menuItems, 0);
        return dropdown;
      }
      _buildDropdownItems(container, items, level) {
        items.forEach((item) => {
          if (item.separator) {
            const separator = document.createElement("div");
            separator.className = "dropdown-separator";
            container.appendChild(separator);
          } else {
            const dropdownItem = document.createElement("div");
            dropdownItem.className = `dropdown-item ${item.disabled ? "disabled" : ""}`;
            const content = document.createElement("div");
            content.className = "dropdown-item-content";
            const label = document.createElement("span");
            label.className = "dropdown-item-label";
            label.textContent = item.label;
            content.appendChild(label);
            if (item.submenu && item.submenu.length > 0) {
              const arrow = document.createElement("span");
              arrow.className = "dropdown-submenu-arrow";
              arrow.innerHTML = chevronRightIcon;
              content.appendChild(arrow);
              const submenu = document.createElement("div");
              submenu.className = `hamburger-dropdown submenu level-${level + 1}`;
              this._buildDropdownItems(submenu, item.submenu, level + 1);
              dropdownItem.appendChild(submenu);
              dropdownItem.addEventListener("mouseenter", () => {
                this._showSubmenu(submenu);
              });
              dropdownItem.addEventListener("mouseleave", (e) => {
                const rect = submenu.getBoundingClientRect();
                const mouseX = e.clientX;
                const mouseY = e.clientY;
                if (mouseX < rect.left || mouseX > rect.right || mouseY < rect.top || mouseY > rect.bottom) {
                  if (!submenu.matches(":hover") && !dropdownItem.matches(":hover")) {
                    this._hideSubmenu(submenu);
                  }
                }
              });
              dropdownItem.addEventListener("click", (e) => {
                if (!item.action) {
                  this._setActiveItem(dropdownItem, container);
                }
              });
            }
            dropdownItem.appendChild(content);
            if (item.action && !item.disabled) {
              dropdownItem.onclick = (e) => {
                e.stopPropagation();
                this._setActiveItem(dropdownItem, container);
                this._handleMenuAction(item.action);
                this._closeDropdown();
              };
            }
            container.appendChild(dropdownItem);
          }
        });
      }
      _setActiveItem(selectedItem, container) {
        const currentActive = this.activeItems.get(container);
        if (currentActive && currentActive !== selectedItem) {
          currentActive.classList.remove("active");
        }
        selectedItem.classList.add("active");
        this.activeItems.set(container, selectedItem);
      }
      _clearAllActiveStates() {
        this.activeItems.forEach((activeItem) => {
          activeItem.classList.remove("active");
        });
        this.activeItems.clear();
      }
      _handleMenuAction(action) {
        if (action === "toggle_left_panel") {
          const _state = select((s) => s.main.panel_state);
          dispatch(update_panel_state({ ..._state, left: !_state.left }));
          return;
        }
        if (action === "toggle_right_panel") {
          const _state = select((s) => s.main.panel_state);
          dispatch(update_panel_state({ ..._state, right: !_state.right }));
          return;
        }
        if (action === "toggle_bottom_panel") {
          const _state = select((s) => s.main.panel_state);
          dispatch(update_panel_state({ ..._state, bottom: !_state.bottom }));
          return;
        }
        const menuEvent = new CustomEvent("meridia-menu-action", {
          detail: { action }
        });
        document.dispatchEvent(menuEvent);
        console.log(`Menu action triggered: ${action}`);
      }
      _showSubmenu(submenu) {
        submenu.classList.add("show");
        this.activeSubmenus.add(submenu);
      }
      _hideSubmenu(submenu) {
        submenu.classList.remove("show");
        this.activeSubmenus.delete(submenu);
        const nestedSubmenus = submenu.querySelectorAll(".submenu");
        nestedSubmenus.forEach((nested) => {
          nested.classList.remove("show");
          this.activeSubmenus.delete(nested);
        });
      }
      _toggleDropdown() {
        if (this.dropdownVisible) {
          this._closeDropdown();
        } else {
          this._openDropdown();
        }
      }
      _openDropdown() {
        if (this.dropdownElement) {
          this.dropdownElement.classList.add("show");
          this.dropdownVisible = true;
        }
      }
      _closeDropdown() {
        if (this.dropdownElement) {
          this.dropdownElement.classList.remove("show");
          this.dropdownVisible = false;
          this.activeSubmenus.forEach((submenu) => {
            submenu.classList.remove("show");
          });
          this.activeSubmenus.clear();
          this._clearAllActiveStates();
        }
      }
      _addEventListeners() {
        document.addEventListener("click", (e) => {
          if (this.dropdownVisible && this.hamburgerContainer && !this.hamburgerContainer.contains(e.target)) {
            this._closeDropdown();
          }
        });
        document.addEventListener("keydown", (e) => {
          if (e.key === "Escape" && this.dropdownVisible) {
            this._closeDropdown();
          }
        });
      }
    };
  }
});

export {
  Titlebar,
  init_workbench_part_titlebar
};
