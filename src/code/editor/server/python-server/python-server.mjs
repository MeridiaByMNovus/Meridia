import * as cjs from "./dist/python-server.js";

export const startPythonClient =
    cjs.startPythonClient ?? cjs.default?.startPythonClient;
