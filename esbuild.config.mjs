import esbuild from "esbuild";
import fg from "fast-glob";

const watch = process.argv.includes("--watch");
const prod = process.argv.includes("--prod");
const env = prod ? "production" : "development";

const common = {
  bundle: true,
  sourcemap: false,
  minify: prod,
  outbase: "src",
  outdir: "out",
  plugins: [],
};

async function buildAll() {
  const rendererEntries = await fg(["src/code/workbench/**/renderer.ts"]);
  const otherEntries = await fg([
    "src/code/workbench/**/*.ts",
    "src/code/editor/**/*.ts",
    "!src/code/workbench/**/renderer.ts",
    "!**/*.d.ts",
    "!**/*.test.ts",
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
    assetNames: "assets/[name]-[hash]",
    chunkNames: "chunks/[name]-[hash]",
    metafile: true,
    loader: Loaders,
  };

  const nodeOpts = {
    ...common,
    entryPoints: otherEntries,
    platform: "node",
    format: "cjs",
    target: ["node18"],
    loader: Loaders,
  };

  if (watch) {
    const rendererCtx = await esbuild.context(rendererOpts);
    const nodeCtx = await esbuild.context(nodeOpts);
    const workersCtx = await esbuild.context(workersOpts);
    await workersCtx.watch();
    await rendererCtx.watch();
    await nodeCtx.watch();
  } else {
    await Promise.all([
      esbuild.build(rendererOpts),
      esbuild.build(nodeOpts),
      esbuild.build(workersOpts),
    ]);
  }
}

buildAll().catch((e) => {
  console.error(e);
  process.exit(1);
});
