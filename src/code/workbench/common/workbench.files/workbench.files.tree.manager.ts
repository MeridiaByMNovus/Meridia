import { IFolderStructure, IEditorTab } from "../../workbench.types.js";
import { Editor } from "../workbench.editor/workbench.editor.js";
import { getStandalone } from "../workbench.standalone.js";
import { dispatch } from "../workbench.store/workbench.store.js";
import { select } from "../workbench.store/workbench.store.selector.js";
import {
  update_editor_tabs,
  update_folder_structure,
} from "../workbench.store/workbench.store.slice.js";

export interface TreeOperation {
  success: boolean;
  error?: string;
  data?: any;
}

export class TreeManager {
  private structure: IFolderStructure;
  private expandedFolders: Set<string>;
  private loadedFolders: Set<string>;

  constructor(
    structure: IFolderStructure,
    expandedFolders: Set<string>,
    loadedFolders: Set<string>
  ) {
    this.structure = this.forceDeepMutableCopy(structure);
    this.expandedFolders = new Set(expandedFolders);
    this.loadedFolders = new Set(loadedFolders);
  }

  private forceDeepMutableCopy<T>(obj: T): T {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }

    try {
      const jsonClone = JSON.parse(JSON.stringify(obj));

      if (Array.isArray(jsonClone)) {
        try {
          jsonClone.push(null);
          jsonClone.pop();
        } catch (e) {
          throw new Error("JSON clone still not mutable");
        }
      }

      return jsonClone;
    } catch (error) {
      console.warn("JSON clone failed, using manual approach:", error);

      if (Array.isArray(obj)) {
        const newArray = [];
        for (let i = 0; i < obj.length; i++) {
          newArray[i] = this.forceDeepMutableCopy(obj[i]);
        }
        return newArray as unknown as T;
      }

      const newObj = {};
      Object.keys(obj).forEach((key) => {
        try {
          (newObj as any)[key] = this.forceDeepMutableCopy((obj as any)[key]);
        } catch (e) {
          console.error(`Failed to copy property ${key}:`, e);
        }
      });

      return newObj as T;
    }
  }

  private createMutableCopy<T>(obj: T): T {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.createMutableCopy(item)) as unknown as T;
    }

    const copy = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        copy[key] = this.createMutableCopy(obj[key]);
      }
    }

    return copy;
  }

  private validateInputs(params: { [key: string]: any }): TreeOperation {
    for (const [key, value] of Object.entries(params)) {
      if (
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "")
      ) {
        return {
          success: false,
          error: `Invalid ${key}: cannot be undefined, null, or empty`,
        };
      }
    }
    return { success: true };
  }

  private normalizeUri(uri: string): string {
    if (typeof uri !== "string") {
      throw new Error("URI must be a string");
    }
    return uri.replace(/\\\\/g, "/");
  }

  private findNodeByUri(
    node: IFolderStructure,
    targetUri: string
  ): IFolderStructure | null {
    if (node.uri === targetUri) {
      return node;
    }

    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        const found = this.findNodeByUri(child, targetUri);
        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  private sortChildren(children: IFolderStructure[]): void {
    children.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === "folder" ? -1 : 1;
    });
  }

  private updateNodeUri(
    node: IFolderStructure,
    oldUri: string,
    newUri: string
  ): void {
    node.uri = newUri;

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child) => {
        const childNewUri = child.uri.replace(oldUri, newUri);
        this.updateNodeUri(child, child.uri, childNewUri);
      });
    }
  }

  private removeNodeFromStructure(
    node: IFolderStructure,
    targetUri: string
  ): boolean {
    if (!node.children || !Array.isArray(node.children)) {
      return false;
    }

    for (let i = 0; i < node.children.length; i++) {
      if (node.children[i]?.uri === targetUri) {
        node.children.splice(i, 1);
        return true;
      }

      if (this.removeNodeFromStructure(node.children[i]!, targetUri)) {
        return true;
      }
    }
    return false;
  }

  private persistChanges(): void {
    window.storage.store("files-structure", this.structure);
    window.storage.store(
      "files-expanded-folder",
      Array.from(this.expandedFolders)
    );
    dispatch(update_folder_structure(this.structure));
  }

  private updateEditorTabs(
    oldUri: string,
    newUri?: string,
    newName?: string
  ): void {
    const tabs = select((s) => s.main.editor_tabs);

    if (!Array.isArray(tabs)) {
      return;
    }

    let updatedTabs = tabs;

    if (newUri || newName) {
      updatedTabs = tabs.map((tab) => {
        if (tab.uri === oldUri) {
          return {
            ...tab,
            name: newName || tab.name,
            uri: newUri || tab.uri,
          };
        }
        return tab;
      });
    } else {
      updatedTabs = tabs.filter((tab) => tab.uri !== oldUri);

      const editor = getStandalone("editor") as Editor;
      if (editor && typeof editor._close === "function") {
        editor._close(oldUri);
      }
    }

    dispatch(update_editor_tabs(updatedTabs));
  }

  public addNode(
    parentUri: string,
    nodeName: string,
    nodeType: "file" | "folder"
  ): TreeOperation {
    try {
      const validation = this.validateInputs({ parentUri, nodeName, nodeType });
      if (!validation.success) {
        return validation;
      }

      const normalizedParentUri = this.normalizeUri(parentUri);

      const newNode: IFolderStructure = {
        name: nodeName,
        uri: `${normalizedParentUri}/${nodeName}`,
        type: nodeType,
        children: nodeType === "folder" ? [] : [],
        isRoot: false,
      };

      const reconstructStructure = (currentNode: any): any => {
        if (!currentNode) return currentNode;

        const newStructureNode = {
          name: currentNode.name,
          uri: currentNode.uri,
          type: currentNode.type,
          isRoot: currentNode.isRoot,
        } as any;

        if (currentNode.children && Array.isArray(currentNode.children)) {
          const newChildren = [];

          for (const child of currentNode.children) {
            if (child) {
              newChildren.push(reconstructStructure(child));
            }
          }

          if (currentNode.uri === normalizedParentUri) {
            const exists = newChildren.some(
              (child) => child && child.name === nodeName
            );
            if (exists) {
              throw new Error(
                `Node ${nodeName} already exists in parent ${normalizedParentUri}`
              );
            }

            newChildren.push(newNode);
          }

          newChildren.sort((a, b) => {
            if (a.type === b.type) {
              return a.name.localeCompare(b.name);
            }
            return a.type === "folder" ? -1 : 1;
          });

          newStructureNode.children = newChildren;
        }

        return newStructureNode;
      };

      const newStructure = reconstructStructure(this.structure);

      const originalCount = JSON.stringify(this.structure).length;
      const newCount = JSON.stringify(newStructure).length;

      if (newCount <= originalCount) {
        return {
          success: false,
          error: `Parent node not found or not a folder: ${normalizedParentUri}`,
        };
      }

      this.structure = newStructure;
      this.persistChanges();

      return { success: true, data: newNode };
    } catch (error) {
      console.error("Error in addNode:", error);
      return {
        success: false,
        error: `Error adding node: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  public removeNode(nodeUri: string): TreeOperation {
    try {
      const validation = this.validateInputs({ nodeUri });
      if (!validation.success) {
        return validation;
      }

      const normalizedUri = this.normalizeUri(nodeUri);

      this.updateEditorTabs(normalizedUri);

      const createStructureWithoutNode = (
        node: any,
        targetUri: string
      ): any => {
        if (!node) return node;

        const newNode = { ...node };

        if (newNode.children && Array.isArray(newNode.children)) {
          const newChildren = [];

          for (const child of newNode.children) {
            if (child && child.uri !== targetUri) {
              const processedChild = createStructureWithoutNode(
                child,
                targetUri
              );
              newChildren.push(processedChild);
            }
          }

          newNode.children = newChildren;
        }

        return newNode;
      };

      const newStructure = createStructureWithoutNode(
        this.structure,
        normalizedUri
      );

      const originalJson = JSON.stringify(this.structure);
      const newJson = JSON.stringify(newStructure);

      if (originalJson === newJson) {
        return { success: false, error: `Node not found: ${normalizedUri}` };
      }

      this.structure = newStructure;

      this.expandedFolders.delete(normalizedUri);
      this.loadedFolders.delete(normalizedUri);

      this.persistChanges();

      return { success: true };
    } catch (error) {
      console.error("Error in removeNode:", error);
      return {
        success: false,
        error: `Error removing node: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  public renameNode(nodeUri: string, newName: string): TreeOperation {
    try {
      const validation = this.validateInputs({ nodeUri, newName });
      if (!validation.success) {
        return validation;
      }

      const normalizedUri = this.normalizeUri(nodeUri);

      const node = this.findNodeByUri(this.structure, normalizedUri);
      if (!node) {
        return { success: false, error: `Node not found: ${normalizedUri}` };
      }

      const pathParts = node.uri.split("/");
      pathParts[pathParts.length - 1] = newName;
      const newUri = pathParts.join("/");

      node.name = newName;
      this.updateNodeUri(node, node.uri, newUri);

      if (this.expandedFolders.has(normalizedUri)) {
        this.expandedFolders.delete(normalizedUri);
        this.expandedFolders.add(newUri);
      }
      if (this.loadedFolders.has(normalizedUri)) {
        this.loadedFolders.delete(normalizedUri);
        this.loadedFolders.add(newUri);
      }

      this.updateEditorTabs(normalizedUri, newUri, newName);

      this.persistChanges();

      return {
        success: true,
        data: { oldUri: normalizedUri, newUri, newName },
      };
    } catch (error) {
      return {
        success: false,
        error: `Error renaming node: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  public moveNode(sourceUri: string, targetParentUri: string): TreeOperation {
    try {
      const validation = this.validateInputs({ sourceUri, targetParentUri });
      if (!validation.success) {
        return validation;
      }

      const normalizedSourceUri = this.normalizeUri(sourceUri);
      const normalizedTargetUri = this.normalizeUri(targetParentUri);

      const sourceNode = this.findNodeByUri(
        this.structure,
        normalizedSourceUri
      );
      const targetParent = this.findNodeByUri(
        this.structure,
        normalizedTargetUri
      );

      if (!sourceNode) {
        return {
          success: false,
          error: `Source node not found: ${normalizedSourceUri}`,
        };
      }
      if (!targetParent || targetParent.type !== "folder") {
        return {
          success: false,
          error: `Target parent not found or not a folder: ${normalizedTargetUri}`,
        };
      }

      if (!this.removeNodeFromStructure(this.structure, normalizedSourceUri)) {
        return {
          success: false,
          error: `Failed to remove node from source location`,
        };
      }

      const newUri = `${normalizedTargetUri}/${sourceNode.name}`;
      this.updateNodeUri(sourceNode, normalizedSourceUri, newUri);

      if (!targetParent.children) {
        targetParent.children = [];
      }
      targetParent.children.push(sourceNode);
      this.sortChildren(targetParent.children);

      if (this.expandedFolders.has(normalizedSourceUri)) {
        this.expandedFolders.delete(normalizedSourceUri);
        this.expandedFolders.add(newUri);
      }
      if (this.loadedFolders.has(normalizedSourceUri)) {
        this.loadedFolders.delete(normalizedSourceUri);
        this.loadedFolders.add(newUri);
      }

      this.updateEditorTabs(normalizedSourceUri, newUri);

      this.persistChanges();

      return { success: true, data: { oldUri: normalizedSourceUri, newUri } };
    } catch (error) {
      return {
        success: false,
        error: `Error moving node: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  public getStructure(): IFolderStructure {
    return this.createMutableCopy(this.structure);
  }

  public getExpandedFolders(): Set<string> {
    return new Set(this.expandedFolders);
  }

  public getLoadedFolders(): Set<string> {
    return new Set(this.loadedFolders);
  }
}
