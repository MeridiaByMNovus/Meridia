import monacoCss from "monaco-editor/min/vs/editor/editor.main.css";
import codiconCss from "monaco-editor/esm/vs/base/browser/ui/codicons/codicon/codicon.css";
import codiconTtfUrl from "monaco-editor/esm/vs/base/browser/ui/codicons/codicon/codicon.ttf";
import xtermCss from "@xterm/xterm/css/xterm.css";

export function InjectResources() {
  const patched = codiconCss.replace(
    /url\([^)]*codicon\.ttf[^)]*\)/,
    `url("${codiconTtfUrl}")`
  );

  const style = document.createElement("style");
  style.textContent = monacoCss + xtermCss + patched;
  document.head.appendChild(style);
}
