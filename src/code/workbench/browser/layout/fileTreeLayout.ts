import { IFolderStructure } from "../../../../typings/types.js";
import { FileTreeController } from "./common/controller/FileTreeController.js";
import { ElementCore } from "./elementCore.js";

export class FileTreeLayout extends ElementCore {
  constructor(private fileTree: IFolderStructure) {
    super();
  }

  render() {
    return new FileTreeController(this.fileTree).render();
  }
}
