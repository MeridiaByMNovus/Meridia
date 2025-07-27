import esbuild from "esbuild";
import fg from "fast-glob";
import * as dotenv from "dotenv";

dotenv.config();

const watch = process.argv.includes("--watch");
const prod = process.argv.includes("--prod");
const env = prod ? "production" : "development";

const common = {
  bundle: true,
  sourcemap: !prod,
  minify: prod,
  outbase: "src",
  outdir: "out",
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

  const Loaders = {
    ".ttf": "file",
    ".svg": "file",
  };

  const rendererOpts = {
    ...common,
    entryPoints: rendererEntries,
    platform: "browser",
    format: "esm",
    splitting: true,
    target: ["chrome114", "firefox115"],
    plugins: [],
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
    external: ["monaco-editor", "monaco-editor/*"],
  };

  if (watch) {
    const rendererCtx = await esbuild.context(rendererOpts);
    const nodeCtx = await esbuild.context(nodeOpts);
    await rendererCtx.watch();
    await nodeCtx.watch();
    console.log("watching...");
  } else {
    await Promise.all([esbuild.build(rendererOpts), esbuild.build(nodeOpts)]);
  }
}

buildAll().catch((e) => {
  console.error(e);
  process.exit(1);
});
