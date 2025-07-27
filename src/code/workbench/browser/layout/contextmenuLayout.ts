export class ContextMenuLayout {
  public menu: HTMLDivElement;
  private id: string;

  constructor(pos: { x: number; y: number }, onRequestClose: () => void) {
    this.id = crypto.randomUUID();
    this.registerAsOwner();

    const mainWrapper = document.querySelector(
      ".main-wrapper"
    ) as HTMLDivElement;
    this.menu = document.createElement("div");
    this.menu.className = "contextmenu-layout-wrapper";
    this.menu.style.left = `${pos.x}px`;
    this.menu.style.top = `${pos.y}px`;

    mainWrapper.appendChild(this.menu);
    mainWrapper.addEventListener("mousedown", this.handleClickOutside);
    document.addEventListener("keydown", this.handleKeyDown);
    this.cleanup = () => {
      mainWrapper.removeEventListener("mousedown", this.handleClickOutside);
      document.removeEventListener("keydown", this.handleKeyDown);
      this.clearOwner();
      onRequestClose();
      this.menu.remove();
    };
  }

  createSeparator() {
    const sep = document.createElement("div");
    sep.className = "separator";
    this.menu.appendChild(sep);
  }

  createBtn(text: string, fn: Function) {
    const btn = document.createElement("button");
    btn.className = "item";
    btn.textContent = text;
    btn.onclick = () => {
      fn();
      this.menu?.remove();
    };
    this.menu.appendChild(btn);
  }

  private cleanup: () => void;

  private handleClickOutside = (event: MouseEvent) => {
    if (!this.menu.contains(event.target as Node)) {
      this.cleanup();
    }
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      this.cleanup();
    }
  };

  private registerAsOwner() {
    (window as any).__CONTEXT_MENU_OWNER__ = this.id;
  }

  private clearOwner() {
    const current = (window as any).__CONTEXT_MENU_OWNER__;
    if (current === this.id) {
      (window as any).__CONTEXT_MENU_OWNER__ = null;
    }
  }

  public static isOwner(id: string) {
    return (window as any).__CONTEXT_MENU_OWNER__ === id;
  }

  public destroy() {
    this.cleanup();
  }
}
