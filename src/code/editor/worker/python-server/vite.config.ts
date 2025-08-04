/* eslint-disable header/header */
import { defineConfig } from "vite";
import * as path from "path";
import importMetaUrlPlugin from "@codingame/esbuild-import-meta-url-plugin";

export default defineConfig(() => {
    const config = {
        build: {
            target: "esnext",
            rollupOptions: {
                input: {
                    python: path.resolve(
                        __dirname,
                        "packages/examples/python.html"
                    ),
                },
            },
        },
        resolve: {
            // not needed here, see https://github.com/TypeFox/monaco-languageclient#vite-dev-server-troubleshooting
            // dedupe: ['monaco-editor', 'vscode']
        },
        optimizeDeps: {
            esbuildOptions: {
                plugins: [importMetaUrlPlugin],
            },
        },
        define: {
            rootDirectory: JSON.stringify(__dirname),
        },
    };
    return config;
});
