import { IFolderStructure } from "../../../../typings/types.js";
import { FileTreeController } from "./common/FileTreeController.js";

export class FileTreeLayout {
  constructor(private fileTree: IFolderStructure) {}

  render() {
    return new FileTreeController(this.fileTree).render();
  }
}
