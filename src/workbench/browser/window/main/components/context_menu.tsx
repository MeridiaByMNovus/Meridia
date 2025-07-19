import { useEffect, useId, useRef } from "react";
import {
  isContextMenuOwner,
  setContextMenuOwner,
} from "../../../../scripts/others/context_menu_owner";

interface ContextMenuProps {
  contextMenuPos: { x: number; y: number };
  children: React.ReactNode;
  onRequestClose?: () => void;
}

export function ContextMenu({
  contextMenuPos,
  children,
  onRequestClose,
}: ContextMenuProps) {
  const id = useId();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isOwner = isContextMenuOwner(id);

  useEffect(() => {
    setContextMenuOwner(id);
  }, [id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onRequestClose?.();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onRequestClose]);

  if (!isOwner) setContextMenuOwner(id);

  return (
    <div
      ref={menuRef}
      className="dropdown"
      style={{
        left: contextMenuPos.x,
        top: contextMenuPos.y,
        position: "absolute",
      }}
    >
      {children}
    </div>
  );
}
