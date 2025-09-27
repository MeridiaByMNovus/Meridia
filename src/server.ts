import { WebSocketServer } from "ws";
import { spawn, ChildProcess } from "child_process";
import { createWebSocketConnection, forward } from "vscode-ws-jsonrpc/server";
import {
  createConnection,
  createServerProcess,
} from "vscode-ws-jsonrpc/server";
import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { Storage } from "./code/base/services/storage.service";

export class HttpServer {
  public _port: number;
  public _serveDir: string;
  private _server: http.Server;

  constructor(port: number = 8080) {
    this._port = port;
    this._serveDir = path.join(__dirname, "..", "build");

    this._server = http.createServer(this.requestHandler.bind(this));
  }

  private requestHandler(req: http.IncomingMessage, res: http.ServerResponse) {
    let reqUrl = req.url || "/";
    if (reqUrl === "/") {
      reqUrl = "/index.html";
    }

    const filePath = path.join(this._serveDir, decodeURI(reqUrl));
    const ext = path.extname(filePath).toLowerCase();

    const mimeTypes: { [key: string]: string } = {
      ".html": "text/html",
      ".js": "application/javascript",
      ".css": "text/css",
      ".json": "application/json",
      ".wasm": "application/wasm",
      ".svg": "image/svg+xml",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
    };

    const contentType = mimeTypes[ext] || "application/octet-stream";

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Not Found");
        return;
      }

      res.writeHead(200, { "Content-Type": contentType });
      res.end(data);
    });
  }

  public _serve() {
    this._server.listen(this._port, () => {
      console.log(
        `Server running at http://localhost:${this._port}/ serving ${this._serveDir}`
      );
    });
  }

  public _stop() {
    this._server.close(() => {
      console.log("Server stopped");
    });
  }
}

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

    const serverConnection = createServerProcess(
      "Pyright",
      "pyright-langserver",
      ["--stdio"],
      { stdio: ["pipe", "pipe", "pipe"] }
    );
    forward(connection, serverConnection!);

    webSocket.on("close", () => {
      console.log("WebSocket disconnected");
      serverConnection!.dispose();
    });
  });

  console.log("LSP WebSocket server listening on port 3001");
}
