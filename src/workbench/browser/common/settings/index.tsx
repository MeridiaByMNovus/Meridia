import { useEffect, useState } from "react";
import {
  CloseOutlined,
  FilterOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons/lib";
import { ChevronRightIcon, ChevronDownIcon } from "@primer/octicons-react";
import rawSettings from "../../../contrib/json/settings.json";

export function Settings() {
  const [selectedMain, setSelectedMain] = useState("Text Editor");
  const [selectedSub, setSelectedSub] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({
    "Text Editor": true,
  });
  const [search, setSearch] = useState("");
  const [theme, setTheme] = useState("dark");

  const handleThemeChange = (newTheme: string) => {
    window.electron.ipcRenderer.send(
      "change-theme-path",
      newTheme === "dark" ? "./theme/dark.json" : "./theme/light.json"
    );
    setTheme(newTheme);
  };

  const filterSettings = (data: any, search: string) => {
    const lowerSearch = search.toLowerCase();
    const filtered: any = {};

    for (const main in data) {
      for (const sub in data[main]) {
        const matches = data[main][sub].filter((item: any) => {
          return (
            item.title.toLowerCase().includes(lowerSearch) ||
            (item.description?.toLowerCase() ?? "").includes(lowerSearch)
          );
        });

        if (matches.length > 0) {
          if (!filtered[main]) filtered[main] = {};
          filtered[main][sub] = matches;
        }
      }
    }

    return filtered;
  };

  const filteredSettings = search
    ? filterSettings(rawSettings, search)
    : rawSettings;
  const settingsData: any = filteredSettings;

  useEffect(() => {
    if (search.trim()) {
      const main = Object.keys(filteredSettings)[0];
      const sub = main ? Object.keys(filteredSettings[main])[0] : "";

      if (main && sub) {
        setSelectedMain(main);
        setSelectedSub(sub);
        setExpandedCategories((prev) => ({ ...prev, [main]: true }));
      }
    }
  }, [search]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  const renderSetting = (setting: any) => {
    return (
      <div className="group" key={setting.title}>
        <label className="title">{setting.title}</label>
        {setting.description && (
          <p className="description">{setting.description}</p>
        )}

        {setting.type === "number" && (
          <input
            type="number"
            defaultValue={setting.default}
            min={setting.min}
            max={setting.max}
          />
        )}
        {setting.type === "text" && (
          <input type="text" defaultValue={setting.default} />
        )}
        {setting.type === "select" && (
          <select
            defaultValue={setting.default}
            onChange={(e) => {
              if (setting.title === "Theme") {
                handleThemeChange(e.target.value);
              }
            }}
          >
            {setting.options.map((opt: string) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        )}
      </div>
    );
  };

  const mainCategories = Object.keys(settingsData);
  const subCategories = Object.keys(settingsData[selectedMain] || {});

  return (
    <div className="settings-wrapper">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search settings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="search-icons">
          <UnorderedListOutlined />
          {search && <CloseOutlined onClick={() => setSearch("")} />}
          <FilterOutlined />
        </div>
      </div>

      <div className="flex">
        <div className="sidebar">
          {mainCategories.map((mainCat) => {
            const isExpanded = expandedCategories[mainCat];
            return (
              <div key={mainCat}>
                <div
                  className={`sidebar-main ${selectedMain === mainCat ? "active" : ""}`}
                  onClick={() => {
                    setSelectedMain(mainCat);
                    setSelectedSub("");
                    toggleCategory(mainCat);
                  }}
                >
                  {isExpanded ? (
                    <ChevronDownIcon size={14} />
                  ) : (
                    <ChevronRightIcon size={14} />
                  )}
                  {mainCat}
                </div>
                <div className="sub-wrapper">
                  {isExpanded &&
                    Object.keys(settingsData[mainCat] || {}).map((sub) =>
                      sub ? (
                        <div
                          key={sub}
                          className={`sidebar-sub ${selectedSub === sub ? "active" : ""}`}
                          onClick={() => {
                            setSelectedMain(mainCat);
                            setSelectedSub(sub);
                          }}
                        >
                          {sub}
                        </div>
                      ) : null
                    )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="content">
          <p className="heading">{selectedSub || selectedMain}</p>
          <div className="scroll-area">
            {(settingsData[selectedMain]?.[selectedSub] || []).map(
              renderSetting
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
