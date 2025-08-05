import { spawn } from "child_process";
import { join } from "path";

const targetDir = join(
  process.cwd(),
  "src",
  "code",
  "editor",
  "server",
  "python-server"
);

const child = spawn("npm", ["run", "start:python:server"], {
  cwd: targetDir,
  stdio: "inherit",
  shell: true,
});
