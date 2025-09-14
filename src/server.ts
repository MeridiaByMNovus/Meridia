import express from "express";
import bodyParser from "body-parser";

import { CompletionCopilot } from "monacopilot";
import { log } from "./code/base/common/functions";

export async function runServer() {
  const app = express();
  app.use(bodyParser.json());

  const copilot = new CompletionCopilot(process.env.MISTAL_API, {
    provider: "mistral",
    model: "codestral",
  });

  app.post("/completions", async (req, res) => {
    try {
      const body = await req.body;

      const completion = await copilot.complete({
        body,
      });

      return res.json(completion);
    } catch (err) {
      console.error("Error fetching AI completions:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const port = 56942;
  return new Promise<string>((resolve, reject) => {
    app
      .listen(port, () => {
        console.log(
          `Local completions HTTP server running on http://localhost:${port}`
        );
        resolve(`http://localhost:${port}/completions`);
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}
