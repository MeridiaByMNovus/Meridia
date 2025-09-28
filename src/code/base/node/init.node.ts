import path from "path";
import { PythonShell } from "python-shell";

const _extractVoicePath = path.join(
  __dirname,
  "code",
  "base",
  "scripts",
  "extract_text.py"
);

const options = {
  ...PythonShell.defaultOptions,
  args: ["--preload", "preload.wav"],
};

const pyshell = new PythonShell(_extractVoicePath, options);

pyshell.on("stderr", function (stderr) {
  console.log("Python output:", stderr);
});

pyshell.end(function (err, code, signal) {
  if (err) {
    console.error("Python script error:", err);
  } else {
    console.log("Python script finished with exit code:", code);
    console.log("Exit signal:", signal);
  }
});
