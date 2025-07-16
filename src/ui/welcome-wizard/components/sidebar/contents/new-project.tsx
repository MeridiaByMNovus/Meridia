import { useEffect, useState } from "react";
import { FolderOutlined } from "@ant-design/icons";
import { Checkbox } from "antd";
import { useTabs } from "../../../../../hooks/use_tab";
import { TabView } from "../../../../components/tab_view";

export function NewProject({ set_data }: any) {
  const tabs = useTabs("venv");
  const [location, setLocation] = useState("C:\\");
  const [condaPath, setCondaPath] = useState("");
  const [condaValid, setCondaValid] = useState<boolean | null>(null);
  const [pythonVersions, setPythonVersions] = useState<
    { version_tag: string; cmd: string; version: string }[]
  >([]);
  const [selectedPythonCmd, setSelectedPythonCmd] = useState("");
  const [gitRepo, setGitRepo] = useState(false);
  const [welcomeScript, setWelcomeScript] = useState(false);

  useEffect(() => {
    const data = {
      path: location,
      is_python: selectedPythonCmd ? true : false,
      python_path: selectedPythonCmd && selectedPythonCmd,
      git: gitRepo,
      conda_path: condaPath && condaPath,
      welcome_script: welcomeScript,
    };
    set_data(data);
  }, [selectedPythonCmd, gitRepo, welcomeScript, condaPath, location]);

  useEffect(() => {
    window.electron.ipcRenderer
      .invoke("get-python-versions", "")
      .then((versions) => {
        setPythonVersions(versions);
        if (versions.length > 0) {
          setSelectedPythonCmd(versions[0].cmd);
        }
      });
  }, []);

  const pickFolder = async () => {
    const path = await window.electron.ipcRenderer.invoke(
      "dialog:open-folder",
      ""
    );
    if (path) setLocation(path);
  };

  const pickCondaExecutable = async () => {
    const path = await window.electron.ipcRenderer.invoke("dialog:open-file", [
      "",
    ]);
    if (!path) return;
    setCondaPath(path);
    const isValid = await window.electron.ipcRenderer.invoke(
      "check-conda-exe",
      path
    );
    setCondaValid(isValid);
    if (!isValid) {
      setCondaPath("");
    }
  };

  return (
    <div className="new-project-wrapper">
      <div className="input-item">
        <span className="title">Location:</span>
        <span className="input">
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <button onClick={pickFolder}>
            <FolderOutlined />
          </button>
        </span>
      </div>

      <div className="checkbox">
        <Checkbox
          checked={gitRepo}
          onChange={(e) => setGitRepo(e.target.checked)}
        >
          Create Git repository
        </Checkbox>
        <Checkbox
          checked={welcomeScript}
          onChange={(e) => setWelcomeScript(e.target.checked)}
        >
          Create a welcome script
        </Checkbox>
      </div>

      <div className="types">
        {["venv", "conda"].map((type) => (
          <span
            key={type}
            className={tabs.activeTab === type ? "active" : ""}
            onClick={() => tabs.setActiveTab(type)}
          >
            {type === "venv" ? "Project Venv" : "Base Conda"}
          </span>
        ))}
      </div>

      <div className="options">
        <TabView activeTab={tabs.activeTab} tab="venv">
          <div className="input-item">
            <span className="title">Python Version:</span>
            <span className="input">
              <select
                value={selectedPythonCmd}
                onChange={(e) => setSelectedPythonCmd(e.target.value)}
              >
                {pythonVersions.map((python, index) => (
                  <option key={index} value={python.cmd}>
                    {python.version} ({python.cmd})
                  </option>
                ))}
              </select>
              <button>
                <FolderOutlined />
              </button>
            </span>
          </div>
        </TabView>

        <TabView activeTab={tabs.activeTab} tab="conda">
          <div className="input-item">
            <span className="title">Path to conda:</span>
            <span className="input">
              <input
                value={condaPath}
                onChange={(e) => setCondaPath(e.target.value)}
              />
              <button onClick={pickCondaExecutable}>
                <FolderOutlined />
              </button>
            </span>
            {condaValid === false && (
              <span className="error-text">Invalid conda executable</span>
            )}
            {condaValid === true && (
              <span className="success-text">Conda executable validated</span>
            )}
          </div>
        </TabView>
      </div>
    </div>
  );
}
