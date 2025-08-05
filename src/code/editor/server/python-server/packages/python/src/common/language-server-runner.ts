import { WebSocketServer } from "ws";
import { Server } from "http";
import express from "express";
import { getLocalDirectory } from "../utils/fs-utils.js";
import { LanguageServerRunConfig, upgradeWsServer } from "./server-commons.js";

export const runLanguageServer = (
    languageServerRunConfig: LanguageServerRunConfig,
) => {
    process.on("uncaughtException", function (err) {
        console.error("Uncaught Exception: ", err.toString());
        if (err.stack) {
            console.error(err.stack);
        }
    });

    const app = express();

    const dir = getLocalDirectory(import.meta.url);
    app.use(express.static(dir));

    const httpServer: Server = app.listen(languageServerRunConfig.serverPort);
    const wss = new WebSocketServer(languageServerRunConfig.wsServerOptions);

    upgradeWsServer(languageServerRunConfig, {
        server: httpServer,
        wss,
    });
};
