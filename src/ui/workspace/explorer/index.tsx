import React, { useEffect, useState, useCallback, useMemo } from "react";
import useTree from "../../../hooks/use-file-tree";
import { useAppDispatch, useAppSelector } from "../../../helpers/hooks";
import { MainContext, path_join } from "../../../helpers/functions";
import {
  update_active_file,
  update_active_files,
  update_simple_tab,
} from "../../../helpers/state_manager";
import {
  IFolderStructure,
  TActiveFile,
  TFolderTree,
} from "../../../helpers/types";
import { ExplorerComponent } from "./explorer";
import debounce from "lodash.debounce";
import isEqual from "fast-deep-equal";

export const Explorer = React.memo(function Explorer(props: any) {
  const folder_structure = useAppSelector(
    (state) => state.main.folder_structure
  );
  const active_files = useAppSelector((state) => state.main.active_files);
  const dispatch = useAppDispatch();
  const useMainContextIn = React.useContext(MainContext);

  const [fileTreeData, setFileTree] = useState<IFolderStructure | null>(null);
  const { insertNode, deleteNode, updateNode } = useTree();

  const isImage = (path: string) =>
    /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico|tiff?|avif|jfif|pjpe?g)$/i.test(path);

  const sortFolderStructure = useCallback((node: TFolderTree): TFolderTree => {
    if (!node?.children?.length) return node;

    const sortedChildren = [...node.children]
      .sort((a, b) => {
        if (a.type === "folder" && b.type !== "folder") return -1;
        if (a.type !== "folder" && b.type === "folder") return 1;
        return a.name.localeCompare(b.name);
      })
      .map(sortFolderStructure);

    const unchanged = node.children.every((c, i) => c === sortedChildren[i]);
    return unchanged ? node : { ...node, children: sortedChildren };
  }, []);

  const syncFolderToMain = useMemo(
    () =>
      debounce(
        (fs: IFolderStructure) => window.electron.set_folder_structure(fs),
        300
      ),
    []
  );

  useEffect(() => {
    if (!folder_structure || Object.keys(folder_structure).length === 0) {
      console.warn("Folder structure is empty.");
      return;
    }

    const sorted: any = sortFolderStructure(folder_structure);
    if (!isEqual(fileTreeData, sorted)) {
      setFileTree(sorted);
      syncFolderToMain(sorted);
    }
  }, [folder_structure]);

  useEffect(() => {
    async function getFolderTree() {
      const newFolder = await window.electron.get_folder();
      setFileTree(newFolder);
    }

    if (!fileTreeData) {
      getFolderTree();
    }
  }, [fileTreeData]);

  const handle_set_editor = useCallback(
    async (branch_name: string, full_path: string) => {
      if (isImage(full_path)) {
        useMainContextIn.handle_set_tab({
          id: full_path,
          name: branch_name,
          icon: full_path,
          component: "imageViewer",
          props: { path: full_path },
        });
        return;
      }

      dispatch(update_simple_tab(null));
      const get_file_content =
        await window.electron.get_file_content(full_path);

      const active_file: TActiveFile = {
        icon: "",
        path: full_path,
        name: branch_name,
        is_touched: false,
        content: get_file_content,
      };

      if (!active_files.some((f: any) => f.path === full_path)) {
        dispatch(update_active_files([...active_files, active_file]));
      }

      dispatch(update_active_file(active_file));

      setTimeout(() => {
        useMainContextIn.handle_set_editor({
          name: branch_name,
          path: full_path,
          content: get_file_content,
        });
      }, 0);
    },
    [active_files]
  );

  useEffect(() => {
    const onNew = () => handle_set_editor("Untitled.py", `/untitled.py`);
    const onOpen = (e: any, data: { path: string; fileName: string }) =>
      handle_set_editor(data.fileName, data.path);

    window.electron.ipcRenderer.on("new-file-tab", onNew);
    window.electron.ipcRenderer.on("new-file-opened", onOpen);

    return () => {
      window.electron.ipcRenderer.removeListener("new-file-tab", onNew);
      window.electron.ipcRenderer.removeListener("new-file-opened", onOpen);
    };
  }, [handle_set_editor]);

  const handleRename = (
    id: any,
    newName: string,
    path: string,
    containingFolder: string
  ) => {
    const updated: any = sortFolderStructure(
      updateNode(fileTreeData, id, newName)
    );
    setFileTree(updated);
    syncFolderToMain(updated);

    window.electron.rename({
      newName,
      path,
      rootPath: fileTreeData.root,
      containingFolder,
    });

    dispatch(
      update_active_files(
        active_files.map((tab: any) =>
          tab.path === path ? { ...tab, name: newName } : tab
        )
      )
    );
  };

  const handleDelete = (id: any, type: string, path: string) => {
    const updated: any = sortFolderStructure(deleteNode(fileTreeData, id));
    setFileTree(updated);
    syncFolderToMain(updated);

    if (type === "folder") {
      window.electron.delete_folder({ path, rootPath: fileTreeData.root });
    } else {
      window.electron.delete_file({ path, rootPath: fileTreeData.root });
    }
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
      parentPath: containingFolder,
    };

    const fileExists = (node: any): boolean => {
      if (path_join([node.path, node.name]) === newFile.path) return true;
      return node.children?.some(fileExists) ?? false;
    };

    if (fileExists(fileTreeData)) {
      window.electron.ipcRenderer.send("show-warning", {
        title: "File Already Exists",
        message: `A file named "${fileName}" already exists.`,
      });
      return;
    }

    const updated: any = sortFolderStructure(
      insertNode(fileTreeData, parentId, newFile)
    );
    setFileTree(updated);
    syncFolderToMain(updated);

    window.electron.create_file({
      path: newFile.path,
      fileName: newFile.name,
      rootPath: fileTreeData.root,
    });
  };

  const handleAddFolder = (
    parentId: any,
    folderName: string,
    path: string,
    containingFolder: string
  ) => {
    const newFolder = {
      id: Date.now(),
      type: "folder",
      name: folderName,
      path: path_join([path, folderName]),
      parentPath: containingFolder,
      children: [{}],
    };

    const updated: any = sortFolderStructure(
      insertNode(fileTreeData, parentId, newFolder)
    );
    setFileTree(updated);
    syncFolderToMain(updated);

    window.electron.create_folder({
      path: newFolder.path,
      fileName: newFolder.name,
      rootPath: fileTreeData.root,
    });
  };

  return (
    <div className="explorer">
      <div className="title">Explorer</div>
      <div className="explorer-scroll">
        {fileTreeData && fileTreeData.name ? (
          <ExplorerComponent
            handleDelete={handleDelete}
            handleAddFile={handleAddFile}
            handleAddFolder={handleAddFolder}
            handleRename={handleRename}
            onFileClick={handle_set_editor}
            fileTree={fileTreeData}
          />
        ) : (
          <div className="empty-folder">Loading...</div>
        )}
      </div>
    </div>
  );
});
