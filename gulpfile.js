const { src, dest, watch, series, parallel } = require("gulp");

const SOURCE_GLOBS = [
  "src/**/*.{html,css,json,svg,png,ico,py,ttf,otf}",
  "!src/**/tsconfig.*",
];

function copyFiles() {
  return src(SOURCE_GLOBS, {
    base: "src",
    allowEmpty: true,
    encoding: false,
  }).pipe(dest("build"));
}

const build = series(parallel(copyFiles));

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
