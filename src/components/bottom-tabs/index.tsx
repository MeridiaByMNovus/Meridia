import { useAppDispatch, useAppSelector } from "../../helpers/hooks";
import {
  update_current_bottom_tab,
  update_bottom_panel_active,
} from "../../helpers/state-manager";
import PerfectScrollbar from "react-perfect-scrollbar";
import { Tabs } from "../../../support/ui-kit/index";
import { Output } from "./output";
import { PackageManager } from "./package-manager";
import { Terminal } from "./terminal";
import { CloseOutlined } from "@ant-design/icons/lib";

export const BottomTabs = () => {
  const currentTab = useAppSelector((state) => state.main.current_bottom_tab);
  const dispatch = useAppDispatch();

  return (
    <div
      className="bottom-wrapper"
      style={{ display: "flex", flexDirection: "column", height: "100%" }}
    >
      <Tabs
        items={[
          {
            key: 1,
            name: "Powershell.exe",
            closable: false,
            onTabClick: () => console.log(""),
          },
        ]}
        customButtons={[
          <button onClick={() => dispatch(update_bottom_panel_active(false))}>
            <CloseOutlined />
          </button>,
        ]}
        customButtonsTooltip={["Hide"]}
        activeManualTab={currentTab}
      />
      <PerfectScrollbar>
        <div className="tab-content" style={{ flex: 1, overflow: "hidden" }}>
          <Terminal />
        </div>
      </PerfectScrollbar>
    </div>
  );
};
