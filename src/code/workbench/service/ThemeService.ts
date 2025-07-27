import { Theme, ThemeKind } from "../../../typings/types.js";

type ThemeServiceOptions = {
  autoDetect?: boolean;
  preferredLight?: string;
  preferredDark?: string;
  storageKey?: string;
};

type WatchOptions = {
  immediate?: boolean;
  interval?: number;
};

export class ThemeService {
  private registry = new Map<string, Theme>();
  private current?: Theme;
  private previewBackup?: Theme;
  private listeners = new Set<(theme: Theme) => void>();
  private storageKey: string;
  private autoDetect: boolean;
  private preferredLight?: string;
  private preferredDark?: string;
  private mql?: MediaQueryList;

  constructor(opts: ThemeServiceOptions = {}) {
    this.storageKey = opts.storageKey ?? "app.theme";
    this.autoDetect = opts.autoDetect ?? false;
    this.preferredLight = opts.preferredLight;
    this.preferredDark = opts.preferredDark;
    if (this.autoDetect && typeof window !== "undefined" && window.matchMedia) {
      this.mql = window.matchMedia("(prefers-color-scheme: dark)");
      this.mql.addEventListener("change", this.handleSchemeChange);
    }
    // const persisted = this.loadPersisted();
    // if (persisted) this.setThemeByName(persisted, false);
  }

  dispose() {
    this.mql?.removeEventListener("change", this.handleSchemeChange);
    this.listeners.clear();
  }

  register(theme: Theme) {
    this.registry.set(theme.name, theme);
    return this;
  }

  registerMany(themes: Theme[]) {
    themes.forEach((t) => this.register(t));
    return this;
  }

  setThemeByName(name: string, persist = true) {
    const t = this.registry.get(name);
    if (!t) throw new Error(`Theme '${name}' not found`);
    this.setTheme(t, persist);
  }

  setTheme(theme: Theme, persist = true) {
    this.current = theme;
    this.applyCssVars(theme.colors);
    if (persist) this.persist(theme.name);
    this.emit(theme);
  }

  beginPreview(name: string) {
    const t = this.registry.get(name);
    if (!t) return;
    if (!this.previewBackup) this.previewBackup = this.current;
    this.setTheme(t, false);
  }

  cancelPreview() {
    if (!this.previewBackup) return;
    this.setTheme(this.previewBackup, false);
    this.previewBackup = undefined;
  }

  confirmPreview() {
    if (!this.current) return;
    this.persist(this.current.name);
    this.previewBackup = undefined;
  }

  mergeOverrides(overrides: Partial<Theme>) {
    if (!this.current) return;
    const merged: Theme = {
      ...this.current,
      ...overrides,
      colors: { ...this.current.colors, ...(overrides.colors ?? {}) },
      tokenColors: {
        ...this.current.tokenColors,
        ...(overrides.tokenColors ?? {}),
      },
      semanticTokens: {
        ...this.current.semanticTokens,
        ...(overrides.semanticTokens ?? {}),
      },
    };
    this.setTheme(merged, false);
  }

  getColor(key: string) {
    if (this.current?.colors[key]) return this.current.colors[key];
    return (
      getComputedStyle(document.documentElement)
        .getPropertyValue(key)
        ?.trim() || undefined
    );
  }

  getVar(tag: string) {
    const key = tag.startsWith("--") ? tag : `--${tag}`;
    return this.getColor(key);
  }

  watchVar(
    tag: string,
    cb: (newVal: string | undefined, oldVal: string | undefined) => void,
    opts: WatchOptions = {}
  ) {
    const key = tag.startsWith("--") ? tag : `--${tag}`;
    let prev = this.getColor(key);
    if (opts.immediate) cb(prev, undefined);
    const handler = () => {
      const cur = this.getColor(key);
      if (cur !== prev) {
        const old = prev;
        prev = cur;
        cb(cur, old);
      }
    };
    const unsubTheme = this.subscribe(() => handler());
    const id = window.setInterval(handler, opts.interval ?? 200);
    return () => {
      unsubTheme();
      clearInterval(id);
    };
  }

  getKind(): ThemeKind | undefined {
    return this.current?.kind;
  }

  getCurrent() {
    return this.current;
  }

  listThemes() {
    return Array.from(this.registry.keys());
  }

  subscribe(fn: (theme: Theme) => void) {
    this.listeners.add(fn);
    if (this.current) fn(this.current);
    return () => this.listeners.delete(fn);
  }

  private emit(theme: Theme) {
    this.listeners.forEach((l) => l(theme));
  }

  private applyCssVars(vars: Record<string, string>) {
    const root = document.documentElement;
    for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  }

  private handleSchemeChange = () => {
    if (!this.autoDetect) return;
    const prefersDark = this.mql?.matches;
    const target = prefersDark ? this.preferredDark : this.preferredLight;
    if (target && this.registry.has(target)) this.setThemeByName(target);
  };

  private persist(name: string) {
    try {
      localStorage.setItem(this.storageKey, name);
    } catch {}
  }

  private loadPersisted() {
    try {
      return localStorage.getItem(this.storageKey) || undefined;
    } catch {
      return undefined;
    }
  }

  initFromPersisted() {
    const persisted = this.loadPersisted();
    if (persisted && this.registry.has(persisted)) {
      this.setThemeByName(persisted, false);
    }
  }
}
