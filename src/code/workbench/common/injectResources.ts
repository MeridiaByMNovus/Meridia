import monacoCss from "monaco-editor/min/vs/editor/editor.main.css";
import xtermCss from "@xterm/xterm/css/xterm.css";
import GoogleSansCode from "../../resources/fonts/GoogleSansCode.ttf";
import SpaceMono from "../../resources/fonts/SpaceMonoRegular.ttf";
import MozillaText from "../../resources/fonts/MozillaText.ttf";
import Poppins from "../../resources/fonts/PoppinsRegular.ttf";

export function InjectResources() {
  const injectStyle = (cssText: string) => {
    const style = document.createElement("style");
    style.innerHTML = cssText;
    document.head.appendChild(style);
  };

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

  const spaceMonoFontFace = `
  @font-face {
    font-family: "Space Mono";
    src: url("${SpaceMono}") format("truetype");
    font-weight: normal;
    font-style: normal;
  }
  `;

  injectStyle(googleSansCodeFontFace);
  injectStyle(mozillaTextFontFace);
  injectStyle(poppinsFontFace);
  injectStyle(spaceMonoFontFace);

  injectStyle(monacoCss);
  injectStyle(xtermCss);
}
