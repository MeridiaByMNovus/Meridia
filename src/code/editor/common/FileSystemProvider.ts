import { IFolderStructure, TFolderTree } from "../../../typings/types.js";
import { store } from "../../workbench/common/store/store.js";
import { watch } from "../../workbench/common/store/selectors.js";

interface FileData {
  name: string;
  path: string;
  content: string;
}

class FileSystemCore {
  public folderStructure!: IFolderStructure;
  public filteredFiles!: TFolderTree[];
  public filteredFilesData: FileData[] = [];

  constructor() {}

  public loadFileStructure() {
    this.folderStructure = store.getState().main.folder_structure;

    watch(
      (s) => s.main.folder_structure,
      (next) => {
        this.folderStructure = next;
      }
    );
  }

  findPythonFiles(tree: TFolderTree[]): TFolderTree[] {
    const result: TFolderTree[] = [];

    for (const node of tree) {
      if (node.type === "file" && node.path.endsWith(".py")) {
        result.push(node);
      }

      if (node.type === "folder" && Array.isArray(node.children)) {
        result.push(...this.findPythonFiles(node.children));
      }
    }

    return result;
  }

  public filterPythonFiles() {
    this.filteredFiles = this.findPythonFiles(this.folderStructure.children);
  }

  public async getPythonFilesContent() {
    const results = await Promise.all(
      this.filteredFiles.map(async (file) => {
        const content = await window.electron.get_file_content(file.path);

        return {
          name: file.path.split(/[/\\]/).pop()!,
          path: file.path,
          content,
        };
      })
    );

    this.filteredFilesData = results;

    const paths = results.map((f) => f.path);
    window.electron.ipcRenderer.send("watch-python-files", paths);
  }
}

export class FileSystemProvider extends FileSystemCore {
  constructor() {
    super();

    this.loadFileStructure();
    this.filterPythonFiles();
  }
}
