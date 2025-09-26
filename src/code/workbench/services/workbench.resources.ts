import monacoStyling from "monaco-editor/dev/vs/editor/editor.main.css";

const _injectStyle = (cssText: string) => {
  const style = document.createElement("style");
  style.innerHTML = cssText;
  document.head.appendChild(style);
};

_injectStyle(monacoStyling);
