const useTree = () => {
  const insertNode = (
    tree: any | null,
    parentId: string,
    node: any
  ): any | null => {
    if (!tree) return tree;

    if (tree.id === parentId) {
      return {
        ...tree,
        children: [...(tree.children || []), node],
      };
    }

    if (tree.children) {
      return {
        ...tree,
        children: tree.children.map((child: any) =>
          insertNode(child, parentId, node)
        ),
      };
    }

    return tree;
  };

  const deleteNode = (tree: any | null, nodeId: string): any | null => {
    if (!tree) return null;

    if (tree.id === nodeId) {
      return null;
    }

    if (tree.children && tree.children.length > 0) {
      const newChildren = tree.children
        .map((child: any) => deleteNode(child, nodeId))
        .filter((child: any) => child !== null);

      return {
        ...tree,
        children: newChildren,
      };
    }

    return tree;
  };

  const updateNode = (
    tree: any | null,
    nodeId: string,
    newName: string
  ): any | null => {
    if (!tree) return tree;

    if (tree.id === nodeId) {
      return {
        ...tree,
        name: newName,
      };
    }

    if (tree.children) {
      return {
        ...tree,
        children: tree.children.map((child: any) =>
          updateNode(child, nodeId, newName)
        ),
      };
    }

    return tree;
  };

  return { insertNode, deleteNode, updateNode };
};

export default useTree;
