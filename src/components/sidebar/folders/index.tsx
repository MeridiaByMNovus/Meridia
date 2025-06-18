import React, { useEffect } from "react";
import PerfectScrollbar from "react-perfect-scrollbar";
import { CloseOutlined } from "@ant-design/icons/lib";
import { useAppDispatch, useAppSelector } from "../../../helpers/hooks";
import { MainContext, path_join } from "../../../helpers/functions";
import {
  update_active_file,
  update_active_files,
  update_sidebar_active,
} from "../../../helpers/state-manager";
import { IFolderStructure, TActiveFile } from "../../../helpers/types";
import { store } from "../../../helpers/store";
import useTree from "../../../hooks/use-file-tree";
import Tooltip from "../../../../support/ui-kit/tooltip/Tooltip";
import FileTree from "./fileTree";

const Folders = React.memo((props: any) => {
  const folder_structure = useAppSelector(
    (state) => state.main.folder_structure
  );

  const dispatch = useAppDispatch();

  const useMainContextIn = React.useContext(MainContext);

  const active_files = useAppSelector((state) => state.main.active_files);

  const [fileTreeData, setFileTree] = React.useState<IFolderStructure | null>(
    folder_structure
  );

  useEffect(() => {
    if (!folder_structure || Object.keys(folder_structure).length === 0) {
      console.warn(
        "Folder structure is empty, initializing default structure."
      );
    } else {
      setFileTree(sortFolderStructure(folder_structure));

      window.electron.set_folder_structure(folder_structure);
    }
  }, [folder_structure]);

  const { insertNode, deleteNode, updateNode } = useTree();

  const handle_set_editor = React.useCallback(
    async (branch_name: string, full_path: string) => {
      console.log("branch", branch_name, full_path);
      const get_file_content =
        await window.electron.get_file_content(full_path);
      const active_file: TActiveFile = {
        icon: "",
        path: full_path,
        name: branch_name,
        is_touched: false,
        content: get_file_content,
      };

      const selected_file = {
        name: branch_name,
        path: full_path,
        content: get_file_content,
      };

      if (
        store
          .getState()
          .main.active_files.findIndex((file) => file.path == full_path) == -1
      ) {
        store.dispatch(
          update_active_files([
            ...store.getState().main.active_files,
            active_file,
          ])
        );
      }

      dispatch(update_active_file(active_file));

      setTimeout(() => {
        useMainContextIn.handle_set_editor(selected_file);
      }, 0);
    },
    [active_files]
  );

  useEffect(() => {
    window.electron.ipcRenderer.on("new-file-tab", () => {
      console.log("new file");
      const randomFilePath = `/untitled.py`;
      handle_set_editor("Untitled.py", randomFilePath);
    });

    window.electron.ipcRenderer.on(
      "new-file-opened",
      (e: any, data: { path: string; fileName: string }) => {
        console.log("open file", data);
        handle_set_editor(data.fileName, data.path);
      }
    );
  }, []);

  useEffect(() => {
    if (
      !fileTreeData ||
      (Array.isArray(fileTreeData) && fileTreeData.length === 0)
    ) {
      const newFolder: any = {
        id: Date.now(),
        type: "folder",
        name: "welcome",
        children: [],
      };
      setFileTree(newFolder);
    }
  }, [fileTreeData]);

  const handleRename = (
    id: any,
    newName: any,
    path: string,
    containingFolder: string
  ) => {
    setFileTree(sortFolderStructure(updateNode(fileTreeData, id, newName)));

    window.electron.rename({
      newName: newName,
      path: path,
      rootPath: fileTreeData.root,
      containingFolder: containingFolder,
    });

    dispatch(
      update_active_files(
        active_files.map((tab) =>
          tab.path === path ? { ...tab, name: newName } : tab
        )
      )
    );

    window.electron.set_folder_structure(
      sortFolderStructure(
        sortFolderStructure(updateNode(fileTreeData, id, newName))
      )
    );
  };

  const handleDelete = (id: any, type: string, path: string) => {
    const updatedTree = deleteNode(fileTreeData, id);
    setFileTree(sortFolderStructure(updatedTree));

    if (type === "folder") {
      window.electron.delete_folder({
        path: path,
        rootPath: fileTreeData.root,
      });
    } else {
      window.electron.delete_file({
        path: path,
        rootPath: fileTreeData.root,
      });
    }
    window.electron.set_folder_structure(sortFolderStructure(updatedTree));
  };
  const handleAddFile = (
    parentId: any,
    fileName: string,
    dirPath: string,
    containingFolder: string
  ) => {
    const newFile = {
      id: Date.now(),
      type: "file",
      name: fileName,
      path: path_join([dirPath, fileName]),
      containingFolderPath: containingFolder,
    };

    // Recursive function to check if a file exists anywhere in the tree
    const fileExistsInTree = (node: any): boolean => {
      if (path_join([node.path, node.name]) === newFile.path) {
        return true;
      }
      return node.children?.some(fileExistsInTree) ?? false;
    };

    if (fileExistsInTree(fileTreeData)) {
      window.electron.ipcRenderer.send("show-warning", {
        title: "File Already Exists",
        message: `A file with the name "${fileName}" already exists in this directory.`,
      });
      return;
    }

    const updatedTree = sortFolderStructure(
      insertNode(fileTreeData, parentId, newFile)
    );
    setFileTree(updatedTree);

    window.electron.create_file({
      path: newFile.path,
      fileName: newFile.name,
      rootPath: fileTreeData.root,
    });

    window.electron.set_folder_structure(updatedTree);
  };

  const handleAddFolder = (
    parentId: any,
    folderName: any,
    path: string,
    contaningFolder: string
  ) => {
    const newFolder: any = {
      id: Date.now(),
      type: "folder",
      name: folderName,
      path: path_join([path, folderName]),
      containingFolderPath: contaningFolder,
      children: [],
    };

    console.log("data", newFolder);

    setFileTree(
      sortFolderStructure(insertNode(fileTreeData, parentId, newFolder))
    );
    window.electron.create_folder({
      path: newFolder.path,
      fileName: newFolder.name,
      rootPath: fileTreeData.root,
    });

    window.electron.set_folder_structure(
      sortFolderStructure(insertNode(fileTreeData, parentId, newFolder))
    );
  };

  const sortFolderStructure: any = (folder_structure: any) => {
    if (!folder_structure.children) return folder_structure;

    return {
      ...folder_structure,
      children: [...folder_structure.children]
        .sort((a: any, b: any) => {
          if (a.type === "folder" && b.type !== "folder") return -1;
          if (a.type !== "folder" && b.type === "folder") return 1;
          return a.name.localeCompare(b.name);
        })
        .map((child: any) =>
          child.type === "folder" ? sortFolderStructure(child) : child
        ),
    };
  };

  return (
    <div className="folder-tree">
      <div className="folders-content-wrapper">
        <div className="content-list-outer-container">
          <div className="title">
            <p>FOLDERS</p>
            <Tooltip text="Hide" position="left">
              <button onClick={() => dispatch(update_sidebar_active(false))}>
                <CloseOutlined />
              </button>
            </Tooltip>
          </div>
          <FileTree
            handleDelete={handleDelete}
            handleAddFile={handleAddFile}
            handleAddFolder={handleAddFolder}
            handleRename={handleRename}
            fileTree={fileTreeData}
            onFileClick={handle_set_editor}
          />
        </div>
      </div>
    </div>
  );
});

export default Folders;
