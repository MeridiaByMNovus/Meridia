import { update_editor_tabs } from "../../../common/store/mainSlice";
import { select } from "../../../common/store/selectors.js";
import { dispatch } from "../../../common/store/store.js";
import { EditorLayout } from "../../editorLayout.js";

export class EditorController {
  constructor(private item: EditorLayout) {
    this.initializeDropZone();
  }
  private setupDropZone() {
    if (!this.item.elementEl) return;

    this.item.elementEl.addEventListener(
      "dragenter",
      this.handleDragEnter.bind(this)
    );
    this.item.elementEl.addEventListener(
      "dragover",
      this.handleDragOver.bind(this)
    );
    this.item.elementEl.addEventListener(
      "dragleave",
      this.handleDragLeave.bind(this)
    );
    this.item.elementEl.addEventListener("drop", this.handleDrop.bind(this));
  }

  private handleDragEnter(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();

    const hasFileData = e.dataTransfer?.types.includes(
      "application/x-meridia-node"
    );

    if (hasFileData && this.item.elementEl) {
      this.item.elementEl.classList.add("drag-over");
      this.showDropIndicator(true);
    }
  }

  private handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();

    const hasFileData = e.dataTransfer?.types.includes(
      "application/x-meridia-node"
    );
    if (hasFileData && e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }
  }

  private handleDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!this.item.elementEl?.contains(e.relatedTarget as Node)) {
      this.item.elementEl?.classList.remove("drag-over");
      this.showDropIndicator(false);
    }
  }

  private async handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!this.item.elementEl) {
      return;
    }

    this.item.elementEl.classList.remove("drag-over");
    this.showDropIndicator(false);

    const nodeData = e.dataTransfer?.getData("application/x-meridia-node");

    if (!nodeData) {
      return;
    }

    try {
      const { path } = JSON.parse(nodeData);

      const fileExtension = path.split(".").pop()?.toLowerCase();
      if (!fileExtension || this.isDirectory(path)) {
        return;
      }

      await this.openFileInEditor(path);
    } catch (error) {}
  }

  private showDropIndicator(show: boolean) {
    if (!this.item.elementEl) return;

    const existingIndicator =
      this.item.elementEl.querySelector(".drop-indicator");

    if (show && !existingIndicator) {
      const indicator = document.createElement("div");
      indicator.className = "drop-indicator";
      indicator.innerHTML = `
        <div class="drop-indicator-content">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14,2 14,8 20,8"></polyline>
          </svg>
          <p>Drop file here to open</p>
        </div>
      `;
      this.item.elementEl.style.position = "relative";
      this.item.elementEl.appendChild(indicator);
    } else if (!show && existingIndicator) {
      existingIndicator.remove();
    }
  }

  private isDirectory(path: string): boolean {
    const lastSegment = path.split(/[/\\]/).pop() || "";
    const isDir = !lastSegment.includes(".");

    return isDir;
  }

  private async openFileInEditor(filePath: string) {
    try {
      const tabs = select((s: any) => s.main.editor_tabs) || [];

      const existingTab = tabs.find((t: any) => t.uri === filePath);
      if (existingTab) {
        const updatedTabs = tabs.map((t: any) => ({
          ...t,
          active: t.uri === filePath,
        }));
        dispatch(update_editor_tabs(updatedTabs));
      } else {
        const fileName = filePath.split(/[/\\]/).pop() || "untitled";

        let editorContent = "";
        try {
          if (window.electron?.get_file_content) {
            editorContent = await window.electron.get_file_content(filePath);
          }
        } catch (error) {}

        const newTab = {
          id: this.generateId(),
          fileIcon: fileName,
          name: fileName,
          active: true,
          uri: filePath,
          is_touched: false,
          editorContent: editorContent,
        };

        const updatedTabs = [
          ...tabs.map((t: any) => ({ ...t, active: false })),
          newTab,
        ];

        dispatch(update_editor_tabs(updatedTabs));
      }
    } catch (error) {
      try {
        window.dialog.showError({
          title: "Error opening file",
          content: `Could not open file: ${filePath}`,
        });
      } catch (e) {}
    }
  }

  private generateId(): string | number {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now();

    return id;
  }

  private initializeDropZone() {
    const element = this.item.getDomElement();
    if (element && !element.hasAttribute("data-drop-initialized")) {
      this.item.elementEl = element;
      this.setupDropZone();
      element.setAttribute("data-drop-initialized", "true");
    }
  }
}
