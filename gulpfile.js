const { src, dest, watch, series, parallel } = require("gulp");
const rename = require("gulp-rename");
const fs = require("fs");
const path = require("path");

const SOURCE_GLOBS = [
  "src/**/*.{html,css,json,svg,png,ico,zip,py,ttf,otf}",
  "!src/**/tsconfig.*",
];

const EXTENSION_SOURCE = ["extensions/packages/**/*.{css,json,js}"];

function copyFiles() {
  return src(SOURCE_GLOBS, { base: "src", allowEmpty: true }).pipe(dest("out"));
}

function copyExtensionFiles() {
  return src(EXTENSION_SOURCE, {
    base: "extensions/packages",
    allowEmpty: true,
    nodir: true,
  }).pipe(dest("extensions/dist"));
}

function copyExtensions() {
  return src("extensions/dist/**/*", { allowEmpty: true, nodir: true }).pipe(
    dest("out/extensions")
  );
}

function copyExtensionsConditionally(done) {
  const distDir = path.join(__dirname, "extensions", "dist");
  if (fs.existsSync(distDir)) {
    return copyExtensions();
  } else {
    done();
  }
}

function copyPythonWorker() {
  return src("node_modules/monaco-pyright-lsp/dist/worker.js", {
    allowEmpty: true,
  })
    .pipe(rename("python.worker.js"))
    .pipe(dest("out/workers"));
}

function copyCodicons() {
  return src(
    "node_modules/monaco-editor/dev/vs/base/browser/ui/codicons/codicon/codicon.ttf",
    {
      allowEmpty: true,
      encoding: false,
    }
  ).pipe(dest("out/base/browser/ui/codicons/codicon"));
}

const build = series(
  parallel(copyFiles, copyPythonWorker, copyCodicons, copyExtensionFiles),
  copyExtensionsConditionally
);

function watchSourceFiles() {
  return watch(SOURCE_GLOBS, { ignoreInitial: false }, copyFiles);
}

function watchExtensionPackageFiles() {
  return watch(EXTENSION_SOURCE, { ignoreInitial: false }, copyExtensionFiles);
}

function watchExtensionsDistFiles() {
  return watch(
    "extensions/dist/**/*",
    { ignoreInitial: false },
    copyExtensionsConditionally
  );
}

function watchAll() {
  return parallel(
    watchSourceFiles,
    watchExtensionPackageFiles,
    watchExtensionsDistFiles
  );
}

module.exports = {
  copy: build,
  watch: series(build, watchAll()),
  default: series(build, watchAll()),
};
