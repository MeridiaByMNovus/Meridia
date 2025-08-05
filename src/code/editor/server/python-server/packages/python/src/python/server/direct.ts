import { resolve } from "path";
import { runPythonServer } from "./main.js";
import { getLocalDirectory } from "../../utils/fs-utils.js";

const baseDir = resolve(getLocalDirectory(import.meta.url));
const relativeDir =
    "../../../../../node_modules/pyright/dist/pyright-langserver.js";

runPythonServer(baseDir, relativeDir);
