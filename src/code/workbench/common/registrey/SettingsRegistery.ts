type Setting = string | (() => string);

export const SettingsRegistry = new Map<string, Setting>();

function loadSettingsFromStorage(): void {
  try {
    const stored = localStorage.getItem("meridia-settings");
    if (stored) {
      const parsedSettings = JSON.parse(stored);

      SettingsRegistry.clear();

      Object.entries(parsedSettings).forEach(([key, value]) => {
        SettingsRegistry.set(key, value as Setting);
      });
    }
  } catch (error) {}
}

function saveSettingsToStorage(): void {
  try {
    const settingsObj: Record<string, any> = {};

    SettingsRegistry.forEach((value, key) => {
      settingsObj[key] = typeof value === "function" ? value() : value;
    });

    localStorage.setItem("meridia-settings", JSON.stringify(settingsObj));
  } catch (error) {}
}

export const SettingsRegistryManager = {
  get(key: string): any {
    const value = SettingsRegistry.get(key);
    return typeof value === "function" ? value() : value;
  },

  set(key: string, value: Setting): void {
    SettingsRegistry.set(key, value);
    saveSettingsToStorage();
  },

  has(key: string): boolean {
    return SettingsRegistry.has(key);
  },

  delete(key: string): boolean {
    const result = SettingsRegistry.delete(key);
    if (result) {
      saveSettingsToStorage();
    }
    return result;
  },

  clear(): void {
    SettingsRegistry.clear();
    saveSettingsToStorage();
  },

  loadFromStorage(): void {
    loadSettingsFromStorage();
  },

  saveToStorage(): void {
    saveSettingsToStorage();
  },

  getAll(): Record<string, any> {
    const result: Record<string, any> = {};
    SettingsRegistry.forEach((value, key) => {
      result[key] = typeof value === "function" ? value() : value;
    });
    return result;
  },

  setMany(settings: Record<string, Setting>): void {
    Object.entries(settings).forEach(([key, value]) => {
      SettingsRegistry.set(key, value);
    });
    saveSettingsToStorage();
  },
};

loadSettingsFromStorage();
