const { src, dest, watch, series, parallel } = require("gulp");

const STATIC_GLOBS = [
  "src/**/*.{html,css,json,svg,png,ico,zip,js,js.map}",
  "!src/**/tsconfig.*",
  "!src/**/node_modules/**",
  "!src/code/workbench/**/*",
];

function copyFiles() {
  return src(STATIC_GLOBS, { base: "src", allowEmpty: true }).pipe(dest("out"));
}

function watchFiles() {
  return watch(STATIC_GLOBS, { ignoreInitial: false }, copyFiles);
}

exports.copy = copyFiles;
exports.watch = watchFiles;
exports.default = series(copyFiles, watchFiles);
