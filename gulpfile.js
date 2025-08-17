const { src, dest, watch, series, parallel } = require("gulp");
const rename = require("gulp-rename");

const SOURCE_GLOBS = [
  "src/**/*.{html,css,json,svg,png,ico,zip,py,ttf,otf}",
  "!src/**/tsconfig.*",
  "!src/**/node_modules/**",
  "!src/config/**/*.json",
];

const EXTENSION_SOURCE = ["extensions/**/*.{css,json,js}"];

function copyFiles() {
  return src(SOURCE_GLOBS, { base: "src", allowEmpty: true }).pipe(dest("out"));
}

function copyExtensionFiles() {
  return src(EXTENSION_SOURCE, {
    base: "extensions/packages",
    allowEmpty: true,
  }).pipe(dest("extensions/dist"));
}

function copyExtensions() {
  return src("extensions/dist/**/*", { allowEmpty: true }).pipe(
    dest("out/extensions")
  );
}

function copyPythonWorker() {
  return src("node_modules/monaco-pyright-lsp/dist/worker.js")
    .pipe(rename("python.worker.js"))
    .pipe(dest("out/workers"));
}

function watchFiles() {
  return watch(
    SOURCE_GLOBS,
    { ignoreInitial: false },
    series(copyFiles, copyExtensions, copyExtensionFiles)
  );
}

const build = series(
  parallel(copyFiles, copyPythonWorker, copyExtensionFiles),
  copyExtensions
);

module.exports = {
  copy: build,
  watch: series(build, watchFiles),
  default: series(build, watchFiles),
};
