import { useEffect, useState } from "react";

import { CloseOutlined, PlusOutlined } from "@ant-design/icons";

import "./tabs.css";
import Tooltip from "../tooltip/Tooltip";

interface Tab {
  name: string;
  key: number;
  closable: boolean;
  onTabClick?: Function;
  tooltip?: string;
}

interface TabProps {
  items?: Tab[];
  addTabButton?: boolean;
  addTabButtonText?: string;
  customButtons?: React.ReactNode[];
  customButtonsTooltip?: string[];
  defaultTabActive?: number;
  activeManualTab?: number;
}

export const Tabs = ({
  items = [],
  addTabButton = false,
  addTabButtonText = "",
  customButtons = [],
  customButtonsTooltip = [],
  defaultTabActive = 0,
  activeManualTab,
}: TabProps) => {
  const [tabs, setTabs] = useState(items);
  const [activeTab, setActiveTab] = useState(tabs.length > 1 ? 1 : 0);

  if (customButtonsTooltip.length > customButtons.length) {
    throw "Custom button tooltips is more than the buttons.";
  }

  const removeTab = (key: number) => {
    const newTabs = tabs.filter((tab) => tab.key !== key);

    setTabs(newTabs);
  };

  const addTab = () => {
    let newKey = tabs.length + 1;

    while (tabs.some((tab) => tab.key === newKey)) {
      newKey++;
    }

    const newTab: Tab = {
      name: `Tab ${newKey}`,
      key: newKey,
      closable: true,
    };

    setTabs((prevTabs) => [...prevTabs, newTab]);
  };

  return (
    <div id="meridia-tab-theme-mode">
      <div className="meridia-tabs-wrapper">
        <div className="meridia-tabs">
          {tabs?.map((item) => (
            <div
              key={item.key}
              className={`meridia-tab ${activeManualTab ? activeManualTab === item.key && "meridia-tab-active" : activeTab === item.key && "meridia-tab-active"}`}
              onClick={() => {
                setActiveTab(item.key);
                item.onTabClick();
              }}
            >
              <Tooltip
                text={item.tooltip ? item.tooltip : item.name}
                position="bottom"
              >
                <span>{item.name}</span>
              </Tooltip>
              {item.closable && (
                <button
                  key={item.key}
                  className="meridia-close-btn"
                  onClick={() => removeTab(item.key)}
                >
                  <CloseOutlined />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="meridia-tabs-buttons">
          {addTabButton && (
            <Tooltip text="Add Tab">
              <button className="meridia-add-tab-btn" onClick={addTab}>
                {addTabButtonText === "" && <PlusOutlined />}
              </button>
            </Tooltip>
          )}

          {customButtons.length > 0 && (
            <div className="meridia-custom-buttons">
              {customButtons.map((button, index) => (
                <div key={index} className="meridia-custom-button">
                  <Tooltip text={customButtonsTooltip[index]} position="left">
                    {button}
                  </Tooltip>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
