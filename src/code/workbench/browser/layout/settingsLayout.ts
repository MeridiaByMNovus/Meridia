import PerfectScrollbar from "perfect-scrollbar";
import {
  SettingsController,
  Setting,
  SettingsCategory,
} from "./common/SettingsController.js";

export class SettingsLayout {
  private settingsEl: HTMLDivElement | null = null;
  private controller: SettingsController;
  private currentCategory: string = "editor";
  private searchInput: HTMLInputElement | null = null;
  private settingsContent: HTMLDivElement | null = null;
  private categoryNav: HTMLDivElement | null = null;

  constructor() {
    this.controller = SettingsController.getInstance();
    this.render();
    this.setupEventListeners();
  }

  private render() {
    this.settingsEl = document.createElement("div");
    this.settingsEl.className = "settings-wrapper";

    const header = this.createHeader();
    const body = this.createBody();

    this.settingsEl.appendChild(header);
    this.settingsEl.appendChild(body);

    this.loadScrollbar();
  }

  private createHeader(): HTMLDivElement {
    const header = document.createElement("div");
    header.className = "settings-header";

    const title = document.createElement("h1");
    title.className = "settings-title";
    title.textContent = "Settings";

    const searchContainer = document.createElement("div");
    searchContainer.className = "settings-search-container";

    this.searchInput = document.createElement("input");
    this.searchInput.type = "text";
    this.searchInput.className = "settings-search";
    this.searchInput.placeholder = "Search settings";

    const searchIcon = document.createElement("div");
    searchIcon.className = "settings-search-icon";
    searchIcon.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    `;

    searchContainer.appendChild(searchIcon);
    searchContainer.appendChild(this.searchInput);

    header.appendChild(title);
    header.appendChild(searchContainer);

    return header;
  }

  private createBody(): HTMLDivElement {
    const body = document.createElement("div");
    body.className = "settings-body";

    this.categoryNav = this.createCategoryNav();
    this.settingsContent = this.createSettingsContent();

    body.appendChild(this.categoryNav);
    body.appendChild(this.settingsContent);

    return body;
  }

  private createCategoryNav(): HTMLDivElement {
    const nav = document.createElement("div");
    nav.className = "settings-nav";

    const categories = this.controller.getCategories();
    categories.forEach((category, index) => {
      const categoryEl = this.createCategoryItem(category, index === 0);
      nav.appendChild(categoryEl);
    });

    return nav;
  }

  private createCategoryItem(
    category: SettingsCategory,
    isActive = false
  ): HTMLDivElement {
    const item = document.createElement("div");
    item.className = `settings-nav-item ${isActive ? "active" : ""}`;
    item.dataset.categoryId = category.id;

    const icon = document.createElement("div");
    icon.className = "settings-nav-icon";
    icon.innerHTML = category.icon;

    const content = document.createElement("div");
    content.className = "settings-nav-content";

    const title = document.createElement("div");
    title.className = "settings-nav-title";
    title.textContent = category.title;

    const description = document.createElement("div");
    description.className = "settings-nav-description";
    description.textContent = category.description || "";

    content.appendChild(title);
    content.appendChild(description);

    item.appendChild(icon);
    item.appendChild(content);

    item.addEventListener("click", () => {
      this.selectCategory(category.id);
    });

    return item;
  }

  private createSettingsContent(): HTMLDivElement {
    const content = document.createElement("div");
    content.className = "settings-content";

    this.renderCategorySettings(this.currentCategory);

    return content;
  }

  private renderCategorySettings(categoryId: string) {
    if (!this.settingsContent) return;

    this.settingsContent.innerHTML = "";

    const category = this.controller
      .getCategories()
      .find((c) => c.id === categoryId);
    if (!category) return;

    const categoryHeader = document.createElement("div");
    categoryHeader.className = "settings-category-header";

    const categoryTitle = document.createElement("h2");
    categoryTitle.className = "settings-category-title";
    categoryTitle.textContent = category.title;

    const categoryDesc = document.createElement("p");
    categoryDesc.className = "settings-category-description";
    categoryDesc.textContent = category.description || "";

    categoryHeader.appendChild(categoryTitle);
    categoryHeader.appendChild(categoryDesc);

    this.settingsContent.appendChild(categoryHeader);

    const settings = this.controller.getSettingsByCategory(categoryId);
    settings.forEach((setting) => {
      const settingEl = this.createSettingElement(setting);
      this.settingsContent!.appendChild(settingEl);
    });
  }

  private createSettingElement(setting: Setting): HTMLDivElement {
    const container = document.createElement("div");
    container.className = "settings-item";

    const header = document.createElement("div");
    header.className = "settings-item-header";

    const title = document.createElement("div");
    title.className = "settings-item-title";
    title.textContent = setting.title;

    const description = document.createElement("div");
    description.className = "settings-item-description";
    description.textContent = setting.description || "";

    header.appendChild(title);
    header.appendChild(description);

    const control = this.createSettingControl(setting);

    container.appendChild(header);
    container.appendChild(control);

    return container;
  }

  private createSettingControl(setting: Setting): HTMLElement {
    const currentValue = this.controller.get(setting.id);

    switch (setting.type) {
      case "toggle":
        return this.createToggleControl(setting, currentValue);
      case "select":
        return this.createSelectControl(setting, currentValue);
      case "input":
        return this.createInputControl(setting, currentValue);
      case "number":
        return this.createNumberControl(setting, currentValue);
      case "color":
        return this.createColorControl(setting, currentValue);
      case "range":
        return this.createRangeControl(setting, currentValue);
      default:
        return document.createElement("div");
    }
  }

  private createToggleControl(
    setting: Setting,
    currentValue: boolean
  ): HTMLDivElement {
    const container = document.createElement("div");
    container.className = "settings-control settings-toggle";

    const toggle = document.createElement("div");
    toggle.className = `settings-toggle-switch ${currentValue ? "active" : ""}`;

    const slider = document.createElement("div");
    slider.className = "settings-toggle-slider";

    toggle.appendChild(slider);

    toggle.addEventListener("click", () => {
      const newValue = !this.controller.get(setting.id);
      this.controller.set(setting.id, newValue);
      toggle.classList.toggle("active", newValue);
    });

    container.appendChild(toggle);
    return container;
  }

  private createSelectControl(
    setting: Setting,
    currentValue: any
  ): HTMLDivElement {
    const container = document.createElement("div");
    container.className = "settings-control settings-select";

    const select = document.createElement("select");
    select.className = "settings-select-input";

    setting.options?.forEach((option) => {
      const optionEl = document.createElement("option");
      optionEl.value = option.value.toString();
      optionEl.textContent = option.label;
      optionEl.selected = option.value === currentValue;
      select.appendChild(optionEl);
    });

    select.addEventListener("change", () => {
      let value: any = select.value;

      if (setting.options?.some((opt) => typeof opt.value === "number")) {
        value = Number(value);
      } else if (
        setting.options?.some((opt) => typeof opt.value === "boolean")
      ) {
        value = value === "true";
      }
      this.controller.set(setting.id, value);
    });

    container.appendChild(select);
    return container;
  }

  private createInputControl(
    setting: Setting,
    currentValue: string
  ): HTMLDivElement {
    const container = document.createElement("div");
    container.className = "settings-control settings-input";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "settings-text-input";
    input.value = currentValue || "";
    input.placeholder = setting.placeholder || "";

    input.addEventListener("change", () => {
      this.controller.set(setting.id, input.value);
    });

    container.appendChild(input);
    return container;
  }

  private createNumberControl(
    setting: Setting,
    currentValue: number
  ): HTMLDivElement {
    const container = document.createElement("div");
    container.className = "settings-control settings-number";

    const input = document.createElement("input");
    input.type = "number";
    input.className = "settings-number-input";
    input.value = currentValue?.toString() || "";
    if (setting.min !== undefined) input.min = setting.min.toString();
    if (setting.max !== undefined) input.max = setting.max.toString();
    if (setting.step !== undefined) input.step = setting.step.toString();

    input.addEventListener("change", () => {
      this.controller.set(setting.id, Number(input.value));
    });

    container.appendChild(input);
    return container;
  }

  private createColorControl(
    setting: Setting,
    currentValue: string
  ): HTMLDivElement {
    const container = document.createElement("div");
    container.className = "settings-control settings-color";

    const input = document.createElement("input");
    input.type = "color";
    input.className = "settings-color-input";
    input.value = currentValue || "#000000";

    input.addEventListener("change", () => {
      this.controller.set(setting.id, input.value);
    });

    container.appendChild(input);
    return container;
  }

  private createRangeControl(
    setting: Setting,
    currentValue: number
  ): HTMLDivElement {
    const container = document.createElement("div");
    container.className = "settings-control settings-range";

    const input = document.createElement("input");
    input.type = "range";
    input.className = "settings-range-input";
    input.value = currentValue?.toString() || "";
    if (setting.min !== undefined) input.min = setting.min.toString();
    if (setting.max !== undefined) input.max = setting.max.toString();
    if (setting.step !== undefined) input.step = setting.step.toString();

    const valueDisplay = document.createElement("span");
    valueDisplay.className = "settings-range-value";
    valueDisplay.textContent = currentValue?.toString() || "";

    input.addEventListener("input", () => {
      valueDisplay.textContent = input.value;
    });

    input.addEventListener("change", () => {
      this.controller.set(setting.id, Number(input.value));
    });

    container.appendChild(input);
    container.appendChild(valueDisplay);
    return container;
  }

  private selectCategory(categoryId: string) {
    this.currentCategory = categoryId;

    const navItems = this.categoryNav?.querySelectorAll(".settings-nav-item");
    navItems?.forEach((item) => {
      const htmlItem = item as HTMLElement;
      htmlItem.classList.toggle(
        "active",
        htmlItem.dataset.categoryId === categoryId
      );
    });

    this.renderCategorySettings(categoryId);
  }

  private setupEventListeners() {
    this.searchInput?.addEventListener("input", (e) => {
      const query = (e.target as HTMLInputElement).value.toLowerCase();
      this.filterSettings(query);
    });
  }

  private filterSettings(query: string) {
    if (!query) {
      this.renderCategorySettings(this.currentCategory);
      return;
    }

    if (!this.settingsContent) return;

    this.settingsContent.innerHTML = "";

    const allSettings = this.controller.getSettingsConfig();
    const filteredSettings = allSettings.filter(
      (setting) =>
        setting.title.toLowerCase().includes(query) ||
        setting.description?.toLowerCase().includes(query) ||
        setting.id.toLowerCase().includes(query)
    );

    if (filteredSettings.length === 0) {
      const noResults = document.createElement("div");
      noResults.className = "settings-no-results";
      noResults.textContent = "No settings found";
      this.settingsContent.appendChild(noResults);
      return;
    }

    const groupedSettings = new Map<string, Setting[]>();
    filteredSettings.forEach((setting) => {
      if (!groupedSettings.has(setting.category)) {
        groupedSettings.set(setting.category, []);
      }
      groupedSettings.get(setting.category)!.push(setting);
    });

    groupedSettings.forEach((settings, categoryId) => {
      const category = this.controller
        .getCategories()
        .find((c) => c.id === categoryId);
      if (!category) return;

      const categoryHeader = document.createElement("div");
      categoryHeader.className = "settings-category-header";

      const categoryTitle = document.createElement("h3");
      categoryTitle.className = "settings-category-title";
      categoryTitle.textContent = category.title;

      categoryHeader.appendChild(categoryTitle);
      this.settingsContent!.appendChild(categoryHeader);

      settings.forEach((setting) => {
        const settingEl = this.createSettingElement(setting);
        this.settingsContent!.appendChild(settingEl);
      });
    });
  }

  getDomElement(): HTMLDivElement {
    if (!this.settingsEl) {
      throw new Error("Settings element not initialized");
    }
    return this.settingsEl;
  }

  destroy() {
    if (this.settingsEl) {
      this.settingsEl.remove();
      this.settingsEl = null;
    }
    this.settingsContent = null;
    this.categoryNav = null;
    this.searchInput = null;
  }

  loadScrollbar() {
    new PerfectScrollbar(this.categoryNav!);
    new PerfectScrollbar(this.settingsContent!);
  }
}
