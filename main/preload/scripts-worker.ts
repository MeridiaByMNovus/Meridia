import { ipcRenderer } from "electron";

ipcRenderer.on("show-tools", async (event, data) => {
  event.sender.send("send-tools-data", data);
});

ipcRenderer.on("send-tools-data", (event, parsedData) => {});

ipcRenderer.on("command-update-folder-structure", (event, data) => {
  event.sender.send("folder-updated", data.updatedData);
});

ipcRenderer.on("received-output", (_, data) => {
  const parentDiv = document.querySelector(".output-parent");
  if (!parentDiv) return;

  let outputDiv = document.querySelector("#output");
  if (!outputDiv) {
    outputDiv = document.createElement("div");
    outputDiv.id = "output";
    parentDiv.appendChild(outputDiv);
  }

  const lineWrapper = document.createElement("div");
  lineWrapper.classList.add("output-line");

  if (data.type === "command") {
    lineWrapper.textContent = data.content;
    lineWrapper.classList.add("output-command");
  } else if (data.type === "output") {
    lineWrapper.textContent = data.content;
    lineWrapper.classList.add("output-message");
  } else if (data.type === "end") {
    lineWrapper.textContent = data.content;
    lineWrapper.classList.add("output-end");
  }

  outputDiv.appendChild(lineWrapper);
});
