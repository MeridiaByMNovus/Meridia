import { TreeManager } from "../common/workbench.files/workbench.files.tree.manager.js";
import { _generateUUID } from "../common/workbench.files/workbench.files.utils.js";
import { dispatch } from "../common/workbench.store/workbench.store.js";
import { select } from "../common/workbench.store/workbench.store.selector.js";
import {
  update_editor_tabs,
  update_folder_structure,
} from "../common/workbench.store/workbench.store.slice.js";
import { getFileIcon } from "../common/workbench.utils.js";
import {
  IEditorTab,
  IFolderStructure,
  TreeOperation,
} from "../workbench.types.js";
import { chevronRightIcon } from "./workbench.media/workbench.icons.js";
import { CoreEl } from "./workbench.parts/workbench.part.el.js";

const path = window.path;

export class Files extends CoreEl {
  private treeManager: TreeManager;
  private _structure: IFolderStructure;
  private _expandedFolders: Set<string> = new Set();
  private _loadedFolders: Set<string> = new Set();

  constructor() {
    super();
    this._structure = [] as any;
    const _expanded = window.storage.get("files-expanded-folder");
    let _structure = window.storage.get("files-structure");

    dispatch(update_folder_structure(_structure));

    if (_structure) {
      this._structure = this._createMutableCopy(_structure);
    }

    if (_expanded && Array.isArray(_expanded)) {
      this._expandedFolders = new Set(_expanded);
    } else if (
      _expanded &&
      typeof _expanded === "object" &&
      _expanded.constructor === Object
    ) {
      const keys = Object.keys(_expanded);
      if (keys.length > 0) {
        this._expandedFolders = new Set(keys);
      }
    }

    this.treeManager = new TreeManager(
      this._structure,
      this._expandedFolders,
      this._loadedFolders
    );

    this._createEl();
    this._restore();
    this._changeLinst();
  }

  private _createMutableCopy<T>(obj: T): T {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this._createMutableCopy(item)) as unknown as T;
    }

    const copy = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        copy[key] = this._createMutableCopy(obj[key]);
      }
    }

    return copy;
  }

  private _changeLinst(): void {
    window.ipc.on(
      "files-node-added",
      (
        event: any,
        data: {
          parentUri: string;
          nodeName: string;
          nodeType: "file" | "folder";
        }
      ) => {
        if (!data || !data.parentUri || !data.nodeName || !data.nodeType) {
          return;
        }
        this.addNode(data.parentUri, data.nodeName, data.nodeType);
      }
    );

    window.ipc.on(
      "files-node-removed",
      (event: any, data: { nodeUri: string }) => {
        if (!data || !data.nodeUri) {
          return;
        }
        this.removeNode(data.nodeUri);
      }
    );

    window.ipc.on(
      "files-node-renamed",
      (event: any, data: { nodeUri: string; newName: string }) => {
        if (!data || !data.nodeUri || !data.newName) {
          return;
        }
        this.renameNode(data.nodeUri, data.newName);
      }
    );

    window.ipc.on(
      "files-node-moved",
      (event: any, data: { sourceUri: string; targetParentUri: string }) => {
        if (!data || !data.sourceUri || !data.targetParentUri) {
          return;
        }
        this.moveNode(data.sourceUri, data.targetParentUri);
      }
    );

    window.ipc.on(
      "files-node-changed",
      (event: any, data: { nodeUri: string }) => {
        if (data && data.nodeUri) {
        }
      }
    );
  }

  private async _restore() {
    if (
      this._expandedFolders.size > 0 &&
      this._structure &&
      this._structure.children
    ) {
      const expandedFolders = Array.from(this._expandedFolders);

      for (const folderUri of expandedFolders) {
        await this._loadIfNeeded(folderUri);
      }

      this._refreshTree();
    }
  }

  private async _loadIfNeeded(folderUri: string) {
    const node = this._findNodeByUri(this._structure, folderUri);
    if (node && node.type === "folder" && !this._loadedFolders.has(folderUri)) {
      try {
        const result = await window.files.openChildFolder(folderUri);

        if (result && result.success) {
          this._structure = this._createMutableCopy(result.structure);
          this._loadedFolders.add(folderUri);
          window.storage.store("files-structure", this._structure);

          this.treeManager = new TreeManager(
            this._structure,
            this._expandedFolders,
            this._loadedFolders
          );
        }
      } catch (error) {
        this._expandedFolders.delete(folderUri);
        window.storage.store(
          "files-expanded-folder",
          Array.from(this._expandedFolders)
        );
      }
    }
  }

  private _createEl() {
    this._el = document.createElement("div");
    this._el.className = "files scrollbar-container x-disable";

    if (!this._structure || !this._structure.isRoot) {
      this._createEmptyState();
    } else {
      this._createTreeView();
    }
  }

  private _createEmptyState() {
    const _emptyContainer = document.createElement("div");
    _emptyContainer.className = "empty-state";

    const _openFolderLabel = document.createElement("p");
    _openFolderLabel.textContent = "No folder selected, Please open a folder.";

    const _openFolderBtn = document.createElement("button");
    _openFolderBtn.textContent = "Open Folder";
    _openFolderBtn.className = "open-folder";

    _openFolderBtn.onclick = () => {
      this._handleOpenFolder();
    };

    _emptyContainer.appendChild(_openFolderLabel);
    _emptyContainer.appendChild(_openFolderBtn);
    this._el!.appendChild(_emptyContainer);
  }

  private _createTreeView() {
    const _tree = document.createElement("div");
    _tree.className = "tree";

    if (this._structure.children && this._structure.children.length > 0) {
      this._render(this._structure.children, _tree, 0);
    }
    this._el!.appendChild(_tree);
  }

  private _handleOpenFolder() {
    window.files.openFolder();
  }

  private _open(_path: string, _name: string) {
    const stateValue = select((s) => s.main.editor_tabs);
    const _uri = path.normalize(_path);

    let currentTabs: IEditorTab[] = [];

    if (Array.isArray(stateValue)) {
      currentTabs = stateValue;
    } else if (stateValue && typeof stateValue === "object") {
      currentTabs = Object.values(stateValue);
    }

    const existingTabIndex = currentTabs.findIndex((tab) => tab.uri === _uri);

    if (existingTabIndex !== -1) {
      const updatedTabs = currentTabs.map((tab, index) => ({
        ...tab,
        active: index === existingTabIndex,
      }));

      dispatch(update_editor_tabs(updatedTabs));
    } else {
      const newTab: IEditorTab = {
        name: _name,
        uri: _uri,
        active: true,
        is_touched: false,
      };

      const updatedTabs = [
        ...currentTabs.map((tab) => ({
          ...tab,
          active: false,
        })),
        newTab,
      ];

      dispatch(update_editor_tabs(updatedTabs));
    }
  }

  private _render(
    nodes: IFolderStructure[],
    container: HTMLElement,
    depth: number = 0
  ) {
    if (!Array.isArray(nodes)) {
      return;
    }

    nodes.forEach((_node) => {
      if (!_node || !_node.name || !_node.uri) {
        return;
      }

      const _nodeEl = document.createElement("div");
      _nodeEl.className = "node";
      _nodeEl.dataset.nodeId = _node.uri;

      _nodeEl.style.setProperty("--nesting-depth", depth.toString());

      const _icon = document.createElement("span");
      _icon.className = "icon";

      const nodeId = _node.uri;

      if (_node.type === "file") {
        _icon.innerHTML = getFileIcon(_node.name);
      } else {
        const isExpanded = this._expandedFolders.has(nodeId);
        _icon.innerHTML = chevronRightIcon;
        _icon.style.cursor = "pointer";

        if (isExpanded) {
          _icon.classList.add("expanded");
        }

        _icon.onclick = (e) => {
          e.stopPropagation();
          this._toggleFolder(nodeId, _nodeEl);
        };
      }

      const _name = document.createElement("span");
      _name.textContent = _node.name;
      _name.className = "name";

      if (_node.type === "folder") {
        _name.style.cursor = "pointer";
        _name.onclick = (e) => {
          e.stopPropagation();
          this._toggleFolder(nodeId, _nodeEl);
        };
      }

      _nodeEl.appendChild(_icon);
      _nodeEl.appendChild(_name);
      container.appendChild(_nodeEl);

      _nodeEl.onclick = (e) => {
        e.stopPropagation();
        if (_node.type === "folder") {
          this._toggleFolder(nodeId, _nodeEl);
        } else {
          this._open(_node.uri, _node.name);
        }
      };

      if (_node.type === "folder") {
        const _childrenContainer = document.createElement("div");
        _childrenContainer.className = "child-nodes";
        _childrenContainer.dataset.nodeId = nodeId;

        const isExpanded = this._expandedFolders.has(nodeId);

        if (isExpanded) {
          _childrenContainer.style.height = "auto";
          _childrenContainer.style.opacity = "1";
        } else {
          _childrenContainer.style.height = "0px";
          _childrenContainer.style.opacity = "0";
        }

        if (_node.children && _node.children.length > 0) {
          this._render(_node.children, _childrenContainer, depth + 1);
          this._loadedFolders.add(nodeId);
        }

        container.appendChild(_childrenContainer);
      }
    });
  }

  private async _load(folderUri: string, container: HTMLElement) {
    try {
      const result = await window.files.openChildFolder(folderUri);

      if (result && result.success) {
        this._structure = this._createMutableCopy(result.structure);
        window.storage.store("files-structure", this._structure);
        this._loadedFolders.add(folderUri);

        this.treeManager = new TreeManager(
          this._structure,
          this._expandedFolders,
          this._loadedFolders
        );

        const updatedNode = this._findNodeByUri(this._structure, folderUri);

        if (updatedNode && updatedNode.children) {
          container.innerHTML = "";

          const currentDepth = this._calculateDepth(container);
          this._render(updatedNode.children, container, currentDepth);

          container.offsetHeight;
          container.style.height = "auto";
          container.style.opacity = "1";
        }

        dispatch(update_folder_structure(this._structure));
      }
    } catch (error) {}
  }

  private _calculateDepth(container: HTMLElement): number {
    let depth = 0;
    let parent = container.parentElement;

    while (parent && !parent.classList.contains("tree")) {
      if (parent.classList.contains("child-nodes")) {
        depth++;
      }
      parent = parent.parentElement;
    }

    return depth;
  }

  private async _toggleFolder(nodeId: string, nodeEl: HTMLElement) {
    const isExpanded = this._expandedFolders.has(nodeId);
    const _icon = nodeEl.querySelector(".icon") as HTMLElement;

    let _childrenContainer: HTMLElement | null = null;

    let nextSibling = nodeEl.nextElementSibling;
    while (nextSibling) {
      if (
        nextSibling.classList.contains("child-nodes") &&
        (nextSibling as HTMLElement).dataset.nodeId === nodeId
      ) {
        _childrenContainer = nextSibling as HTMLElement;
        break;
      }
      nextSibling = nextSibling.nextElementSibling;
    }

    if (!_childrenContainer) {
      _childrenContainer = nodeEl.parentElement?.querySelector(
        `.child-nodes[data-node-id="${nodeId}"]`
      ) as HTMLElement;
    }

    if (isExpanded) {
      this._expandedFolders.delete(nodeId);
      _icon.classList.remove("expanded");

      if (_childrenContainer) {
        _childrenContainer.style.height =
          _childrenContainer.scrollHeight + "px";
        _childrenContainer.offsetHeight;
        _childrenContainer.style.height = "0px";
        _childrenContainer.style.opacity = "0";
      }
    } else {
      this._expandedFolders.add(nodeId);
      _icon.classList.add("expanded");

      if (_childrenContainer) {
        if (!this._loadedFolders.has(nodeId)) {
          await this._load(nodeId, _childrenContainer);
        }

        _childrenContainer.style.height = "0px";
        _childrenContainer.style.opacity = "0";
        _childrenContainer.offsetHeight;

        const targetHeight = _childrenContainer.scrollHeight;
        _childrenContainer.style.height = targetHeight + "px";
        _childrenContainer.style.opacity = "1";

        setTimeout(() => {
          if (_childrenContainer && this._expandedFolders.has(nodeId)) {
            _childrenContainer.style.height = "auto";
          }
        }, 300);
      }
    }

    window.storage.store(
      "files-expanded-folder",
      Array.from(this._expandedFolders)
    );
  }

  private _findNodeByUri(
    node: IFolderStructure,
    targetUri: string
  ): IFolderStructure | null {
    if (!node || !targetUri) {
      return null;
    }

    if (node.uri === targetUri) {
      return node;
    }

    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        const found = this._findNodeByUri(child, targetUri);
        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  private _refreshTree() {
    if (!this._el) {
      return;
    }

    this._el.innerHTML = "";

    if (
      !this._structure ||
      !this._structure.children ||
      this._structure.children.length === 0
    ) {
      this._createEmptyState();
    } else {
      this._createTreeView();
    }

    dispatch(update_folder_structure(this._structure));
  }

  private _syncWithTreeManager() {
    this._structure = this.treeManager.getStructure();
    this._expandedFolders = this.treeManager.getExpandedFolders();
    this._loadedFolders = this.treeManager.getLoadedFolders();
    this._refreshTree();
  }

  public async addNode(
    parentUri: string,
    nodeName: string,
    nodeType: "file" | "folder"
  ): Promise<boolean> {
    const result: TreeOperation = this.treeManager.addNode(
      parentUri,
      nodeName,
      nodeType
    );

    if (result.success) {
      this._syncWithTreeManager();
    } else {
    }

    return result.success;
  }

  public async removeNode(nodeUri: string): Promise<boolean> {
    const result: TreeOperation = this.treeManager.removeNode(nodeUri);

    if (result.success) {
      this._syncWithTreeManager();
    } else {
    }

    return result.success;
  }

  public async renameNode(nodeUri: string, newName: string): Promise<boolean> {
    const result: TreeOperation = this.treeManager.renameNode(nodeUri, newName);

    if (result.success) {
      this._syncWithTreeManager();
    } else {
    }

    return result.success;
  }

  public async moveNode(
    sourceUri: string,
    targetParentUri: string
  ): Promise<boolean> {
    const result: TreeOperation = this.treeManager.moveNode(
      sourceUri,
      targetParentUri
    );

    if (result.success) {
      this._syncWithTreeManager();
    } else {
    }

    return result.success;
  }

  public getStructure(): IFolderStructure {
    return this.treeManager.getStructure();
  }

  public refreshTree(): void {
    this._refreshTree();
  }

  public isNodeExpanded(nodeUri: string): boolean {
    return this._expandedFolders.has(nodeUri);
  }

  public expandNode(nodeUri: string): void {
    this._expandedFolders.add(nodeUri);
    window.storage.store(
      "files-expanded-folder",
      Array.from(this._expandedFolders)
    );
    this._refreshTree();
  }

  public collapseNode(nodeUri: string): void {
    this._expandedFolders.delete(nodeUri);
    window.storage.store(
      "files-expanded-folder",
      Array.from(this._expandedFolders)
    );
    this._refreshTree();
  }
}
