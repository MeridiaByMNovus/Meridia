import { IFolderStructure } from "../../workbench.types";

const useTraverse_tree = () => {
  function insertNode(
    _tree: IFolderStructure,
    _uri: string,
    _name: string,
    _type: "folder" | "file"
  ) {
    if (_tree.uri === _uri && _tree.type === "folder") {
      _tree.children.unshift({
        uri: window.path.join([_tree.uri, _name]),
        name: _name,
        type: _type,
        children: [],
        isRoot: false,
      });
      return _tree;
    }
    for (const obj of _tree.children) {
      const res = insertNode(obj, _uri, _name, _type);
      if (res) return _tree;
    }
    return null;
  }

  function deleteNode(_tree: IFolderStructure, uri: string) {
    if (_tree.uri === uri) {
      return null;
    }

    if (_tree.children && _tree.children.length > 0) {
      _tree.children = _tree.children.map((child) => deleteNode(child, uri)!);

      _tree.children = _tree.children.filter(Boolean);
    }

    return { ..._tree };
  }
  function updateNode(
    _tree: IFolderStructure,
    _uri: string,
    _name: string,
    _type: "folder" | "file"
  ) {
    if (_tree.uri === _uri) {
      return {
        ..._tree,
        name: _name,
      };
    }

    if (_tree.children && _tree.children.length > 0) {
      _tree.children = _tree.children.map((child) =>
        updateNode(child, _uri, _name, _type)
      );
    }

    return { ..._tree };
  }
  return { insertNode, deleteNode, updateNode };
};

export default useTraverse_tree;
