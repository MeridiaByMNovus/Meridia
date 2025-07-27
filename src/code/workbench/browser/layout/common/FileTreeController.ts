import {
  IFolderStructure,
  TFolderTree,
  IEditorTab,
} from "../../../../../typings/types.js";
import { select } from "../../../common/store/selectors.js";
import { dispatch } from "../../../common/store/store.js";
import { update_editor_tabs } from "../../../common/store/mainSlice.js";
import { get_file_types } from "../../../service/functions.js";
import { getIconForFile } from "../../../service/IconService/IconService.js";
import { ContextMenuLayout } from "../contextmenuLayout.js";

type Node = TFolderTree & { parent?: Node | null };

const safeReplace = (from: Element, to: Element) => {
  if (from.parentNode) from.replaceWith(to);
};

export class FileTreeController {
  private contextMenu: ContextMenuLayout | null = null;
  private clipboard: { node: Node | null } = { node: null };
  private isDragging = false;

  constructor(private fileTree: IFolderStructure) {
    (this.fileTree.children as Node[]).forEach((c) => (c.parent = null));
  }

  private sort(children: TFolderTree[]) {
    return [...children].sort((a, b) => {
      if (a.type === "folder" && b.type === "file") return -1;
      if (a.type === "file" && b.type === "folder") return 1;
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
  }

  private async openInEditor(node: TFolderTree) {
    const tabs = select((s) => s.main.editor_tabs) || [];
    const exists = tabs.find((t) => t.uri === node.path);
    const next = tabs.map((t) => ({ ...t, active: t.uri === node.path }));
    if (!exists) {
      const tab: IEditorTab = {
        icon: node.name,
        name: node.name,
        active: true,
        uri: node.path,
        language: get_file_types(node.name),
        initialContent: await window.electron.get_file_content(node.path),
        is_touched: false,
      };
      dispatch(update_editor_tabs([...next, tab]));
    } else {
      dispatch(update_editor_tabs(next));
    }
  }

  private showInlineInputRename(node: Node) {
    const wrapper = document.querySelector(
      `.filetree-node[data-path="${CSS.escape(node.path)}"]`
    ) as HTMLElement | null;
    if (!wrapper) return;

    const label = wrapper.querySelector(".filetree-label") as HTMLElement;
    const nameSpan = wrapper.querySelector(".filetree-name") as HTMLElement;

    const input = document.createElement("input");
    input.className = "filetree-inline-input";
    input.value = node.name;
    input.setAttribute("draggable", "false");

    const prevDraggable = label.draggable;
    label.draggable = false;
    const stop = (e: Event) => e.stopPropagation();
    label.addEventListener("click", stop, true);
    label.addEventListener("mousedown", stop, true);

    safeReplace(nameSpan, input);

    setTimeout(() => {
      input.focus();
      input.select();
    }, 0);

    const cleanup = () => {
      label.draggable = prevDraggable;
      label.removeEventListener("click", stop, true);
      label.removeEventListener("mousedown", stop, true);
    };

    const commit = async () => {
      const newName = input.value.trim();
      if (!newName || newName === node.name) {
        safeReplace(input, nameSpan);
        cleanup();
        return;
      }
      const updated: { path: string } =
        await window.electron.ipcRenderer.invoke("fs-rename", {
          oldPath: node.path,
          newName,
        });
      node.name = newName;
      node.path = updated.path;
      cleanup();
      this.refresh();
    };

    const cancel = () => {
      safeReplace(input, nameSpan);
      cleanup();
    };

    input.addEventListener(
      "keydown",
      (e) => {
        e.stopPropagation();
        if (e.key === "Enter") commit();
        if (e.key === "Escape") cancel();
      },
      true
    );

    input.addEventListener("mousedown", stop, true);
    input.addEventListener("click", stop, true);
    input.addEventListener("blur", cancel, true);
  }

  private ensureChildrenWrapper(parent: Node) {
    const pw = document.querySelector(
      `.filetree-node[data-path="${CSS.escape(parent.path)}"]`
    ) as HTMLElement | null;
    if (!pw) return null;
    let cw = pw.querySelector(".filetree-children") as HTMLDivElement | null;
    if (!cw) {
      cw = document.createElement("div");
      cw.className = "filetree-children";
      cw.style.display = "block";
      pw.appendChild(cw);
    } else {
      cw.style.display = "block";
    }
    return cw;
  }

  private showInlineInputCreate(parent: Node, kind: "file" | "folder") {
    const cw = this.ensureChildrenWrapper(parent);
    if (!cw) return;

    const temp = document.createElement("div");
    temp.className = "filetree-node editing";

    const label = document.createElement("div");
    label.className = "filetree-label";
    const prevDraggable = label.draggable;
    label.draggable = false;

    const input = document.createElement("input");
    input.className = "filetree-inline-input";
    input.placeholder = kind === "file" ? "new-file.ts" : "new-folder";
    input.setAttribute("draggable", "false");

    const stop = (e: Event) => e.stopPropagation();
    label.addEventListener("click", stop, true);
    label.addEventListener("mousedown", stop, true);
    input.addEventListener("mousedown", stop, true);
    input.addEventListener("click", stop, true);

    label.appendChild(input);
    temp.appendChild(label);
    cw.prepend(temp);

    setTimeout(() => input.focus(), 0);

    const cleanup = () => {
      label.draggable = prevDraggable;
      label.removeEventListener("click", stop, true);
      label.removeEventListener("mousedown", stop, true);
    };

    const commit = async () => {
      const name = input.value.trim();
      if (!name) {
        cleanup();
        temp.remove();
        return;
      }
      if (kind === "file") {
        const data: Node = await window.electron.ipcRenderer.invoke(
          "fs-create-file",
          { parentPath: parent.path, name }
        );
        data.parent = parent;
        (parent.children ||= []).push(data);
      } else {
        const data: Node = await window.electron.ipcRenderer.invoke(
          "fs-create-folder",
          { parentPath: parent.path, name }
        );
        data.parent = parent;
        (parent.children ||= []).push(data);
      }
      cleanup();
      this.refresh();
    };

    const cancel = () => {
      cleanup();
      temp.remove();
    };

    input.addEventListener(
      "keydown",
      (e) => {
        e.stopPropagation();
        if (e.key === "Enter") commit();
        if (e.key === "Escape") cancel();
      },
      true
    );

    input.addEventListener("blur", cancel, true);
  }

  private async deleteNode(node: Node) {
    const ok = confirm(`Delete "${node.name}"?`);
    if (!ok) return;
    await window.electron.ipcRenderer.invoke("fs-delete", { path: node.path });
    if (node.parent) {
      node.parent.children = (node.parent.children || []).filter(
        (c) => c.id !== node.id
      );
    } else {
      this.fileTree.children = this.fileTree.children.filter(
        (c) => c.id !== node.id
      );
    }
    this.refresh();
  }

  private async moveNode(node: Node, targetFolderPath: string) {
    const res: { path: string; parentPath: string } =
      await window.electron.ipcRenderer.invoke("fs-move", {
        src: node.path,
        destDir: targetFolderPath,
      });
    if (node.parent) {
      node.parent.children = (node.parent.children || []).filter(
        (c) => c.id !== node.id
      );
    } else {
      this.fileTree.children = this.fileTree.children.filter(
        (c) => c.id !== node.id
      );
    }
    const target = await this.findByPath(targetFolderPath);
    node.path = res.path;
    node.parentPath = res.parentPath;
    node.parent = target || null;
    if (target && target.type === "folder") {
      (target.children ||= []).push(node);
    } else {
      this.fileTree.children.push(node);
    }
    this.refresh();
  }

  private async findByPath(path: string): Promise<Node | null> {
    const walk = (nodes: Node[]): Node | null => {
      for (const n of nodes) {
        if (n.path === path) return n;
        if (n.type === "folder" && n.children) {
          const r = walk(n.children as Node[]);
          if (r) return r;
        }
      }
      return null;
    };
    return walk(this.fileTree.children as Node[]);
  }

  private refresh() {
    const root = document.querySelector("#filetree-root") as HTMLElement | null;
    if (!root) return;
    root.innerHTML = "";
    root.appendChild(this.render());
  }

  public render() {
    const fragment = document.createDocumentFragment();
    this.sort(this.fileTree.children).forEach((child) =>
      this.renderNode(child as Node, fragment as unknown as HTMLElement)
    );
    return fragment;
  }

  private renderNode(node: Node, parent: HTMLElement) {
    const nodeWrapper = document.createElement("div");
    nodeWrapper.className = "filetree-node";
    nodeWrapper.dataset.path = node.path;
    nodeWrapper.dataset.type = node.type;

    const label = document.createElement("div");
    label.className = "filetree-label";
    label.draggable = true;

    const toggle = document.createElement("span");
    toggle.className = "filetree-toggle";
    toggle.innerHTML =
      node.type === "folder"
        ? `<svg viewBox="0 0 24 24"><path d="M9 6L15 12L9 18" stroke="#ccc" stroke-width="2"/></svg>`
        : ``;

    const icon = document.createElement("span");
    icon.className = "filetree-icon";
    if (node.type === "folder") {
      icon.innerHTML = `
<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#d2d2d2">
  <path d="M3 8.2C3 7.07989 3 6.51984 3.21799 6.09202C3.40973 5.71569 3.71569 5.40973 4.09202 5.21799C4.51984 5 5.0799 5 6.2 5H9.67452C10.1637 5 10.4083 5 10.6385 5.05526C10.8425 5.10425 11.0376 5.18506 11.2166 5.29472C11.4184 5.4184 11.5914 5.59135 11.9373 5.93726L12.0627 6.06274C12.4086 6.40865 12.5816 6.5816 12.7834 6.70528C12.9624 6.81494 13.1575 6.89575 13.3615 6.94474C13.5917 7 13.8363 7 14.3255 7H17.8C18.9201 7 19.4802 7 19.908 7.21799C20.2843 7.40973 20.5903 7.71569 20.782 8.09202C21 8.51984 21 9.0799 21 10.2V15.8C21 16.9201 21 17.4802 20.782 17.908C20.5903 18.2843 20.2843 18.5903 19.908 18.782C19.4802 19 18.9201 19 17.8 19H6.2C5.07989 19 4.51984 19 4.09202 18.782C3.71569 18.5903 3.40973 18.2843 3.21799 17.908C3 17.4802 3 16.9201 3 15.8V8.2Z" stroke="#d2d2d2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
    } else {
      const iconName = getIconForFile(node.name) ?? "file";
      icon.innerHTML = `<img src="./code/contrib/assets/fileIcons/${iconName}" width="14" />`;
    }

    const name = document.createElement("span");
    name.className = "filetree-name";
    name.textContent = node.name;

    label.appendChild(toggle);
    label.appendChild(icon);
    label.appendChild(name);
    nodeWrapper.appendChild(label);
    parent.appendChild(nodeWrapper);

    let childrenWrapper: HTMLDivElement | null = null;
    let isLoaded = false;
    let hoverExpandTimer: number | null = null;

    label.oncontextmenu = (e) => {
      e.preventDefault();
      this.contextMenu?.destroy();
      this.contextMenu = new ContextMenuLayout(
        { x: e.clientX, y: e.clientY },
        () => (this.contextMenu = null)
      );

      if (node.type === "folder") {
        this.contextMenu.createBtn("New File...", () =>
          this.showInlineInputCreate(node, "file")
        );
        this.contextMenu.createBtn("New Folder...", () =>
          this.showInlineInputCreate(node, "folder")
        );
        this.contextMenu.createSeparator();
        this.contextMenu.createBtn("Rename...", () =>
          this.showInlineInputRename(node)
        );
        this.contextMenu.createBtn("Delete...", () => this.deleteNode(node));
        this.contextMenu.createSeparator();
        this.contextMenu.createBtn("Cut", () => (this.clipboard.node = node));
        this.contextMenu.createBtn("Paste Here", async () => {
          if (!this.clipboard.node) return;
          await this.moveNode(this.clipboard.node, node.path);
          this.clipboard.node = null;
        });
      } else {
        this.contextMenu.createBtn("Rename...", () =>
          this.showInlineInputRename(node)
        );
        this.contextMenu.createBtn("Delete...", () => this.deleteNode(node));
        this.contextMenu.createSeparator();
        this.contextMenu.createBtn("Cut", () => (this.clipboard.node = node));
      }
    };

    label.ondragstart = (e) => {
      this.isDragging = true;
      e.dataTransfer?.setData(
        "application/x-meridia-node",
        JSON.stringify({ path: node.path })
      );
      e.dataTransfer?.setDragImage(label, 0, 0);
    };

    label.ondragend = () => {
      this.isDragging = false;
    };

    if (node.type === "folder") {
      label.ondragover = (e) => {
        if (!this.isDragging) return;
        e.preventDefault();
        label.classList.add("drop-target");
        if (!isLoaded && childrenWrapper?.style.display !== "block") {
          if (hoverExpandTimer) window.clearTimeout(hoverExpandTimer);
          hoverExpandTimer = window.setTimeout(async () => {
            if (!isLoaded) {
              const result: Node[] = await window.electron.ipcRenderer.invoke(
                "get-subfolder-data",
                node.path
              );
              result.forEach((c) => (c.parent = node));
              this.sort(result).forEach((child) =>
                this.renderNode(child, childrenWrapper!)
              );
              isLoaded = true;
            }
            childrenWrapper!.style.display = "block";
            toggle.innerHTML = `<svg viewBox="0 0 24 24" transform="rotate(90)"><path d="M9 6L15 12L9 18" stroke="#ccc" stroke-width="2"/></svg>`;
          }, 400);
        }
      };

      label.ondragleave = () => {
        label.classList.remove("drop-target");
        if (hoverExpandTimer) window.clearTimeout(hoverExpandTimer);
      };

      label.ondrop = async (e) => {
        e.preventDefault();
        label.classList.remove("drop-target");
        const data = e.dataTransfer?.getData("application/x-meridia-node");
        if (!data) return;
        const { path } = JSON.parse(data);
        const src = await this.findByPath(path);
        if (!src || src.path === node.path) return;
        await this.moveNode(src, node.path);
      };
    }

    if (node.type === "folder") {
      childrenWrapper = document.createElement("div");
      childrenWrapper.className = "filetree-children";
      childrenWrapper.style.display = "none";
      nodeWrapper.appendChild(childrenWrapper);

      label.onclick = async () => {
        if (this.isDragging) return;
        const isOpen = childrenWrapper!.style.display === "block";
        if (!isOpen && !isLoaded) {
          const result: Node[] = await window.electron.ipcRenderer.invoke(
            "get-subfolder-data",
            node.path
          );
          result.forEach((c) => (c.parent = node));
          this.sort(result).forEach((child) =>
            this.renderNode(child, childrenWrapper!)
          );
          isLoaded = true;
        }
        childrenWrapper!.style.display = isOpen ? "none" : "block";
        toggle.innerHTML = isOpen
          ? `<svg viewBox="0 0 24 24"><path d="M9 6L15 12L9 18" stroke="#ccc" stroke-width="2"/></svg>`
          : `<svg viewBox="0 0 24 24" transform="rotate(90)"><path d="M9 6L15 12L9 18" stroke="#ccc" stroke-width="2"/></svg>`;
      };
    }

    if (node.type === "file") {
      name.onclick = () => this.openInEditor(node);
    }
  }
}
