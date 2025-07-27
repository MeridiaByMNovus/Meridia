import path from "path";
import fs from "fs";

export function delete_file({
  data,
}: {
  data: { path: string; rootPath: string };
}) {
  if (!data.path) return;
  const folder = fs.rmSync(data.path);
}

export function delete_folder({
  data,
}: {
  data: { path: string; rootPath: string };
}) {
  if (!data.path) return;

  fs.rmSync(data.path, { recursive: true, force: true });
}
export function create_folder({
  data,
}: {
  data: { path: string; rootPath: string; fileName: string };
}) {
  if (!fs.existsSync(data.path)) {
    fs.mkdirSync(data.path, { recursive: true });
  }
}

export function create_file({
  data,
}: {
  data: { path: string; rootPath: string; fileName: string };
}) {
  if (!fs.existsSync(data.path)) {
    fs.writeFileSync(data.path, "");
  }
}

export function handle_rename(
  event: any,
  data: {
    newName: string;
    path: string;
    containingFolder: string;
    rootPath: string;
  }
) {
  const node = fs.renameSync(
    data.path,
    path.join(data.containingFolder, data.newName)
  );
}
