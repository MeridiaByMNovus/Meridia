import { ReactComponent as Minimize } from "../../../../../assets/window-controls/minimize.svg";
import { ReactComponent as Close } from "../../../../../assets/window-controls/close.svg";

import Logo from "../../../../../assets/logo.png";

export function TitlebarUI() {
  return (
    <div className="titlebar-wrapper">
      <div className="part">
        <div className="logo">
          <img src={Logo} alt="logo" />
        </div>
      </div>

      <div className="window-controls">
        <button className="button-minimize">
          <Minimize />
        </button>
        <button className="button-close">
          <Close />
        </button>
      </div>
    </div>
  );
}
