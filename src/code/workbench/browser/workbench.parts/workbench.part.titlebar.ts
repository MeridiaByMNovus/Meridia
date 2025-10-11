import { menuItems } from "../../common/workbench.menu.js";
import { dispatch } from "../../common/workbench.store/workbench.store.js";
import { select } from "../../common/workbench.store/workbench.store.selector.js";
import { update_panel_state } from "../../common/workbench.store/workbench.store.slice.js";
import { Menuitems } from "../../workbench.types.js";
import {
  bottomPanelIcon,
  chevronRightIcon,
  hamburgerIcon,
  leftPanelIcon,
  rightPanelIcon,
  searchIcon,
  settingsIcon,
} from "../workbench.media/workbench.icons.js";
import { CoreEl } from "./workbench.part.el.js";

export class Titlebar extends CoreEl {
  private menuVisible: boolean = false;
  private menuElement: HTMLDivElement | null = null;
  private hamburgerContainer: HTMLSpanElement | null = null;
  private activeSubmenus: Set<HTMLElement> = new Set();
  private activeItems: Map<HTMLElement, HTMLElement> = new Map();

  constructor() {
    super();
    this._createEl();
    this._addEventListeners();
  }

  private _createEl(): void {
    this._el = document.createElement("div");
    this._el.className = "titlebar";

    const leftPanelSection = document.createElement("div");
    leftPanelSection.className = "left-panel-section";

    const logo = document.createElement("div");
    logo.className = "logo";
    logo.innerHTML = `<img src="../../browser/workbench.media/images/logo.png" alt="Meridia" />`;

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
    this.hamburgerContainer.className = "menu-button menu-container";
    this.hamburgerContainer.innerHTML = hamburgerIcon;
    this.hamburgerContainer.onclick = (e) => {
      e.stopPropagation();
      this._toggleMenu();
    };

    this.menuElement = this._createMenuMenu();
    this.hamburgerContainer.appendChild(this.menuElement);

    leftPanelSection.appendChild(logo);
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
    minimize.className = "control";

    const maximize = document.createElement("div");
    maximize.className = "control";

    const close = document.createElement("div");
    close.className = "control";

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

  private _createMenuMenu(): HTMLDivElement {
    const menu = document.createElement("div");
    menu.className = "hamburger-menu";

    this._buildMenuitemss(menu, menuItems, 0);
    return menu;
  }

  private _buildMenuitemss(
    container: HTMLElement,
    items: Menuitems[],
    level: number
  ): void {
    items.forEach((item) => {
      if (item.separator) {
        const separator = document.createElement("div");
        separator.className = "menu-separator";
        container.appendChild(separator);
      } else {
        const menuItem = document.createElement("div");
        menuItem.className = `menu-item ${item.disabled ? "disabled" : ""}`;

        const content = document.createElement("div");
        content.className = "menu-item-content";

        const label = document.createElement("span");
        label.className = "menu-item-label";
        label.textContent = item.label;
        content.appendChild(label);

        if (item.submenu && item.submenu.length > 0) {
          const arrow = document.createElement("span");
          arrow.className = "menu-submenu-arrow";
          arrow.innerHTML = chevronRightIcon;
          content.appendChild(arrow);

          const submenu = document.createElement("div");
          submenu.className = `hamburger-menu submenu level-${level + 1}`;
          this._buildMenuitemss(submenu, item.submenu, level + 1);
          menuItem.appendChild(submenu);

          menuItem.addEventListener("mouseenter", () => {
            const currentActive = this.activeItems.get(container);
            if (currentActive && currentActive !== menuItem) {
              currentActive.classList.remove("active");

              const prevSubmenu = currentActive.querySelector(".submenu");
              if (prevSubmenu) {
                this._hideSubmenu(prevSubmenu as HTMLElement);
              }
            }

            this._setActiveItem(menuItem, container);
            this._showSubmenu(submenu);
          });

          menuItem.addEventListener("mouseleave", (e) => {
            if (menuItem.classList.contains("active")) {
              return;
            }

            const rect = submenu.getBoundingClientRect();
            const mouseX = e.clientX;
            const mouseY = e.clientY;

            if (
              mouseX < rect.left ||
              mouseX > rect.right ||
              mouseY < rect.top ||
              mouseY > rect.bottom
            ) {
              if (!submenu.matches(":hover") && !menuItem.matches(":hover")) {
                this._hideSubmenu(submenu);
              }
            }
          });

          menuItem.addEventListener("click", (e) => {
            e.stopPropagation();
            this._setActiveItem(menuItem, container);

            this._showSubmenu(submenu);
          });
        } else {
          menuItem.addEventListener("mouseenter", () => {
            const currentActive = this.activeItems.get(container);
            if (currentActive && currentActive !== menuItem) {
              currentActive.classList.remove("active");

              const prevSubmenu = currentActive.querySelector(".submenu");
              if (prevSubmenu) {
                this._hideSubmenu(prevSubmenu as HTMLElement);
              }

              this.activeItems.delete(container);
            }
          });

          if (item.action && !item.disabled) {
            menuItem.onclick = (e) => {
              e.stopPropagation();
              this._setActiveItem(menuItem, container);
              this._handleMenuAction(item.action!);
              this._closeMenu();
            };
          }
        }

        menuItem.appendChild(content);
        container.appendChild(menuItem);
      }
    });
  }

  private _setActiveItem(
    selectedItem: HTMLElement,
    container: HTMLElement
  ): void {
    const currentActive = this.activeItems.get(container);
    if (currentActive && currentActive !== selectedItem) {
      currentActive.classList.remove("active");

      const prevSubmenu = currentActive.querySelector(".submenu");
      if (prevSubmenu) {
        this._hideSubmenu(prevSubmenu as HTMLElement);
      }
    }

    selectedItem.classList.add("active");
    this.activeItems.set(container, selectedItem);

    const newSubmenu = selectedItem.querySelector(".submenu");
    if (newSubmenu) {
      this._showSubmenu(newSubmenu as HTMLElement);
    }
  }

  private _clearAllActiveStates(): void {
    this.activeItems.forEach((activeItem) => {
      activeItem.classList.remove("active");
    });
    this.activeItems.clear();
  }

  private _handleMenuAction(action: string): void {
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
      detail: { action },
    });
    document.dispatchEvent(menuEvent);
  }

  private _showSubmenu(submenu: HTMLElement): void {
    submenu.classList.add("show");
    this.activeSubmenus.add(submenu);
  }

  private _hideSubmenu(submenu: HTMLElement): void {
    submenu.classList.remove("show");
    this.activeSubmenus.delete(submenu);

    const nestedSubmenus = submenu.querySelectorAll(".submenu");
    nestedSubmenus.forEach((nested) => {
      nested.classList.remove("show");
      this.activeSubmenus.delete(nested as HTMLElement);
    });
  }

  private _toggleMenu(): void {
    if (this.menuVisible) {
      this._closeMenu();
    } else {
      this._openMenu();
    }
  }

  private _openMenu(): void {
    if (this.menuElement) {
      this.menuElement.classList.add("show");
      this.menuVisible = true;
    }
  }

  private _closeMenu(): void {
    if (this.menuElement) {
      this.menuElement.classList.remove("show");
      this.menuVisible = false;

      this.activeSubmenus.forEach((submenu) => {
        submenu.classList.remove("show");
      });
      this.activeSubmenus.clear();

      this._clearAllActiveStates();
    }
  }

  private _addEventListeners(): void {
    document.addEventListener("click", (e) => {
      if (
        this.menuVisible &&
        this.hamburgerContainer &&
        !this.hamburgerContainer.contains(e.target as Node)
      ) {
        this._closeMenu();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.menuVisible) {
        this._closeMenu();
      }
    });
  }
}
