const { src, dest, watch, series, parallel } = require("gulp");

const SOURCE_GLOBS = [
  "src/**/*.{html,css,json,svg,png,ico,py,ttf,otf,zip}",
  "!src/**/tsconfig.*",
];

const MODELS_GLOBS = ["src/code/base/models/**/*", "!src/**/tsconfig.*"];

function copyFiles() {
  return src(SOURCE_GLOBS, {
    base: "src",
    allowEmpty: true,
    encoding: false,
  }).pipe(dest("build"));
}

function copyPyright() {
  return src("node_modules/pyright/**/*", {
    base: "node_modules/pyright/",
    allowEmpty: true,
    encoding: false,
  }).pipe(dest("build/pyright"));
}

const build = series(parallel(copyFiles, copyPyright));

function watchSourceFiles() {
  return watch(SOURCE_GLOBS, { ignoreInitial: false }, copyFiles);
}

function watchAll() {
  return parallel(watchSourceFiles);
}

module.exports = {
  copy: build,
  watch: series(build, watchAll()),
  default: series(build, watchAll()),
};
