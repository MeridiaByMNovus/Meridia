import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { rmSync } from "fs";
import esbuild from "esbuild";
import fg from "fast-glob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const watch = process.argv.includes("--watch");
const prod = process.argv.includes("--prod");
const env = prod ? "production" : "development";

const outDir = join(__dirname, "dist");

const common = {
  bundle: true,
  sourcemap: false,
  minify: prod,
  outbase: join(__dirname, "packages"),
  outdir: outDir,
  logLevel: "error",
};

async function buildAll() {
  // Clear dist before build
  rmSync(outDir, { recursive: true, force: true });

  const extensionsEntries = await fg(
    [`${__dirname.replace(/\\/g, "/")}/packages/**/*.ts`],
    { absolute: true }
  );

  if (!extensionsEntries.length) {
    console.warn("No files found to build!");
    return;
  }

  const Loaders = {
    ".ttf": "file",
    ".woff": "file",
    ".woff2": "file",
    ".svg": "file",
    ".py": "text",
    ".css": "text",
  };

  const extensionsOpts = {
    ...common,
    entryPoints: extensionsEntries,
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

  if (watch) {
    const ctx = await esbuild.context(extensionsOpts);
    await ctx.watch();
  } else {
    await esbuild.build(extensionsOpts);
  }
}

buildAll().catch((e) => {
  console.error(e);
  process.exit(1);
});
