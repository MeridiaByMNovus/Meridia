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
import { ContextMenuLayout } from "../../contextmenuLayout.js";
import {
  chevronDownIcon,
  chevronRightIcon,
  folderIcon,
} from "../../../common/svgIcons.js";

type TreeNode = TFolderTree & { parent?: TreeNode | null };

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

    window.ipc.on(
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
      const parentPath = window.path.dirname(data.path);
      const fileName = window.path.basename(data.path);

      let parent = this.findNodeByPath(parentPath);

      if (!parent && parentPath === this.fileTree.root) {
        parent = {
          ...(this.fileTree as any),
          path: this.fileTree.root,
          parentPath: null,
          parent: null,
        } as TreeNode;
      }

      if (!parent) {
        return;
      }

      const type = data.isFolder ? "folder" : "file";

      const exists = parent.children?.some((c) => c.path === data.path);
      if (exists) {
        return;
      }

      const newNode: TreeNode = {
        id: Date.now() + Math.random(),
        name: fileName,
        path: data.path,
        parentPath,
        type,
        children: type === "folder" ? [] : undefined,
        parent,
      };

      (parent.children ||= []).push(newNode);

      const parentSelector = `[data-path="${CSS.escape(parent.path)}"]`;
      let childrenWrapper = document.querySelector(
        `${parentSelector} .filetree-children`
      ) as HTMLElement;

      if (!childrenWrapper) {
        const parentWrapper = document.querySelector(
          parentSelector
        ) as HTMLElement;
        if (parentWrapper) {
          childrenWrapper = document.createElement("div");
          childrenWrapper.className = "filetree-children";
          childrenWrapper.style.display = "block";
          parentWrapper.appendChild(childrenWrapper);

          const toggle = parentWrapper.querySelector(
            ".filetree-toggle"
          ) as HTMLElement;
          if (toggle) {
            toggle.innerHTML = chevronDownIcon;
          }
        } else {
          return;
        }
      }

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
      const editor_content = await window.filesystem.get_file_content(
        node.path
      );
      const newTab: ITab = {
        id: Date.now(),
        fileIcon: node.name,
        name: node.name,
        active: true,
        uri: node.path,
        is_touched: false,
        editorContent: editor_content,
        language: get_file_types(node.name),
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
          const result = await window.ipc.invoke("fs-rename", {
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
          const newNode: TreeNode = await window.ipc.invoke(endpoint, {
            parentPath: parent.path,
            name,
          });

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

    await window.ipc.invoke("fs-delete", { path: node.path });

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

      const result = await window.ipc.invoke("fs-move", {
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
            targetToggle.innerHTML = chevronDownIcon;
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
        const children: TreeNode[] | undefined = await window.ipc.invoke(
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
    toggle.innerHTML = isOpen ? chevronRightIcon : chevronDownIcon;
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
    root.style.overflow = "hidden";
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

    if (this.fileTree.root) {
      const fullPath = this.fileTree.name.replace(/\/$/, "").replace(/\\$/, "");

      const parts = fullPath.split(/[/\\]/);
      const lastFolderName = parts.pop();

      const rootNode: TreeNode = {
        id: this.fileTree.id,
        name: lastFolderName as string,
        parentPath: "",
        path: this.fileTree.root,
        children: this.fileTree.children,
        type: "folder",
      };
      this.renderNode(rootNode, fragment);
    } else {
      const defaultContent = document.createElement("div");
      defaultContent.className = "filetree-default-content";

      const selectFolderText = document.createElement("button");
      selectFolderText.className = "filetree-select-folder-text";
      selectFolderText.textContent = "Select a folder to start exploring";

      const selectFolderButton = document.createElement("button");
      selectFolderButton.className = "filetree-select-folder";
      selectFolderButton.textContent = "Select Folder";
      selectFolderButton.onclick = () => {
        window.folder.open_set_folder();
      };

      defaultContent.appendChild(selectFolderText);
      defaultContent.appendChild(selectFolderButton);
      fragment.appendChild(defaultContent);
    }

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
      toggle.innerHTML = chevronRightIcon;
    }

    const icon = document.createElement("span");
    icon.className = "filetree-icon";
    if (node.type === "folder") {
      icon.innerHTML = folderIcon;
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
      toggle.innerHTML = isRoot ? chevronDownIcon : chevronRightIcon;

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
