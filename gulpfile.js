const { src, dest, watch, series, parallel } = require("gulp");
const rename = require("gulp-rename");

const SOURCE_GLOBS = [
  "src/**/*.{html,css,json,svg,png,ico,zip}",
  "!src/**/tsconfig.*",
];

function copyFiles() {
  return src(SOURCE_GLOBS, { base: "src", allowEmpty: true }).pipe(dest("out"));
}

function copyPythonWorker() {
  return src("node_modules/monaco-pyright-lsp/dist/worker.js")
    .pipe(rename("python.worker.js"))
    .pipe(dest("out/workers"));
}

function watchFiles() {
  return watch(SOURCE_GLOBS, { ignoreInitial: false }, copyFiles);
}

const build = series(parallel(copyFiles, copyPythonWorker));

module.exports = {
  copy: build,
  build,
  watch: series(build, watchFiles),
  default: series(build, watchFiles),
};
