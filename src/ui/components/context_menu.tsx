import { useEffect, useId } from "react";
import {
  isContextMenuOwner,
  setContextMenuOwner,
} from "../scripts/context_menu_owner";

export function ContextMenu({ contextMenuPos, children }: any) {
  const id = useId();
  const isOwner = isContextMenuOwner(id);

  useEffect(() => {
    setContextMenuOwner(id);
  }, [id]);

  if (!isOwner) return null;

  return (
    <div
      className="dropdown"
      style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
    >
      {children}
    </div>
  );
}
