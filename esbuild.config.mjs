import esbuild from "esbuild";
import fg from "fast-glob";

const importMetaUrlPlugin = {
  name: "import-meta-url",
  setup(build) {
    build.onResolve({ filter: /.*/ }, (args) => {
      if (args.kind === "entry-point") return;
      return;
    });

    build.onLoad({ filter: /\.[jt]s$/ }, async (args) => {
      const fs = await import("fs/promises");
      let contents = await fs.readFile(args.path, "utf8");

      if (contents.includes("import.meta.url")) {
        const fileUrl = `file://${args.path.replace(/\\/g, "/")}`;
        contents = contents.replace(
          /import\.meta\.url/g,
          JSON.stringify(fileUrl)
        );
      }

      return {
        contents,
        loader: args.path.endsWith(".ts") ? "ts" : "js",
      };
    });
  },
};

const watch = process.argv.includes("--watch");
const prod = process.argv.includes("--prod");
const env = prod ? "production" : "development";

const common = {
  bundle: true,
  sourcemap: false,
  minify: prod,
  outbase: "src",
  outdir: "out",
  plugins: [importMetaUrlPlugin],
  logLevel: "error",
};

async function buildAll() {
  const rendererEntries = await fg([
    "src/code/workbench/**/renderer.ts",
    "src/code/platform/**/*.ts",
  ]);

  const workerEntries = {
    "workers/editor.worker":
      "node_modules/monaco-editor/esm/vs/editor/editor.worker.js",
    "workers/ts.worker":
      "node_modules/monaco-editor/esm/vs/language/typescript/ts.worker.js",
    "workers/json.worker":
      "node_modules/monaco-editor/esm/vs/language/json/json.worker.js",
    "workers/css.worker":
      "node_modules/monaco-editor/esm/vs/language/css/css.worker.js",
    "workers/html.worker":
      "node_modules/monaco-editor/esm/vs/language/html/html.worker.js",
  };

  const workersOpts = {
    bundle: true,
    format: "esm",
    platform: "browser",
    target: ["chrome114", "firefox115"],
    entryPoints: workerEntries,
    outdir: "out/workers",
    entryNames: "[name]",
    sourcemap: false,
    minify: prod,
  };

  const Loaders = {
    ".ttf": "file",
    ".woff": "file",
    ".woff2": "file",
    ".svg": "file",
    ".py": "text",
    ".css": "text",
  };

  const rendererOpts = {
    ...common,
    entryPoints: rendererEntries,
    platform: "browser",
    format: "esm",
    splitting: true,
    target: ["chrome114", "firefox115"],
    define: { "process.env.NODE_ENV": JSON.stringify(env) },
    assetNames: "assets/[name]",
    chunkNames: "chunks/[name]-[hash]",
    metafile: true,
    loader: Loaders,
  };

  if (watch) {
    const rendererCtx = await esbuild.context(rendererOpts);
    const workersCtx = await esbuild.context(workersOpts);
    await workersCtx.watch();
    await rendererCtx.watch();
  } else {
    await Promise.all([
      esbuild.build(rendererOpts),
      esbuild.build(workersOpts),
    ]);
  }
}

buildAll().catch((e) => {
  console.error(e);
  process.exit(1);
});
