import fs from "fs";
import { FileInitService } from "./FileInitService";
import dotenv from "dotenv";

dotenv.config();

export class StorageService {
  private static STORE_JSON_PATH: string;
  private static filePath: string;
  private static data: Record<string, any>;

  static {
    const fileInit = new FileInitService();
    this.STORE_JSON_PATH = fileInit.STORE_JSON_PATH;
    this.filePath = this.STORE_JSON_PATH;
    this.data = this.load();
  }

  private static load(): Record<string, any> {
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, "utf-8");
        return JSON.parse(content);
      } else {
        this.save({});
        return {};
      }
    } catch {
      return {};
    }
  }

  private static save(data: Record<string, any>): void {
    try {
      this.data = data;
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), "utf-8");
    } catch {}
  }

  public static get<T = any>(key: string): T | undefined {
    return this.data[key];
  }

  public static set(key: string, value: any): void {
    this.data[key] = value;
    this.save(this.data);
  }

  public static replace(key: string, newValue: any): void {
    if (key in this.data) {
      this.data[key] = newValue;
      this.save(this.data);
    }
  }

  public static getAll(): Record<string, any> {
    return this.data;
  }
}
