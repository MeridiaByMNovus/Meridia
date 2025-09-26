import {
  getIcon,
  init_workbench_utils
} from "./chunk-XIEV3R25.js";
import {
  init_workbench_store_selector,
  select
} from "./chunk-EEHJVTSK.js";
import {
  dispatch,
  init_workbench_store
} from "./chunk-FPULJOSR.js";
import {
  init_workbench_store_slice,
  update_editor_tabs,
  update_folder_structure
} from "./chunk-EWJVXHY4.js";
import {
  chevronRightIcon,
  init_workbench_icons
} from "./chunk-UTYDY5QB.js";
import {
  CoreEl,
  init_workbench_part_el
} from "./chunk-X5EF5M4F.js";
import {
  __esm
} from "./chunk-KH45J4DC.js";

// src/code/workbench/browser/workbench.layout.files.ts
var Files;
var init_workbench_layout_files = __esm({
  "src/code/workbench/browser/workbench.layout.files.ts"() {
    init_workbench_store();
    init_workbench_store_selector();
    init_workbench_store_slice();
    init_workbench_utils();
    init_workbench_icons();
    init_workbench_part_el();
    Files = class extends CoreEl {
      _structure;
      _expandedFolders = /* @__PURE__ */ new Set();
      _loadedFolders = /* @__PURE__ */ new Set();
      constructor() {
        super();
        this._structure = [];
        const _expanded = window.storage.get("files-expanded-folder");
        const _structure = window.storage.get("files-structure");
        dispatch(update_folder_structure(_structure));
        if (_structure) {
          this._structure = _structure;
        }
        if (_expanded && Array.isArray(_expanded)) {
          this._expandedFolders = new Set(_expanded);
        } else if (_expanded && typeof _expanded === "object" && _expanded.constructor === Object) {
          const keys = Object.keys(_expanded);
          if (keys.length > 0) {
            this._expandedFolders = new Set(keys);
          }
        }
        this._createEl();
        this._restoreExpandedState();
        this._setupFileWatcherListeners();
      }
      _setupFileWatcherListeners() {
        window.ipc.on(
          "files-node-added",
          (data) => {
            this.addNode(data.parentUri, data.nodeName, data.nodeType);
          }
        );
        window.ipc.on("files-node-removed", (data) => {
          this.removeNode(data.nodeUri);
        });
        window.ipc.on("files-node-changed", (data) => {
        });
      }
      async _restoreExpandedState() {
        if (this._expandedFolders.size > 0 && this._structure && this._structure.children) {
          const expandedFolders = Array.from(this._expandedFolders);
          for (const folderUri of expandedFolders) {
            await this._loadFolderContentsIfNeeded(folderUri);
          }
          this._refreshTree();
        }
      }
      async _loadFolderContentsIfNeeded(folderUri) {
        const node = this._findNodeByUri(this._structure, folderUri);
        if (node && node.type === "folder" && !this._loadedFolders.has(folderUri)) {
          try {
            const result = await window.files.openChildFolder(folderUri);
            if (result && result.success) {
              this._structure = result.structure;
              this._loadedFolders.add(folderUri);
              window.storage.store("files-structure", result.structure);
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
      _createEl() {
        this._el = document.createElement("div");
        this._el.className = "files scrollbar-container x-disable";
        if (!this._structure || !this._structure.children || this._structure.children.length === 0) {
          this._createEmptyState();
        } else {
          this._createTreeView();
        }
      }
      _createEmptyState() {
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
        this._el.appendChild(_emptyContainer);
      }
      _createTreeView() {
        const _tree = document.createElement("div");
        _tree.className = "tree";
        this._renderNodes(this._structure.children, _tree);
        this._el.appendChild(_tree);
      }
      _handleOpenFolder() {
        window.files.openFolder();
      }
      _openFile(_uri, _name) {
        const stateValue = select((s) => s.main.editor_tabs);
        let currentTabs = [];
        if (Array.isArray(stateValue)) {
          currentTabs = stateValue;
        } else if (stateValue && typeof stateValue === "object") {
          currentTabs = Object.values(stateValue);
        }
        const existingTabIndex = currentTabs.findIndex((tab) => tab.uri === _uri);
        if (existingTabIndex !== -1) {
          const updatedTabs = currentTabs.map((tab, index) => ({
            ...tab,
            active: index === existingTabIndex
          }));
          dispatch(update_editor_tabs(updatedTabs));
        } else {
          const newTab = {
            name: _name,
            uri: _uri,
            active: true,
            is_touched: false
          };
          const updatedTabs = [
            ...currentTabs.map((tab) => ({
              ...tab,
              active: false
            })),
            newTab
          ];
          dispatch(update_editor_tabs(updatedTabs));
        }
      }
      _renderNodes(nodes, container) {
        nodes.forEach((_node) => {
          const _nodeEl = document.createElement("div");
          _nodeEl.className = "node";
          const _icon = document.createElement("span");
          _icon.className = "icon";
          const nodeId = _node.uri;
          if (_node.type === "file") {
            _icon.innerHTML = getIcon(_node.name);
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
              this._openFile(_node.uri, _node.name);
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
              this._renderNodes(_node.children, _childrenContainer);
              this._loadedFolders.add(nodeId);
            }
            container.appendChild(_childrenContainer);
          }
        });
      }
      async _loadFolderContents(folderUri, container) {
        try {
          const result = await window.files.openChildFolder(folderUri);
          if (result && result.success) {
            this._structure = result.structure;
            window.storage.store("files-structure", result.structure);
            this._loadedFolders.add(folderUri);
            const updatedNode = this._findNodeByUri(this._structure, folderUri);
            if (updatedNode && updatedNode.children) {
              container.innerHTML = "";
              this._renderNodes(updatedNode.children, container);
              container.offsetHeight;
              container.style.height = "auto";
              container.style.opacity = "1";
            }
            dispatch(update_folder_structure(this._structure));
          }
        } catch (error) {
        }
      }
      async _toggleFolder(nodeId, nodeEl) {
        const isExpanded = this._expandedFolders.has(nodeId);
        const _icon = nodeEl.querySelector(".icon");
        let _childrenContainer = null;
        let nextSibling = nodeEl.nextElementSibling;
        while (nextSibling) {
          if (nextSibling.classList.contains("child-nodes") && nextSibling.dataset.nodeId === nodeId) {
            _childrenContainer = nextSibling;
            break;
          }
          nextSibling = nextSibling.nextElementSibling;
        }
        if (!_childrenContainer) {
          _childrenContainer = nodeEl.parentElement?.querySelector(
            `.child-nodes[data-node-id="${nodeId}"]`
          );
        }
        if (isExpanded) {
          this._expandedFolders.delete(nodeId);
          _icon.classList.remove("expanded");
          if (_childrenContainer) {
            _childrenContainer.style.height = _childrenContainer.scrollHeight + "px";
            _childrenContainer.offsetHeight;
            _childrenContainer.style.height = "0px";
            _childrenContainer.style.opacity = "0";
          }
        } else {
          this._expandedFolders.add(nodeId);
          _icon.classList.add("expanded");
          if (_childrenContainer) {
            if (!this._loadedFolders.has(nodeId)) {
              await this._loadFolderContents(nodeId, _childrenContainer);
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
      _findNodeByUri(node, targetUri) {
        if (node.uri === targetUri) {
          return node;
        }
        if (node.children) {
          for (const child of node.children) {
            const found = this._findNodeByUri(child, targetUri);
            if (found) {
              return found;
            }
          }
        }
        return null;
      }
      _refreshTree() {
        this._el.innerHTML = "";
        if (!this._structure || !this._structure.children || this._structure.children.length === 0) {
          this._createEmptyState();
        } else {
          this._createTreeView();
        }
        dispatch(update_folder_structure(this._structure));
      }
      async addNode(parentUri, nodeName, nodeType) {
        try {
          const parentNode = this._findNodeByUri(this._structure, parentUri);
          if (!parentNode || parentNode.type !== "folder") {
            return false;
          }
          const newNode = {
            name: nodeName,
            uri: `${parentUri}/${nodeName}`,
            type: nodeType,
            children: nodeType === "folder" ? [] : void 0,
            isRoot: false
          };
          if (!parentNode.children) {
            parentNode.children = [];
          }
          parentNode.children.push(newNode);
          this._sortChildren(parentNode.children);
          window.storage.store("files-structure", this._structure);
          const parentContainer = this._el?.querySelector(
            `.child-nodes[data-node-id="${parentUri}"]`
          );
          if (parentContainer) {
            parentContainer.innerHTML = "";
            this._renderNodes(parentNode.children, parentContainer);
          } else {
            this._refreshTree();
          }
          return true;
        } catch (error) {
          return false;
        }
      }
      async removeNode(nodeUri) {
        try {
          const result = this._removeNodeFromStructure(this._structure, nodeUri);
          if (result) {
            this._expandedFolders.delete(nodeUri);
            this._loadedFolders.delete(nodeUri);
            window.storage.store("files-structure", this._structure);
            window.storage.store(
              "files-expanded-folder",
              Array.from(this._expandedFolders)
            );
            this._refreshTree();
            return true;
          }
          return false;
        } catch (error) {
          return false;
        }
      }
      async renameNode(nodeUri, newName) {
        try {
          const node = this._findNodeByUri(this._structure, nodeUri);
          if (!node) {
            return false;
          }
          const oldName = node.name;
          node.name = newName;
          const pathParts = node.uri.split("/");
          pathParts[pathParts.length - 1] = newName;
          const newUri = pathParts.join("/");
          this._updateNodeUri(node, node.uri, newUri);
          if (this._expandedFolders.has(nodeUri)) {
            this._expandedFolders.delete(nodeUri);
            this._expandedFolders.add(newUri);
          }
          if (this._loadedFolders.has(nodeUri)) {
            this._loadedFolders.delete(nodeUri);
            this._loadedFolders.add(newUri);
          }
          window.storage.store("files-structure", this._structure);
          window.storage.store(
            "files-expanded-folder",
            Array.from(this._expandedFolders)
          );
          this._refreshTree();
          return true;
        } catch (error) {
          return false;
        }
      }
      async moveNode(sourceUri, targetParentUri) {
        try {
          const sourceNode = this._findNodeByUri(this._structure, sourceUri);
          const targetParent = this._findNodeByUri(
            this._structure,
            targetParentUri
          );
          if (!sourceNode || !targetParent || targetParent.type !== "folder") {
            return false;
          }
          if (!this._removeNodeFromStructure(this._structure, sourceUri)) {
            return false;
          }
          const newUri = `${targetParentUri}/${sourceNode.name}`;
          this._updateNodeUri(sourceNode, sourceUri, newUri);
          if (!targetParent.children) {
            targetParent.children = [];
          }
          targetParent.children.push(sourceNode);
          this._sortChildren(targetParent.children);
          if (this._expandedFolders.has(sourceUri)) {
            this._expandedFolders.delete(sourceUri);
            this._expandedFolders.add(newUri);
          }
          if (this._loadedFolders.has(sourceUri)) {
            this._loadedFolders.delete(sourceUri);
            this._loadedFolders.add(newUri);
          }
          window.storage.store("files-structure", this._structure);
          window.storage.store(
            "files-expanded-folder",
            Array.from(this._expandedFolders)
          );
          this._refreshTree();
          return true;
        } catch (error) {
          return false;
        }
      }
      _removeNodeFromStructure(node, targetUri) {
        if (!node.children) return false;
        for (let i = 0; i < node.children.length; i++) {
          if (node.children[i].uri === targetUri) {
            node.children.splice(i, 1);
            return true;
          }
          if (this._removeNodeFromStructure(node.children[i], targetUri)) {
            return true;
          }
        }
        return false;
      }
      _updateNodeUri(node, oldUri, newUri) {
        node.uri = newUri;
        if (node.children) {
          node.children.forEach((child) => {
            const childOldUri = child.uri;
            const childNewUri = child.uri.replace(oldUri, newUri);
            this._updateNodeUri(child, childOldUri, childNewUri);
          });
        }
      }
      _sortChildren(children) {
        children.sort((a, b) => {
          if (a.type === b.type) {
            return a.name.localeCompare(b.name);
          }
          return a.type === "folder" ? -1 : 1;
        });
      }
    };
  }
});

export {
  Files,
  init_workbench_layout_files
};
