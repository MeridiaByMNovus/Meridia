let currentOwnerId: string | null = null;

export function setContextMenuOwner(id: string) {
  currentOwnerId = id;
}

export function isContextMenuOwner(id: string) {
  return currentOwnerId === id;
}
