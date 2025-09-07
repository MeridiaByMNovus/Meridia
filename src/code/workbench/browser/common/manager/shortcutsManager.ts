export class ShortcutsManager {
  public static shortcuts: Map<string, Function> = new Map();
  private static keydownListener?: (event: KeyboardEvent) => void;
  private static isListening: boolean = false;

  static {
    this.listen();
  }

  public static addShortcut(shortcut: string, hook: Function) {
    this.shortcuts.set(shortcut, hook);
  }

  public static removeShortcut(shortcut: string) {
    this.shortcuts.delete(shortcut);
  }

  public static attachIpcRendererListner(address: string, hook: Function) {
    window.ipc.on(address, hook);

    return () => {
      window.ipc.removeListener(address, hook);
    };
  }

  private static listen() {
    if (this.isListening) {
      return;
    }

    this.keydownListener = (event: KeyboardEvent) => {
      const shortcut = this.getShortcutFromEvent(event);
      const hook = this.shortcuts.get(shortcut);

      if (hook) {
        event.preventDefault();
        event.stopPropagation();
        hook(event);
      }
    };

    document.addEventListener("keydown", this.keydownListener, true);
    this.isListening = true;
  }

  public static stopListening() {
    if (this.keydownListener && this.isListening) {
      document.removeEventListener("keydown", this.keydownListener, true);
      this.keydownListener = undefined;
      this.isListening = false;
    }
  }

  private static getShortcutFromEvent(event: KeyboardEvent): string {
    const parts: string[] = [];

    if (event.ctrlKey || event.metaKey) {
      parts.push(event.metaKey ? "cmd" : "ctrl");
    }
    if (event.altKey) {
      parts.push("alt");
    }
    if (event.shiftKey) {
      parts.push("shift");
    }

    const key = event.key.toLowerCase();

    if (key === " ") {
      parts.push("space");
    } else if (key === "escape") {
      parts.push("esc");
    } else if (key === "arrowup") {
      parts.push("up");
    } else if (key === "arrowdown") {
      parts.push("down");
    } else if (key === "arrowleft") {
      parts.push("left");
    } else if (key === "arrowright") {
      parts.push("right");
    } else {
      parts.push(key);
    }

    return parts.join("+");
  }

  public static get listening(): boolean {
    return this.isListening;
  }
}
