import { WebSocketServer } from "ws";
import { createServerProcess, forward } from "vscode-ws-jsonrpc/server";
import { createWebSocketConnection } from "vscode-ws-jsonrpc/server";
import { Storage } from "../../../base/services/storage.service.js";
import path from "path";

export function _run() {
  Storage.store("language-port", 9273);

  const port = Storage.get("language-port");

  const wss = new WebSocketServer({ port: port });

  wss.on("connection", (webSocket) => {
    const socket = {
      send: (content: any) => webSocket.send(content),
      onMessage: (cb: any) => webSocket.on("message", cb),
      onError: (cb: any) => webSocket.on("error", cb),
      onClose: (cb: any) => webSocket.on("close", cb),
      dispose: () => webSocket.close(),
    };

    const connection = createWebSocketConnection(socket);

    const _pyright = path.join(__dirname, "pyright", "langserver.index.js");

    const serverConnection = createServerProcess(
      "Pyright",
      process.execPath,
      [_pyright, "--stdio"],
      {
        stdio: ["pipe", "pipe", "pipe"],
        env: {
          ...process.env,
          ELECTRON_RUN_AS_NODE: "1",
        },
      }
    );

    forward(connection, serverConnection!);

    webSocket.on("open", () => {
      console.log("Websocked Connected");
    });

    webSocket.on("message", (data) => {
      console.log("pyright", data);
    });

    webSocket.on("close", () => {
      serverConnection!.dispose();
    });
  });
}

_run();
