import fs from "fs";
import path from "path";
import { DATA_JSON_PATH } from "./file_worker";

export class StorageWorker {
  private static filePath = DATA_JSON_PATH;
  private static data: Record<string, any> = StorageWorker.loadData();

  private static loadData(): Record<string, any> {
    try {
      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, "utf-8");
        const parsed = JSON.parse(fileContent);
        return parsed;
      } else {
        const initialData = {};
        this.saveData(initialData);
        return initialData;
      }
    } catch (err) {
      return {};
    }
  }

  private static saveData(data: Record<string, any>) {
    try {
      this.data = data; // Sync static data
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {}
  }

  public static store(key: string, value: any) {
    const previous = this.data[key];
    this.data[key] = value;
    this.saveData(this.data);
  }

  public static get(key: string): any {
    const val = this.data[key];
    return val;
  }

  public static replace(key: string, newValue: any) {
    if (key in this.data) {
      this.data[key] = newValue;
      this.saveData(this.data);
    } else {
    }
  }

  public static getAll(): Record<string, any> {
    return this.data;
  }
}
