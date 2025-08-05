import { execSync } from "child_process";
import { join } from "path";

const targetDir = join(
  process.cwd(),
  "src",
  "code",
  "editor",
  "server",
  "python-server"
);

const extraArgs = process.argv.slice(2).join(" ");

execSync(`npm run vite:build -- ${extraArgs}`, {
  cwd: targetDir,
  stdio: "inherit",
});
