import { useAppSelector, useAppDispatch } from "../../helpers/hooks";
import { update_settings } from "../../helpers/state-manager";
import { Select, InputNumber, Switch, Input, Typography, Divider } from "antd";
import { useState, useEffect } from "react";

const { Option } = Select;
const { Text, Title } = Typography;

const SettingsComponent = () => {
  const dispatch = useAppDispatch();
  const currentSettings: any = useAppSelector(
    (state) => state.main.editorSettings
  );
  const [settings, setSettings] = useState(currentSettings);
  const [search, setSearch] = useState("");

  // Sync settings to electron and redux when settings change
  useEffect(() => {
    window.electron.set_settings(settings);
    dispatch(update_settings(settings));
  }, [settings, dispatch]);

  // Update settings state on any change
  const handleChange = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  // Group settings categories and their keys
  const groupedSettings = {
    "Editor Appearance": [
      "theme",
      "lineNumbers",
      "cursorBlinking",
      "fontSize",
      "fontFamily",
    ],
    "Editor Behavior": [
      "wordBasedSuggestions",
      "autoClosingBrackets",
      "acceptSuggestionOnEnter",
      "cursorSmoothCaretAnimation",
    ],
    Performance: ["renderWhitespace", "fontLigatures"],
    Advanced: [
      "suggestSelection",
      "bracketPairColorization",
      "minimap",
      "floatingPreview",
    ],
  };

  // Options for select fields
  const settingOptions: Record<string, string[]> = {
    theme: ["oneDark", "vs-dark", "light"],
    cursorBlinking: ["blink", "smooth", "phase", "expand", "solid"],
    cursorSmoothCaretAnimation: ["on", "off"],
    wordBasedSuggestions: ["allDocuments", "currentDocument", "off"],
    lineNumbers: ["on", "off", "relative", "interval"],
    acceptSuggestionOnEnter: ["on", "smart", "off"],
    autoClosingBrackets: [
      "always",
      "languageDefined",
      "beforeWhitespace",
      "never",
    ],
    suggestSelection: ["first", "recentlyUsed", "recentlyUsedByPrefix"],
    bracketPairColorization: ["on", "off"],
    minimap: ["on", "off"],
    renderWhitespace: ["none", "boundary", "selection", "all"],
    fontLigatures: ["on", "off"],
    floatingPreview: ["on", "off"],
  };

  // Normalize search input to lowercase for filtering
  const normalizedSearch = search.trim().toLowerCase();

  return (
    <div style={{ padding: 20, width: "100%" }}>
      <Input.Search
        placeholder="Search settings..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 20, width: "100%" }}
        allowClear
      />
      {Object.entries(groupedSettings).map(([category, keys]) => {
        // Filter keys based on search query matching key or its options
        const filteredKeys = keys.filter((key) => {
          if (!normalizedSearch) return true;
          // Check key itself
          if (key.toLowerCase().includes(normalizedSearch)) return true;
          // Check option values if exists
          if (settingOptions[key]) {
            return settingOptions[key].some((opt) =>
              opt.toLowerCase().includes(normalizedSearch)
            );
          }
          return false;
        });
        if (filteredKeys.length === 0) return null;

        return (
          <div key={category} style={{ marginBottom: 24 }}>
            <Title level={5}>{category}</Title>
            <Divider />
            {filteredKeys.map((key) => (
              <div
                key={key}
                style={{
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Text
                  strong
                  style={{ width: 150, textTransform: "capitalize" }}
                >
                  {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                </Text>
                {typeof settings[key] === "boolean" ? (
                  <Switch
                    checked={settings[key]}
                    onChange={(val) => handleChange(key, val)}
                    style={{ marginLeft: 10 }}
                  />
                ) : typeof settings[key] === "number" ? (
                  <InputNumber
                    value={settings[key]}
                    onChange={(val) => handleChange(key, val ?? 0)}
                    style={{ marginLeft: 10, width: 120 }}
                  />
                ) : typeof settings[key] === "string" && settingOptions[key] ? (
                  <Select
                    value={settings[key]}
                    onChange={(val) => handleChange(key, val)}
                    style={{ marginLeft: 10, width: 200 }}
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option: any) =>
                      (option?.children as string)
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  >
                    {settingOptions[key].map((option) => (
                      <Option key={option} value={option}>
                        {option}
                      </Option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    value={settings[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    style={{ marginLeft: 10, width: 200 }}
                    allowClear
                  />
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default SettingsComponent;
