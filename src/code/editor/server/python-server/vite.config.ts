import { defineConfig } from "vite";
import importMetaUrlPlugin from "@codingame/esbuild-import-meta-url-plugin";
import path from "path";

export default defineConfig({
    build: {
        target: "esnext",
        outDir: "dist",
        emptyOutDir: false,
        lib: {
            entry: path.resolve(__dirname, "packages/python/src/index.ts"),
            formats: ["es"],
            fileName: () => "python-server.js",
        },
        rollupOptions: {
            input: path.resolve(__dirname, "packages/python/src/index.ts"),
            output: {
                entryFileNames: "python-server.js",
            },
            external: ["fs", "path", "child_process", "os", "url"],
        },
    },
    optimizeDeps: {
        esbuildOptions: {
            plugins: [importMetaUrlPlugin],
            target: "esnext",
            platform: "node",
        },
    },
    define: {
        rootDirectory: JSON.stringify(__dirname),
    },
});
