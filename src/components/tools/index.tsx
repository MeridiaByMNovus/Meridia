import { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";

import { Table } from "./chart-engines/table";
import { BarChart } from "./chart-engines/bar-chart";
import { PieChart } from "./chart-engines/pie-chart";
import { LineChart } from "./chart-engines/line-chart";

import { useAppDispatch, useAppSelector } from "../../helpers/hooks";
import {
  update_tools_data,
  update_tools_window_state,
} from "../../helpers/state-manager";

import "./styling/index.css";
import "./styling/table.css";
import Tooltip from "../../../support/ui-kit/tooltip/Tooltip";

export const Tools = () => {
  let data = useAppSelector((state) => state.main.toolsdata);
  const dispatch = useAppDispatch();

  const [tools, setTools] = useState<any[]>([
    "table",
    "bar_chart",
    "line_chart",
    "pie_chart",
  ]);
  const [toolsContent, setToolsContent] = useState<any[]>([
    {
      table: <Table data={data} />,
      bar_chart: <BarChart data={data} />,
      line_chart: <LineChart data={data} />,
      pie_chart: <PieChart data={data} />,
    },
  ]);

  const tools_in_a_window = useAppSelector(
    (state) => state.main.tools_in_a_window
  );

  const [currentTool, setCurrentTool] = useState<string>("table");

  window.electron.ipcRenderer.on(
    "update-tools-data",
    (event: any, data: any) => {
      dispatch(update_tools_data(data));
      console.log(data);
    }
  );

  useEffect(() => {
    window.electron.ipcRenderer.on("tools-window-closed", () => {
      dispatch(update_tools_window_state(false));
    });
  }, [dispatch]);

  useEffect(() => {
    if (tools_in_a_window) {
      window.electron.show_tools();
    } else {
      window.electron.hide_tools();
    }
  }, [tools_in_a_window, dispatch]);

  return (
    <div className="tools-wrapper">
      {tools_in_a_window ? (
        <h1>In a different window</h1>
      ) : (
        <div className="tools">
          <div className="tools-content">
            <p>{currentTool.toLocaleUpperCase()}</p>
            {toolsContent.map((toolContent) => toolContent[currentTool])}
          </div>
          <ul>
            {tools.map((tool) => (
              <li
                className={`tool ${currentTool === tool && "tool-active"}`}
                id={tool}
                onClick={() => setCurrentTool(tool)}
              >
                <Tooltip
                  text={`${
                    tool.charAt(0).toUpperCase().replace("_", " ") +
                    tool.slice(1).replace("_", " ")
                  }`}
                >
                  {tool.charAt(0).toUpperCase().replace("_", " ") +
                    tool.slice(1).replace("_", " ")}
                </Tooltip>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
