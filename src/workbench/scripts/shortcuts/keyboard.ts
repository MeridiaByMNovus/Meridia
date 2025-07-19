export function registerAllShortcuts(setOpen: any) {
  const handleKey = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === "KeyP") {
      e.preventDefault();
      setOpen((prev: any) => !prev);
    }
    if (e.key === "Escape") setOpen(false);
    if (e.key === "Tab") e.preventDefault();
  };

  document.addEventListener("keydown", handleKey);
  return () => {
    document.removeEventListener("keydown", handleKey);
  };
}
