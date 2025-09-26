import { spawn, ChildProcess } from "child_process";
import { WebSocketServer } from "ws";
import * as http from "http";
import * as fs from "fs";
import * as path from "path";

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
  const wss = new WebSocketServer({ port: 3000 });

  wss.on("connection", function connection(ws): void {
    console.log("WebSocket client connected");

    let pyright: ChildProcess | null = null;
    let buffer: string = "";
    let messageQueue: string[] = [];
    let isProcessing = false;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    function createPyrightProcess(): ChildProcess {
      const process = spawn("pyright-langserver", ["--stdio"], {
        stdio: ["pipe", "pipe", "pipe"],
      });

      process.on("error", (error: Error): void => {
        console.error("Pyright process error:", error);
        attemptReconnect();
      });

      process.on(
        "close",
        (code: number | null, signal: string | null): void => {
          console.log(
            `Pyright process exited with code ${code}, signal ${signal}`
          );
          if (code !== 0 && code !== null) {
            attemptReconnect();
          }
        }
      );

      if (process.stderr) {
        process.stderr.on("data", (data: Buffer): void => {
          console.error("Pyright stderr:", data.toString());
        });
      }

      if (process.stdout) {
        process.stdout.on("data", (data: Buffer): void => {
          handlePyrightOutput(data);
        });
      }

      return process;
    }

    function handlePyrightOutput(data: Buffer): void {
      buffer += data.toString();

      // Process all complete messages in the buffer
      while (true) {
        const match: RegExpMatchArray | null = buffer.match(
          /^Content-Length: (\d+)\r?\n\r?\n/
        );
        if (!match) break;

        const contentLength: number = parseInt(match[1]!, 10);
        const headerLength: number = match[0].length;

        if (buffer.length >= headerLength + contentLength) {
          const message: string = buffer.substring(
            headerLength,
            headerLength + contentLength
          );

          // Send each LSP message as a separate WebSocket message
          if (ws.readyState === ws.OPEN) {
            try {
              // Validate JSON before sending
              JSON.parse(message);
              ws.send(message);
            } catch (error) {
              console.error("Invalid JSON message from pyright:", error);
              console.error("Message:", message);
            }
          }

          buffer = buffer.substring(headerLength + contentLength);
        } else {
          break;
        }
      }
    }

    async function processMessageQueue(): Promise<void> {
      if (isProcessing || !pyright || !pyright.stdin) {
        return;
      }

      isProcessing = true;

      while (messageQueue.length > 0 && pyright && pyright.stdin) {
        const jsonMessage = messageQueue.shift()!;

        try {
          // Validate JSON before sending to pyright
          JSON.parse(jsonMessage);

          const contentLength: number = Buffer.byteLength(jsonMessage, "utf8");
          const fullMessage = `Content-Length: ${contentLength}\r\n\r\n${jsonMessage}`;

          if (pyright.stdin.writable) {
            const written = pyright.stdin.write(fullMessage);

            if (!written) {
              await new Promise<void>((resolve) => {
                pyright!.stdin!.once("drain", resolve);
                setTimeout(resolve, 5000);
              });
            }

            // Small delay to prevent overwhelming pyright
            await new Promise((resolve) => setTimeout(resolve, 10));
          } else {
            messageQueue.unshift(jsonMessage);
            break;
          }
        } catch (error) {
          console.error("Invalid JSON from Monaco:", error);
          console.error("Message:", jsonMessage);
        }
      }

      isProcessing = false;
    }

    function attemptReconnect(): void {
      if (
        reconnectAttempts < maxReconnectAttempts &&
        ws.readyState === ws.OPEN
      ) {
        reconnectAttempts++;
        console.log(
          `Attempting to reconnect pyright (attempt ${reconnectAttempts}/${maxReconnectAttempts})`
        );

        setTimeout(() => {
          pyright = createPyrightProcess();
          processMessageQueue();
        }, 1000 * reconnectAttempts);
      } else {
        console.error("Max reconnection attempts reached or WebSocket closed");
        ws.close();
      }
    }

    pyright = createPyrightProcess();

    ws.on("message", function message(data): void {
      const msg: string = data.toString();
      messageQueue.push(msg);
      processMessageQueue();
    });

    ws.on("close", (): void => {
      console.log("WebSocket client disconnected");
      if (pyright) {
        pyright.kill("SIGTERM");
        setTimeout(() => {
          if (pyright && !pyright.killed) {
            pyright.kill("SIGKILL");
          }
        }, 5000);
      }
    });

    ws.on("error", (error): void => {
      console.error("WebSocket error:", error);
    });

    ws.on("message", () => {
      reconnectAttempts = 0;
    });
  });

  console.log("WebSocket proxy server listening on port 3000");
}
