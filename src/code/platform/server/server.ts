import http from "http";
import fs from "fs/promises";
import fssync from "fs";
import path from "path";
import mime from "mime-types";

export class Server {
  private server!: http.Server;
  public port = 3123;
  private outDir = path.resolve(__dirname, "../../../../out");

  constructor() {
    this.start();
  }

  private async readJsonBody(req: http.IncomingMessage) {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const raw = Buffer.concat(chunks).toString("utf8");
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private async handleApi(req: http.IncomingMessage, res: http.ServerResponse) {
    const body = ["POST", "PUT", "PATCH"].includes(
      (req.method || "").toUpperCase()
    )
      ? await this.readJsonBody(req)
      : null;

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({ ok: true, path: req.url, method: req.method, body })
    );
  }

  private async serveFile(res: http.ServerResponse, filePath: string) {
    let ctype = mime.lookup(filePath) || "application/octet-stream";
    if (filePath.endsWith(".js") || filePath.endsWith(".mjs")) {
      ctype = "text/javascript";
    }
    res.writeHead(200, { "Content-Type": ctype as string });
    const b = await fs.readFile(filePath);
    res.end(b);
  }

  private start() {
    this.server = http.createServer(async (req, res) => {
      const u = decodeURIComponent((req.url || "/").split("?")[0]);

      if (u.startsWith("/api/")) return this.handleApi(req, res);

      const filePath = path.join(this.outDir, u);

      if (fssync.existsSync(filePath) && fssync.statSync(filePath).isFile()) {
        return this.serveFile(res, filePath);
      }

      if (u.includes(".")) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        return res.end("404 Not Found");
      }

      const indexPath = path.join(this.outDir, "index.html");
      if (fssync.existsSync(indexPath)) {
        return this.serveFile(res, indexPath);
      }

      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
    });

    this.server.listen(this.port, () => {
      console.log(`http://localhost:${this.port}`);
    });
  }
}
