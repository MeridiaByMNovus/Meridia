import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useContext,
} from "react";
import useTree from "../../../hooks/use_file_tree";
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

export function Explorer() {
  const folder_structure = useAppSelector((s) => s.main.folder_structure);
  const active_files = useAppSelector((s) => s.main.active_files);
  const dispatch = useAppDispatch();

  const { handle_set_tab, handle_set_editor } = useContext(MainContext);
  const [fileTreeData, setFileTree] = useState<IFolderStructure | null>(null);
  const { insertNode, deleteNode, updateNode } = useTree();

  const isImage = (path: string) =>
    /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico|tiff?|avif|jfif|pjpe?g)$/i.test(path);

  const openFile = useCallback(
    async (branch_name: string, full_path: string) => {
      if (isImage(full_path)) {
        handle_set_tab({
          id: full_path,
          name: branch_name,
          icon: full_path,
          component: "imageViewer",
          props: { path: full_path },
        });
        return;
      }

      dispatch(update_simple_tab(null));
      const content = await window.electron.get_file_content(full_path);

      const active_file: TActiveFile = {
        icon: "",
        path: full_path,
        name: branch_name,
        is_touched: false,
        content: content,
        diagnostic_state: "info",
      };

      if (!active_files.some((f: any) => f.path === full_path)) {
        dispatch(update_active_files([...active_files, active_file]));
      }

      dispatch(update_active_file(active_file));

      setTimeout(() => {
        handle_set_editor({
          name: branch_name,
          path: full_path,
          content: content,
        });
      }, 0);
    },
    [active_files, dispatch, handle_set_tab, handle_set_editor]
  );

  const sortFolderStructure = useCallback((node: TFolderTree): TFolderTree => {
    if (!node?.children?.length) return node;

    const sortedChildren = [...node.children]
      .sort((a, b) => {
        if (a.type === "folder" && b.type !== "folder") return -1;
        if (a.type !== "folder" && b.type === "folder") return 1;
        return a.name.localeCompare(b.name);
      })
      .map(sortFolderStructure);

    return isEqual(node.children, sortedChildren)
      ? node
      : { ...node, children: sortedChildren };
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
    if (folder_structure && Object.keys(folder_structure).length > 0) {
      const sorted: any = sortFolderStructure(folder_structure);
      if (!isEqual(fileTreeData, sorted)) {
        setFileTree(sorted);
        syncFolderToMain(sorted);
      }
    }
  }, [folder_structure]);

  useEffect(() => {
    if (!fileTreeData) {
      window.electron.get_folder().then(setFileTree);
    }
  }, [fileTreeData]);

  useEffect(() => {
    const onNew = () => openFile("Untitled.py", `/untitled.py`);
    const onOpen = (_: any, data: { path: string; fileName: string }) =>
      openFile(data.fileName, data.path);

    window.electron.ipcRenderer.on("new-file-tab", onNew);
    window.electron.ipcRenderer.on("new-file-opened", onOpen);

    return () => {
      window.electron.ipcRenderer.removeListener("new-file-tab", onNew);
      window.electron.ipcRenderer.removeListener("new-file-opened", onOpen);
    };
  }, [openFile]);

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

    const fileExists = (node: any): boolean =>
      path_join([node.path, node.name]) === newFile.path ||
      (node.children?.some(fileExists) ?? false);

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
        {fileTreeData?.name ? (
          <ExplorerComponent
            fileTree={fileTreeData}
            handleDelete={handleDelete}
            handleAddFile={handleAddFile}
            handleAddFolder={handleAddFolder}
            handleRename={handleRename}
            onFileClick={openFile}
          />
        ) : (
          <div className="empty-folder">Loading...</div>
        )}
      </div>
    </div>
  );
}
