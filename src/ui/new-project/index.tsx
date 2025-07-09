import { useEffect, useState } from "react";

import { FolderOpenOutlined } from "@ant-design/icons/lib";

import { ReactComponent as Minimize } from "../../assets/window-controls/minimize.svg";
import { ReactComponent as Close } from "../../assets/window-controls/close.svg";

import Logo from "../../assets/logo.png";

import "./index.css";

export default function NewProject() {
  const [projectLocation, setProjectLocation] = useState("");
  const [pythonInterpreter, setPythonInterpreter] = useState("");

  const browseFolder = async (setter: (val: string) => void) => {
    const path: any = await window.electron.ipcRenderer.invoke(
      "dialog:open-folder",
      ""
    );
    if (path) {
      console.log("Selected folder:", path);
      setter(path);
    }
  };

  const browseFile = async (setter: (val: string) => void) => {
    const path: any = await window.electron.ipcRenderer.invoke(
      "dialog:open-file",
      ""
    );
    if (path) {
      console.log("Selected file:", path);
      setter(path);
    }
  };

  const handleWindowAction = (action: any) => {
    window.electron.ipcRenderer.invoke(action, "");
  };

  return (
    <div className="new-project">
      {/* Title Bar */}
      <div className="title-bar">
        <div className="part">
          <img
            src={Logo}
            alt="Logo"
            style={{
              width: "28px",
              height: "auto",
              borderRadius: "12px",
              marginLeft: "12px",
            }}
          />
        </div>
        <div className="part">
          <div className="window-controls">
            <button onClick={() => handleWindowAction("new-project-minimize")}>
              <Minimize />
            </button>
            <button onClick={() => handleWindowAction("new-project-close")}>
              <Close />
            </button>
          </div>
        </div>
      </div>

      {/* Project Options */}
      <div className="options">
        <div className="field">
          <label>Project Name:</label>
          <div className="input-field">
            <input type="text" placeholder="MyMeridiaProject" />
          </div>
        </div>

        <div className="field">
          <label>Project Location:</label>
          <div className="input-field">
            <input
              type="text"
              placeholder="C:/Users/User/Projects"
              value={projectLocation}
              onChange={(e) => setProjectLocation(e.target.value)}
            />
            <FolderOpenOutlined
              onClick={() => browseFolder(setProjectLocation)}
            />
          </div>
        </div>

        <div className="field">
          <label>Python Interpreter:</label>
          <div className="input-field">
            <input
              type="text"
              placeholder="Path to python.exe"
              value={pythonInterpreter}
              onChange={(e) => setPythonInterpreter(e.target.value)}
            />
            <FolderOpenOutlined
              onClick={() => browseFile(setPythonInterpreter)}
            />
          </div>
        </div>

        <div className="field">
          <label>Environment Setup:</label>
          <select>
            <option>New Virtualenv Environment</option>
            <option>Use Existing Virtualenv</option>
            <option>Use Conda</option>
          </select>
        </div>

        <div className="field">
          <label>Starter Template:</label>
          <select>
            <option>Empty Project</option>
            <option>Pandas + Matplotlib (Data Science)</option>
            <option>Flask API Boilerplate</option>
          </select>
        </div>

        <div className="field checkbox-group">
          <label>
            <input type="checkbox" /> Inherit global site-packages
          </label>
        </div>

        <div className="field checkbox-group">
          <label>
            <input type="checkbox" /> Make environment available to all Meridia
            projects
          </label>
        </div>

        <div className="field checkbox-group">
          <label>
            <input type="checkbox" /> Open project after creation
          </label>
        </div>

        <div className="buttons">
          <button className="primary">Create Project</button>
          <button className="secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}
