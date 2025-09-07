const { src, dest, watch, series, parallel } = require("gulp");
const merge = require("merge-stream");
const rename = require("gulp-rename");

const SOURCE_GLOBS = [
  "src/**/*.{html,css,json,svg,png,ico,zip,py,ttf,otf}",
  "!src/**/tsconfig.*",
];

const EXTENSION_SOURCE = ["extensions/packages/**/*.{css,json,js}"];

function copyFiles() {
  return src(SOURCE_GLOBS, {
    base: "src",
    allowEmpty: true,
  }).pipe(dest("out"));
}

function copyExtensionFiles() {
  return src(EXTENSION_SOURCE, {
    base: "extensions/packages",
    allowEmpty: true,
    nodir: true,
  }).pipe(dest("extensions/dist"));
}

function copyExtensions() {
  return src("extensions/dist/**/*", {
    allowEmpty: true,
  }).pipe(dest("out/extensions"));
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

function watchFiles() {
  return watch(
    SOURCE_GLOBS,
    { ignoreInitial: false },
    series(copyFiles, copyExtensions, copyExtensionFiles)
  );
}

const build = series(
  parallel(copyFiles, copyPythonWorker, copyCodicons, copyExtensionFiles),
  copyExtensions
);

module.exports = {
  copy: build,
  watch: series(build, watchFiles),
  default: series(build, watchFiles),
};
