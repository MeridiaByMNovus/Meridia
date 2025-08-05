const { src, dest, watch, series, parallel } = require("gulp");

const SOURCE_GLOBS = [
  "src/**/*.{html,css,json,svg,png,ico,zip,py,bat,mjs}",
  "!src/**/tsconfig.*",
  "!src/**/node_modules/**",
  "!**/node_modules/**",
];

function copyFiles() {
  return src(SOURCE_GLOBS, { base: "src", allowEmpty: true }).pipe(dest("out"));
}

function watchFiles() {
  return watch(SOURCE_GLOBS, { ignoreInitial: false }, copyFiles);
}

const build = series(parallel(copyFiles));

module.exports = {
  copy: build,
  build,
  watch: series(build, watchFiles),
  default: series(build, watchFiles),
};
