const { src, dest, watch, series, parallel } = require("gulp");
const rename = require("gulp-rename");

const SOURCE_GLOBS = [
  "src/**/*.{html,css,json,svg,png,ico,zip,py}",
  "!src/**/tsconfig.*",
  "!src/**/node_modules/**",
];

function copyFiles() {
  return src(SOURCE_GLOBS, { base: "src", allowEmpty: true }).pipe(dest("out"));
}

function copyPythonWorker() {
  return src("out/code/editor/worker/python/src/worker.js")
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
