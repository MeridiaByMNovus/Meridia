// vite.config.ts
import path from "node:path";
import { defineConfig } from "vite";
import monaco from "vite-plugin-monaco-editor";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const root = path.resolve(__dirname, "src");
  return {
    root,
    base: "/",
    plugins: [tsconfigPaths(), monaco({})],
    define: {
      "process.env.NODE_ENV": JSON.stringify(
        mode === "production" ? "production" : "development"
      ),
    },
    build: {
      outDir: path.relative(root, path.resolve(__dirname, "out")),
      sourcemap: mode !== "production",
      target: "es2022",
      emptyOutDir: false,
      rollupOptions: {
        output: {
          entryFileNames: "assets/[name]-[hash].js",
          chunkFileNames: "chunks/[name]-[hash].js",
          assetFileNames: (asset) => {
            if (/\.(ttf|woff2?|svg)$/.test(asset.name ?? "")) {
              return "assets/fonts/[name]-[hash][extname]";
            }
            return "assets/[name]-[hash][extname]";
          },
        },
      },
    },
  };
});
