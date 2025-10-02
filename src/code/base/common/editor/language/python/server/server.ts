import { WebSocketServer } from "ws";
import { createServerProcess, forward } from "vscode-ws-jsonrpc/server";
import { createWebSocketConnection } from "vscode-ws-jsonrpc/server";
import { Storage } from "../../../../../services/storage.service";
import path from "path";

export function runPyrightLanguageServer() {
  Storage.store("pyright-port", 9273);

  const port = Storage.get("pyright-port");

  const wss = new WebSocketServer({ port: port });

  wss.on("connection", (webSocket) => {
    console.log("WebSocket client connected");

    const socket = {
      send: (content: any) => webSocket.send(content),
      onMessage: (cb: any) => webSocket.on("message", cb),
      onError: (cb: any) => webSocket.on("error", cb),
      onClose: (cb: any) => webSocket.on("close", cb),
      dispose: () => webSocket.close(),
    };

    const connection = createWebSocketConnection(socket);

    const executablePath = path.join(
      __dirname,
      "pyright",
      "langserver.index.js"
    );

    const serverConnection = createServerProcess(
      "Pyright",
      process.execPath,
      [executablePath, "--stdio"],
      {
        stdio: ["pipe", "pipe", "pipe"],
        env: {
          ...process.env,
          ELECTRON_RUN_AS_NODE: "1",
        },
      }
    );

    forward(connection, serverConnection!);

    webSocket.on("close", () => {
      console.log("WebSocket disconnected");
      serverConnection!.dispose();
    });
  });

  console.log("LSP WebSocket server listening on port 3001");
}

runPyrightLanguageServer();
