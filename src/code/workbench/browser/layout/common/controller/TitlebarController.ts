export class TitleBarController {
  private target: string;
  private activeLabel: HTMLDivElement | null = null;

  constructor() {
    this.target = (window as any).target_window;
    this.setupTitlebar();
  }

  async setupTitlebar() {
    const menuItems = await (window as any).electron.getMenu();
    const menuDiv = document.querySelector<HTMLDivElement>(".menu");
    if (!menuDiv) return;

    for (const item of menuItems) {
      const itemDiv = this.createMenuItem(item);
      menuDiv.appendChild(itemDiv);
    }

    document.addEventListener("click", (event) => {
      if (menuDiv && !menuDiv.contains(event.target as Node)) {
        this.activeLabel?.classList.remove("active");
        document
          .querySelectorAll<HTMLDivElement>(".submenu")
          .forEach((el) => (el.style.display = "none"));
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        this.activeLabel?.classList.remove("active");
        document
          .querySelectorAll<HTMLDivElement>(".submenu")
          .forEach((el) => (el.style.display = "none"));
      }
    });

    document.addEventListener("contextmenu", (event) => {
      if (menuDiv && !menuDiv.contains(event.target as Node)) {
        this.activeLabel?.classList.remove("active");
        document
          .querySelectorAll<HTMLDivElement>(".submenu")
          .forEach((el) => (el.style.display = "none"));
      }
    });
  }

  handleMenuButtonClick(menuId: string) {
    (window as any).electron.handleMenuClick(menuId);
  }

  private createMenuItem(item: any): HTMLDivElement {
    const itemDiv = document.createElement("div");
    itemDiv.className = "menu-item";

    const label = document.createElement("div");
    label.className = "menu-item-text";
    label.innerText = item.label;

    if (item.accelerator) {
      const shortcut = document.createElement("span");
      shortcut.className = "shortcut";
      shortcut.innerText = item.accelerator;
      label.appendChild(shortcut);
    }

    itemDiv.appendChild(label);

    if (item.submenu?.length) {
      const submenu = this.createSubmenu(item.submenu);
      itemDiv.appendChild(submenu);

      itemDiv.onclick = () => {
        this.activeLabel?.classList.remove("active");
        this.activeLabel = label;
        label.classList.add("active");
        document
          .querySelectorAll(".submenu")
          .forEach((el) => ((el as HTMLElement).style.display = "none"));
        submenu.style.display = "block";
      };
    }

    return itemDiv;
  }

  private createSubmenu(submenuItems: any[]): HTMLDivElement {
    const submenu = document.createElement("div");
    submenu.className = "submenu";
    submenu.style.display = "none";

    for (const sub of submenuItems) {
      const subItem = document.createElement("div");
      subItem.className = sub.label ? "submenu-item" : "separator";
      subItem.innerText = sub.label || "";

      if (sub.accelerator) {
        const shortcut = document.createElement("span");
        shortcut.className = "shortcut";
        shortcut.innerText = sub.accelerator;
        subItem.appendChild(shortcut);
      }

      subItem.onclick = (e) => {
        e.stopPropagation();
        this.handleMenuButtonClick(sub.id);
        submenu.style.display = "none";
        this.activeLabel?.classList.remove("active");
        this.activeLabel = null;
      };

      submenu.appendChild(subItem);
    }

    return submenu;
  }
}
