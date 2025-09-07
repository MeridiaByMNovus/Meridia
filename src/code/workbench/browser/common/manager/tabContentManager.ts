import { TabContentRegistry } from "../../../common/registery/TabContentRegistery.js";

export class TabContentManager {
  public static contents: Map<string, HTMLElement> = new Map();
  public static registry = TabContentRegistry;

  public static createInstance(): TabContentManager {
    return new TabContentManager();
  }

  public static addContent(path: string, content: HTMLElement) {
    this.contents.set(path, content);
    this.addToRegistry(path, content);
  }

  public static removeContent(path: string) {
    this.contents.delete(path);
    this.removeFromRegistry(path);
  }

  public static getContent(path: string) {
    return this.contents.get(path);
  }

  private static addToRegistry(path: string, content: HTMLElement) {
    this.registry.set(path, content);
  }

  private static removeFromRegistry(path: string) {
    this.registry.delete(path);
  }
}
