import monacoCss from "monaco-editor/min/vs/editor/editor.main.css";
import xtermCss from "@xterm/xterm/css/xterm.css";
import GoogleSansCode from "../../resources/fonts/GoogleSansCode.ttf";
import MozillaText from "../../resources/fonts/MozillaText.ttf";
import Poppins from "../../resources/fonts/PoppinsRegular.ttf";
import Codicon from "../../resources/fonts/Codicon.ttf";

export function InjectResources() {
  const codiconFontFace = `
  @font-face {
    font-family: "codicon";
    src: url("${Codicon}") format("truetype");
    font-weight: normal;
    font-style: normal;
  }
  `;

  const googleSansCodeFontFace = `
  @font-face {
    font-family: "Google Sans Code";
    src: url("${GoogleSansCode}") format("truetype");
    font-weight: normal;
    font-style: normal;
  }
  `;

  const mozillaTextFontFace = `
  @font-face {
    font-family: "Mozilla Text";
    src: url("${MozillaText}") format("truetype");
    font-weight: normal;
    font-style: normal;
  }
  `;

  const poppinsFontFace = `
  @font-face {
    font-family: "Poppins";
    src: url("${Poppins}") format("truetype");
    font-weight: normal;
    font-style: normal;
  }
  `;

  const style = document.createElement("style");
  style.textContent =
    codiconFontFace +
    googleSansCodeFontFace +
    mozillaTextFontFace +
    poppinsFontFace +
    monacoCss +
    xtermCss +
    document.head.appendChild(style);
}
