import {
  IFolderStructure,
  TFolderTree,
  ITab,
} from "../../../../../typings/types.js";
import { select } from "../../../common/store/selectors.js";
import { dispatch } from "../../../common/store/store.js";
import { update_editor_tabs } from "../../../common/store/mainSlice.js";
import { get_file_types } from "../../../common/functions.js";
import { getIconForFile } from "../../../service/IconService/IconService.js";
import { ContextMenuLayout } from "../contextmenuLayout.js";

type TreeNode = TFolderTree & { parent?: TreeNode | null };

const SVG_TEMPLATES = {
  chevronRight: `<svg viewBox="0 0 24 24" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M8.29289 4.29289C8.68342 3.90237 9.31658 3.90237 9.70711 4.29289L16.7071 11.2929C17.0976 11.6834 17.0976 12.3166 16.7071 12.7071L9.70711 19.7071C9.31658 20.0976 8.68342 20.0976 8.29289 19.7071C7.90237 19.3166 7.90237 18.6834 8.29289 18.2929L14.5858 12L8.29289 5.70711C7.90237 5.31658 7.90237 4.68342 8.29289 4.29289Z" fill="var(--file-tree-icon-foreground)"></path></svg>`,
  chevronDown: `<svg viewBox="0 0 24 24" fill="none" transform="rotate(90)"><path fill-rule="evenodd" clip-rule="evenodd" d="M8.29289 4.29289C8.68342 3.90237 9.31658 3.90237 9.70711 4.29289L16.7071 11.2929C17.0976 11.6834 17.0976 12.3166 16.7071 12.7071L9.70711 19.7071C9.31658 20.0976 8.68342 20.0976 8.29289 19.7071C7.90237 19.3166 7.90237 18.6834 8.29289 18.2929L14.5858 12L8.29289 5.70711C7.90237 5.31658 7.90237 4.68342 8.29289 4.29289Z" fill="var(--file-tree-icon-foreground)"></path></svg>`,
  folder: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--file-tree-icon-foreground)"><path d="M3 8.2C3 7.07989 3 6.51984 3.21799 6.09202C3.40973 5.71569 3.71569 5.40973 4.09202 5.21799C4.51984 5 5.0799 5 6.2 5H9.67452C10.1637 5 10.4083 5 10.6385 5.05526C10.8425 5.10425 11.0376 5.18506 11.2166 5.29472C11.4184 5.4184 11.5914 5.59135 11.9373 5.93726L12.0627 6.06274C12.4086 6.40865 12.5816 6.5816 12.7834 6.70528C12.9624 6.81494 13.1575 6.89575 13.3615 6.94474C13.5917 7 13.8363 7 14.3255 7H17.8C18.9201 7 19.4802 7 19.908 7.21799C20.2843 7.40973 20.5903 7.71569 20.782 8.09202C21 8.51984 21 9.0799 21 10.2V15.8C21 16.9201 21 17.4802 20.782 17.908C20.5903 18.2843 20.2843 18.5903 19.908 18.782C19.4802 19 18.9201 19 17.8 19H6.2C5.07989 19 4.51984 19 4.09202 18.782C3.71569 18.5903 3.40973 18.2843 3.21799 17.908C3 17.4802 3 16.9201 3 15.8V8.2Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

export class FileTreeController {
  private contextMenu: ContextMenuLayout | null = null;
  private clipboard: TreeNode | null = null;
  private isDragging = false;
  private draggedNode: TreeNode | null = null;
  private expandTimers = new Map<string, number>();
  private loadedFolders = new Set<string>();

  constructor(private fileTree: IFolderStructure) {
    this.initializeParents();

    const changeQueue: { path: string; isFolder: boolean }[] = [];
    let debounceTimer: any;

    window.electron.ipcRenderer.on(
      "folder-updated",
      (_: any, data: { path: string; isFolder: boolean }) => {
        changeQueue.push(data);

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          const seen = new Set<string>();
          const batch = [...changeQueue];
          changeQueue.length = 0;

          for (const item of batch) {
            if (seen.has(item.path)) continue;
            seen.add(item.path);
            handleFolderUpdate(item);
          }
        }, 50);
      }
    );

    const handleFolderUpdate = (data: { path: string; isFolder: boolean }) => {
      const parentPath = data.path.substring(0, data.path.lastIndexOf("\\"));
      let parent = this.findNodeByPath(parentPath);

      if (parentPath === this.fileTree.root && !parent) {
        parent = {
          ...(this.fileTree as any),
          path: this.fileTree.root,
          parentPath: null,
          parent: null,
        } as TreeNode;
      }

      if (!parent) return;

      const name = data.path.split("\\").pop() || "unknown";
      const type = data.isFolder ? "folder" : "file";

      const exists = parent.children?.some((c) => c.path === data.path);
      if (exists) return;

      const newNode: TreeNode = {
        id: Date.now(),
        name,
        path: data.path,
        parentPath,
        type,
        children: type === "folder" ? [] : undefined,
        parent,
      };

      (parent.children ||= []).push(newNode);

      const childrenWrapper = document.querySelector(
        `[data-path="${CSS.escape(parent.path)}"] .filetree-children`
      ) as HTMLElement;

      if (childrenWrapper) {
        this.renderNode(newNode, childrenWrapper);
        this.sortChildrenInDOM(childrenWrapper);
      }
    };
  }

  private initializeParents() {
    const assignParents = (
      nodes: TreeNode[],
      parent: TreeNode | null = null
    ) => {
      nodes.forEach((node) => {
        node.parent = parent;
        if (node.type === "folder" && node.children) {
          assignParents(node.children as TreeNode[], node);
        }
      });
    };

    const rootNode: TreeNode = {
      id: this.fileTree.id,
      name: this.fileTree.name,
      parentPath: "",
      path: this.fileTree.root,
      children: this.fileTree.children,
      type: "folder",
      parent: null,
    };

    assignParents(rootNode.children as TreeNode[], rootNode);
  }

  private sortChildren = (children: TFolderTree[]) => {
    return children.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
  };

  private async openInEditor(node: TFolderTree) {
    const tabs = select((s) => s.main.editor_tabs) || [];
    const existingTab = tabs.find((t) => t.uri === node.path);

    if (existingTab) {
      dispatch(
        update_editor_tabs(
          tabs.map((t) => ({ ...t, active: t.uri === node.path }))
        )
      );
    } else {
      const editor_content = await window.electron.get_file_content(node.path);
      const newTab: ITab = {
        id: Date.now(),
        fileIcon: node.name,
        name: node.name,
        active: true,
        uri: node.path,
        is_touched: false,
        editorContent: editor_content,
      };
      dispatch(
        update_editor_tabs([
          ...tabs.map((t) => ({ ...t, active: false })),
          newTab,
        ])
      );
    }
  }

  private createInput(placeholder: string, initialValue = "") {
    const input = document.createElement("input");
    input.className = "filetree-inline-input";
    input.value = initialValue;
    input.placeholder = placeholder;
    input.draggable = false;
    return input;
  }

  private setupInputEvents(
    input: HTMLInputElement,
    onCommit: () => Promise<void>,
    onCancel: () => void
  ) {
    let isHandled = false;

    const handleKeydown = (e: KeyboardEvent) => {
      if (isHandled) return;
      e.stopPropagation();
      if (e.key === "Enter") {
        isHandled = true;
        onCommit();
      } else if (e.key === "Escape") {
        isHandled = true;
        onCancel();
      }
    };

    const handleBlur = () => {
      if (isHandled) return;
      isHandled = true;
      onCancel();
    };

    const stopPropagation = (e: Event) => e.stopPropagation();

    input.addEventListener("keydown", handleKeydown, true);
    input.addEventListener("blur", handleBlur, true);
    input.addEventListener("mousedown", stopPropagation, true);
    input.addEventListener("click", stopPropagation, true);

    return () => {
      input.removeEventListener("keydown", handleKeydown, true);
      input.removeEventListener("blur", handleBlur, true);
      input.removeEventListener("mousedown", stopPropagation, true);
      input.removeEventListener("click", stopPropagation, true);
    };
  }

  private showRenameInput(node: TreeNode) {
    const wrapper = document.querySelector(
      `[data-path="${CSS.escape(node.path)}"]`
    ) as HTMLElement;
    if (!wrapper) return;

    const nameSpan = wrapper.querySelector(".filetree-name") as HTMLElement;
    const label = wrapper.querySelector(".filetree-label") as HTMLElement;

    const input = this.createInput("", node.name);
    const originalDraggable = label.draggable;
    label.draggable = false;

    const cleanup = this.setupInputEvents(
      input,
      async () => {
        const newName = input.value.trim();
        if (newName && newName !== node.name) {
          const result = await window.electron.ipcRenderer.invoke("fs-rename", {
            oldPath: node.path,
            newName,
          });

          const oldPath = node.path;
          node.name = newName;
          node.path = result.path;

          nameSpan.textContent = newName;
          wrapper.dataset.path = result.path;
          input.replaceWith(nameSpan);
        } else {
          input.replaceWith(nameSpan);
        }
        label.draggable = originalDraggable;
        cleanup();
      },
      () => {
        input.replaceWith(nameSpan);
        label.draggable = originalDraggable;
        cleanup();
      }
    );

    nameSpan.replaceWith(input);
    requestAnimationFrame(() => {
      input.focus();
      input.select();
    });
  }

  private showCreateInput(parent: TreeNode, type: "file" | "folder") {
    let childrenWrapper = document.querySelector(
      `[data-path="${CSS.escape(parent.path)}"] .filetree-children`
    ) as HTMLElement;

    if (!childrenWrapper) {
      const parentWrapper = document.querySelector(
        `[data-path="${CSS.escape(parent.path)}"]`
      ) as HTMLElement;
      childrenWrapper = document.createElement("div");
      childrenWrapper.className = "filetree-children";
      parentWrapper.appendChild(childrenWrapper);
    }

    childrenWrapper.style.display = "block";

    const tempNode = document.createElement("div");
    tempNode.className = "filetree-node editing";

    const label = document.createElement("div");
    label.className = "filetree-label";

    const input = this.createInput(
      type === "file" ? "new-file.ts" : "new-folder"
    );

    const cleanup = this.setupInputEvents(
      input,
      async () => {
        const name = input.value.trim();
        if (name) {
          const endpoint =
            type === "file" ? "fs-create-file" : "fs-create-folder";
          const newNode: TreeNode = await window.electron.ipcRenderer.invoke(
            endpoint,
            {
              parentPath: parent.path,
              name,
            }
          );

          newNode.parent = parent;
          (parent.children ||= []).push(newNode);

          if (tempNode.parentNode) {
            tempNode.remove();
            this.renderNode(newNode, childrenWrapper);
            this.sortChildrenInDOM(childrenWrapper);
          }
        } else {
          if (tempNode.parentNode) {
            tempNode.remove();
          }
        }
        cleanup();
      },
      () => {
        if (tempNode.parentNode) {
          tempNode.remove();
        }
        cleanup();
      }
    );

    label.appendChild(input);
    tempNode.appendChild(label);
    childrenWrapper.prepend(tempNode);

    requestAnimationFrame(() => input.focus());
  }

  private sortChildrenInDOM(container: HTMLElement) {
    const nodes = Array.from(container.children).filter(
      (child) => child instanceof HTMLElement
    ) as HTMLElement[];
    const sorted = nodes.sort((a, b) => {
      const aType = a.dataset.type;
      const bType = b.dataset.type;
      const aName =
        (a.querySelector(".filetree-name") as HTMLElement)?.textContent || "";
      const bName =
        (b.querySelector(".filetree-name") as HTMLElement)?.textContent || "";

      if (aType !== bType) return aType === "folder" ? -1 : 1;
      return aName.toLowerCase().localeCompare(bName.toLowerCase());
    });

    sorted.forEach((node) => container.appendChild(node));
  }

  private async deleteNode(node: TreeNode) {
    if (!confirm(`Delete "${node.name}"?`)) return;

    await window.electron.ipcRenderer.invoke("fs-delete", { path: node.path });

    const siblings = node.parent?.children || this.fileTree.children;
    const index = siblings.findIndex((c) => c.id === node.id);
    if (index > -1) siblings.splice(index, 1);

    const nodeElement = document.querySelector(
      `[data-path="${CSS.escape(node.path)}"]`
    );
    if (nodeElement && nodeElement.parentNode) {
      nodeElement.remove();
    }
  }

  private async moveNode(source: TreeNode, target: TreeNode) {
    try {
      if (this.isDescendant(target, source)) {
        return false;
      }

      if (source.parent?.path === target.path) {
        return false;
      }

      const result = await window.electron.ipcRenderer.invoke("fs-move", {
        src: source.path,
        destDir: target.path,
      });

      const siblings = source.parent?.children || this.fileTree.children;
      const index = siblings.findIndex((c) => c.id === source.id);
      if (index > -1) siblings.splice(index, 1);

      const oldPath = source.path;
      source.path = result.path;
      source.parent = target;

      if (target.type === "folder") {
        (target.children ||= []).push(source);
      } else {
        this.fileTree.children.push(source);
      }

      const sourceElement = document.querySelector(
        `[data-path="${CSS.escape(oldPath)}"]`
      ) as HTMLElement;

      if (sourceElement) {
        sourceElement.dataset.path = result.path;

        let targetContainer = document.querySelector(
          `[data-path="${CSS.escape(target.path)}"] .filetree-children`
        ) as HTMLElement;

        if (!targetContainer) {
          const targetElement = document.querySelector(
            `[data-path="${CSS.escape(target.path)}"]`
          ) as HTMLElement;
          if (targetElement) {
            targetContainer = document.createElement("div");
            targetContainer.className = "filetree-children";
            targetContainer.style.display = "block";
            targetElement.appendChild(targetContainer);
          }
        } else {
          targetContainer.style.display = "block";
        }

        if (targetContainer) {
          targetContainer.appendChild(sourceElement);
          this.sortChildrenInDOM(targetContainer);

          const targetToggle = document.querySelector(
            `[data-path="${CSS.escape(target.path)}"] .filetree-toggle`
          ) as HTMLElement;
          if (targetToggle && targetContainer.style.display === "block") {
            targetToggle.innerHTML = SVG_TEMPLATES.chevronDown;
          }
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  private isDescendant(target: TreeNode, ancestor: TreeNode): boolean {
    if (target.path === ancestor.path) return true;
    if (!target.parent) return false;
    return this.isDescendant(target.parent, ancestor);
  }

  private findNodeByPath(path: string): TreeNode | null {
    const search = (nodes: TreeNode[]): TreeNode | null => {
      for (const node of nodes) {
        if (node.path === path) return node;
        if (node.type === "folder" && node.children) {
          const found = search(node.children as TreeNode[]);
          if (found) return found;
        }
      }
      return null;
    };
    return search(this.fileTree.children as TreeNode[]);
  }

  private createContextMenu(e: MouseEvent, node: TreeNode) {
    e.preventDefault();
    this.contextMenu?.destroy();

    this.contextMenu = new ContextMenuLayout(
      { x: e.clientX, y: e.clientY },
      () => (this.contextMenu = null)
    );

    if (node.type === "folder") {
      this.contextMenu.createBtn("New File...", () =>
        this.showCreateInput(node, "file")
      );
      this.contextMenu.createBtn("New Folder...", () =>
        this.showCreateInput(node, "folder")
      );
      this.contextMenu.createSeparator();
    }

    this.contextMenu.createBtn("Rename...", () => this.showRenameInput(node));
    this.contextMenu.createBtn("Delete...", () => this.deleteNode(node));
    this.contextMenu.createSeparator();
    this.contextMenu.createBtn("Cut", () => (this.clipboard = node));

    if (node.type === "folder" && this.clipboard) {
      this.contextMenu.createBtn("Paste Here", async () => {
        if (this.clipboard) {
          const success = await this.moveNode(this.clipboard, node);
          if (success) {
            this.clipboard = null;
          }
        }
      });
    }
  }

  private async toggleFolder(
    node: TreeNode,
    childrenWrapper: HTMLElement,
    toggle: HTMLElement
  ) {
    const isOpen = childrenWrapper.style.display === "block";

    if (!isOpen && !this.loadedFolders.has(node.path)) {
      try {
        const children: TreeNode[] | undefined =
          await window.electron.ipcRenderer.invoke(
            "get-subfolder-data",
            node.path
          );

        if (!Array.isArray(children)) {
          return;
        }

        children.forEach((child) => (child.parent = node));
        node.children = children;

        childrenWrapper.innerHTML = "";
        this.sortChildren(children).forEach((child) =>
          this.renderNode(child as TreeNode, childrenWrapper)
        );

        this.loadedFolders.add(node.path);
      } catch (error) {
        return;
      }
    }

    childrenWrapper.style.display = isOpen ? "none" : "block";
    toggle.innerHTML = isOpen
      ? SVG_TEMPLATES.chevronRight
      : SVG_TEMPLATES.chevronDown;
  }

  private setupDragAndDrop(label: HTMLElement, node: TreeNode) {
    label.draggable = true;

    label.ondragstart = (e) => {
      this.isDragging = true;
      this.draggedNode = node;
      e.dataTransfer?.setData("text/plain", node.path);
      e.dataTransfer?.setData(
        "application/x-meridia-node",
        JSON.stringify({ path: node.path, id: node.id })
      );

      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setDragImage(label, 0, 0);
      }

      label.classList.add("dragging");
    };

    label.ondragend = () => {
      this.isDragging = false;
      this.draggedNode = null;
      label.classList.remove("dragging");

      document
        .querySelectorAll(".drop-target")
        .forEach((el) => el.classList.remove("drop-target"));
    };

    if (node.type === "folder") {
      label.ondragover = (e) => {
        if (!this.isDragging || !this.draggedNode) return;

        if (this.isDescendant(node, this.draggedNode)) {
          e.dataTransfer!.dropEffect = "none";
          return;
        }

        e.preventDefault();
        e.dataTransfer!.dropEffect = "move";
        label.classList.add("drop-target");

        const existingTimer = this.expandTimers.get(node.path);
        if (existingTimer) clearTimeout(existingTimer);

        this.expandTimers.set(
          node.path,
          window.setTimeout(async () => {
            const childrenWrapper =
              (label.parentElement?.querySelector(
                ".filetree-children"
              ) as HTMLElement) || null;
            const toggle =
              (label.querySelector(".filetree-toggle") as HTMLElement) || null;
            if (
              childrenWrapper &&
              toggle &&
              childrenWrapper.style.display !== "block"
            ) {
              await this.toggleFolder(node, childrenWrapper, toggle);
            }
          }, 800)
        );
      };

      label.ondragleave = (e) => {
        if (!label.contains(e.relatedTarget as Element)) {
          label.classList.remove("drop-target");
          const timer = this.expandTimers.get(node.path);
          if (timer) {
            clearTimeout(timer);
            this.expandTimers.delete(node.path);
          }
        }
      };

      label.ondrop = async (e) => {
        e.preventDefault();
        label.classList.remove("drop-target");

        const timer = this.expandTimers.get(node.path);
        if (timer) {
          clearTimeout(timer);
          this.expandTimers.delete(node.path);
        }

        const data = e.dataTransfer?.getData("application/x-meridia-node");
        if (!data || !this.draggedNode) return;

        try {
          const { path, id } = JSON.parse(data);
          const sourceNode = this.findNodeByPath(path);

          if (!sourceNode || sourceNode.path === node.path) return;
          if (this.isDescendant(node, sourceNode)) return;

          await this.moveNode(sourceNode, node);
        } catch (error) {}
      };
    }
  }

  public refresh() {
    const root = document.querySelector("#filetree-root") as HTMLElement;
    if (!root) return;
    root.innerHTML = "";
    root.appendChild(this.render());
  }

  public forceRefresh() {
    this.loadedFolders.clear();
    this.refresh();
  }

  public render() {
    const fragment = document.createElement("div");
    fragment.id = "filetree-root";
    const rootNode: TreeNode = {
      id: this.fileTree.id,
      name: this.fileTree.name,
      parentPath: "",
      path: this.fileTree.root,
      children: this.fileTree.children,
      type: "folder",
    };
    this.renderNode(rootNode, fragment);
    return fragment;
  }

  private renderNode(node: TreeNode, parent: ParentNode) {
    const wrapper = document.createElement("div");
    wrapper.className = "filetree-node";
    wrapper.dataset.path = node.path;
    wrapper.dataset.type = node.type;

    const label = document.createElement("div");
    label.className = "filetree-label";

    const toggle = document.createElement("span");
    toggle.className = "filetree-toggle";
    if (node.type === "folder") {
      toggle.innerHTML = SVG_TEMPLATES.chevronRight;
    }

    const icon = document.createElement("span");
    icon.className = "filetree-icon";
    if (node.type === "folder") {
      icon.innerHTML = SVG_TEMPLATES.folder;
    } else {
      const iconName = getIconForFile(node.name) ?? "file";
      icon.innerHTML = `<img src="./code/resources/assets/fileIcons/${iconName}" width="14" onerror="this.src='./code/resources/assets/fileIcons/default_file.svg'" />`;
    }

    const name = document.createElement("span");
    name.className = "filetree-name";
    name.textContent = node.name;

    label.append(toggle, icon, name);
    wrapper.appendChild(label);

    label.oncontextmenu = (e) => this.createContextMenu(e, node);
    this.setupDragAndDrop(label, node);

    if (node.type === "folder") {
      const childrenWrapper = document.createElement("div");
      childrenWrapper.className = "filetree-children";

      const isRoot = this.fileTree.root === node.path;

      childrenWrapper.style.display = isRoot ? "block" : "none";
      toggle.innerHTML = isRoot
        ? SVG_TEMPLATES.chevronDown
        : SVG_TEMPLATES.chevronRight;

      wrapper.appendChild(childrenWrapper);

      label.onclick = (e) => {
        if (!this.isDragging) {
          e.stopPropagation();
          this.toggleFolder(node, childrenWrapper, toggle);
        }
      };

      if (node.children && isRoot) {
        this.sortChildren(node.children).forEach((child) =>
          this.renderNode(child as TreeNode, childrenWrapper)
        );
        this.loadedFolders.add(node.path);
      }
    }

    if (node.type === "file") {
      label.onclick = () => {
        this.openInEditor(node);
      };
    }

    parent.appendChild(wrapper);
  }
}
