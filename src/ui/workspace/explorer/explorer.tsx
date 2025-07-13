import React, { useEffect, useRef, useState } from "react";
import { ChevronRightIcon, ChevronDownIcon } from "@primer/octicons-react";
import { ClipLoader } from "react-spinners";
import { getIconForFile } from "vscode-icons-js";
import { ReactComponent as FolderIcon } from "../../../assets/svg/folder.svg";
import { CloseOutlined } from "@ant-design/icons/lib";
import { ContextMenu } from "../../components/context_menu";

interface ExplorerType {
  fileTree: any;
  handleAddFile: Function;
  handleAddFolder: Function;
  handleDelete: Function;
  handleRename: Function;
  onFileClick: Function;
}

export const ExplorerComponent = React.memo(function ExplorerComponent({
  fileTree,
  handleAddFile,
  handleAddFolder,
  handleDelete,
  handleRename,
  onFileClick,
}: ExplorerType) {
  const [isExpanded, setIsExpanded] = useState(
    fileTree?.name === fileTree?.root
  );
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isCreating, setIsCreating] = useState({
    isFolder: false,
    showInput: false,
    folderId: null,
  });
  const [isRenaming, setIsRenaming] = useState({
    showInput: false,
    name: "",
    newName: "",
    id: null,
  });

  const inputRef = useRef<HTMLInputElement>(null);

  const handleExpand = async () => {
    if (fileTree.name === fileTree.root) {
      setIsExpanded(!isExpanded);
      return;
    }

    if (!isExpanded) {
      try {
        setIsLoading(true);
        const result: any = await window.electron.ipcRenderer.invoke(
          "get-subfolder-data",
          fileTree.path
        );

        if (result) {
          setTimeout(() => {
            setIsLoading(false);
            setIsExpanded(true);
          }, 100);
        } else {
          throw new Error("No result");
        }
      } catch (error) {
        setIsLoading(false);
        setIsError(true);
        setTimeout(() => setIsError(false), 3000);
      }
    } else {
      setIsExpanded(false);
    }
  };

  const handleRenameSubmit = () => {
    if (
      isRenaming.id &&
      isRenaming.newName.trim() &&
      isRenaming.newName !== isRenaming.name
    ) {
      handleRename(
        isRenaming.id,
        isRenaming.newName,
        fileTree.path,
        fileTree.root === fileTree.name
          ? fileTree.root
          : fileTree.containingFolderPath
      );
    }
    setIsRenaming({ showInput: false, name: "", newName: "", id: null });
  };

  const handleCreateSubmit = (e: any, path: any, container: any) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const name = form.get("name")?.toString().trim();
    if (!name) return;
    if (isCreating.isFolder) {
      handleAddFolder(isCreating.folderId, name, path, container);
    } else {
      handleAddFile(isCreating.folderId, name, path, container);
    }
    setIsCreating({ ...isCreating, showInput: false });
  };

  const renderInput = (defaultName = "", isRename = false) => (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        marginLeft: `${isRename ? 0 : "12px"}`,
      }}
    >
      {!isRename && (
        <img
          src={`icons/${getIconForFile(fileTree?.name ?? "")}`}
          alt="file icon"
          width={14}
          style={{ marginRight: "8px" }}
        />
      )}

      <input
        ref={inputRef}
        name="name"
        defaultValue={defaultName}
        className="filetree-input"
        onClick={(e) => e.stopPropagation()}
        onChange={(e) =>
          isRename
            ? setIsRenaming({ ...isRenaming, newName: e.target.value })
            : null
        }
        onBlur={() => {
          isRename
            ? handleRenameSubmit()
            : setIsCreating({ ...isCreating, showInput: false });
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            isRename
              ? handleRenameSubmit()
              : e.currentTarget.form?.requestSubmit();
          }
        }}
      />
    </span>
  );

  useEffect(() => {
    if ((isRenaming.showInput || isCreating.showInput) && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming.showInput, isCreating.showInput]);

  return (
    <div className="filetree-node">
      <div
        className={`filetree-label ${isDropdownOpen && "filetree-label-active"}`}
        onClick={fileTree.type === "folder" ? handleExpand : undefined}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenuPos({ x: e.clientX, y: e.clientY });
          setIsDropdownOpen(true);
        }}
      >
        <span className="filetree-toggle">
          {fileTree.type === "folder" &&
            (isExpanded ? (
              <ChevronDownIcon size={14} />
            ) : (
              <ChevronRightIcon size={14} />
            ))}
        </span>
        <span className="filetree-icon">
          {fileTree.type === "folder" ? (
            isLoading ? (
              <ClipLoader size={14} color="var(--blue-color)" />
            ) : isError ? (
              <CloseOutlined style={{ color: "var(--red-color)" }} size={14} />
            ) : (
              <FolderIcon />
            )
          ) : (
            <img
              src={`icons/${getIconForFile(fileTree.name ?? "")}`}
              alt="file"
              width={14}
            />
          )}
        </span>
        <span
          onClick={() =>
            fileTree.type === "file" &&
            onFileClick(fileTree.name, fileTree.path)
          }
          className="filetree-name"
        >
          {isRenaming.showInput && isRenaming.id === fileTree.id ? (
            renderInput(fileTree.name, true)
          ) : fileTree.name === fileTree.root ? (
            (() => {
              const parts = fileTree.name?.split(/[\\/]/).filter(Boolean);
              const last = parts?.at(-1);
              return last?.endsWith(":")
                ? `Drive ${last[0]}`
                : (last ?? fileTree.name);
            })()
          ) : (
            <>
              <div className="tooltip-container">
                <div className="tooltip-wrapper">
                  <span className={`tooltip-text tooltip-right`}>
                    {/* {getFileContent(fileTree.path)} */}
                  </span>
                </div>
              </div>
              {fileTree.name}
            </>
          )}
        </span>
      </div>

      {isDropdownOpen && (
        <ContextMenu
          contextMenuPos={contextMenuPos}
          onRequestClose={() => setIsDropdownOpen(false)}
        >
          {fileTree.type === "folder" && (
            <>
              <button
                onClick={() => {
                  setIsCreating({
                    isFolder: false,
                    showInput: true,
                    folderId: fileTree.id,
                  });
                  setIsExpanded(true);
                  setIsDropdownOpen(false);
                  if (isExpanded) return;
                  handleExpand();
                }}
              >
                New File...
              </button>
              <button
                onClick={() => {
                  setIsCreating({
                    isFolder: true,
                    showInput: true,
                    folderId: fileTree.id,
                  });
                  setIsExpanded(true);
                  setIsDropdownOpen(false);
                  if (isExpanded) return;
                  handleExpand();
                }}
              >
                New Folder...
              </button>
            </>
          )}
          {fileTree.type === "folder" && fileTree.name !== fileTree.root && (
            <hr />
          )}
          {fileTree.name !== fileTree.root && (
            <>
              <button
                onClick={() => {
                  setIsRenaming({
                    showInput: true,
                    name: fileTree.name,
                    newName: fileTree.name,
                    id: fileTree.id,
                  });
                  setIsDropdownOpen(false);
                }}
              >
                Rename...
              </button>
              <button
                onClick={() =>
                  handleDelete(fileTree.id, fileTree.type, fileTree.path)
                }
              >
                Delete
              </button>
            </>
          )}
        </ContextMenu>
      )}

      {isExpanded && fileTree.children && (
        <div className="filetree-children">
          {isCreating.showInput && isCreating.folderId === fileTree.id && (
            <form
              onSubmit={(e) =>
                handleCreateSubmit(
                  e,
                  fileTree.name === fileTree.root
                    ? fileTree.name
                    : fileTree.path,
                  fileTree.name === fileTree.root
                    ? fileTree.root
                    : fileTree.containingFolderPath
                )
              }
              className="filetree-create-form"
            >
              {renderInput()}
            </form>
          )}

          {fileTree.children.map((child: any) => (
            <ExplorerComponent
              key={child.id}
              fileTree={child}
              handleAddFile={handleAddFile}
              handleAddFolder={handleAddFolder}
              handleDelete={handleDelete}
              handleRename={handleRename}
              onFileClick={onFileClick}
            />
          ))}
        </div>
      )}
    </div>
  );
});
