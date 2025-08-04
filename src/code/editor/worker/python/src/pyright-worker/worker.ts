import "./polyfills/process.patch.ts";
import "./polyfills/fs.patch.ts";
import "./polyfills/timeout.patch.js";

import {
  createFromRealFileSystem,
  RealTempFile,
} from "pyright-root/packages/pyright-internal/src/common/realFileSystem";
import { PyrightFileSystem } from "pyright-root/packages/pyright-internal/src/pyrightFileSystem";
import { PyrightServer } from "pyright-root/packages/pyright-internal/src/server";
import {
  BrowserMessageReader,
  BrowserMessageWriter,
  createMessageConnection,
  DataCallback,
  Disposable,
  Event,
  MessageReader,
  PartialMessageInfo,
  SharedArraySenderStrategy,
  SharedArrayReceiverStrategy,
} from "vscode-languageserver/browser";
import { createConnection } from "vscode-languageserver/node";
import {
  InitializedNotification,
  Connection as NodeConnection,
} from "vscode-languageserver";
import { Connection as BrowserConnection } from "vscode-languageserver/browser.js";
// import * as BrowserFS from "browserfs";
import * as ZenFS from "@zenfs/core";
import * as fs from "fs";
import typeshedZip from "../../assets/typeshed-fallback.zip";
import { Buffer } from "buffer";
import { Uri } from "pyright-root/packages/pyright-internal/src/common/uri/uri.js";
import { FileUri } from "pyright-root/packages/pyright-internal/src/common/uri/fileUri";
import { BaseUri } from "pyright-root/packages/pyright-internal/src/common/uri/baseUri.js";
import { ZipFS, Zip } from "@zenfs/archives";


import path from "path";
import {
  InitializeMsg,
  MsgInitServer,
  MsgServerInitialized,
  MsgServerLoaded,
  UserFolder,
} from "../message.js";

async function initFs(typeshedFallbackZip?: ArrayBuffer | false) {
  await ZenFS.configure({
    mounts: {
      "/typeshed-fallback":
        typeshedFallbackZip === false
          ? ZenFS.InMemory
          : ({
              backend: Zip,
              data: typeshedFallbackZip || typeshedZip,
            } as any),
      "/tmp": ZenFS.InMemory,
    },
  });
}

function createUserFiles(parentPath: string, folder: UserFolder) {
  const zenfs = ZenFS.fs;
  (self as any).zenfs = ZenFS.fs;

  zenfs.mkdirSync(parentPath, { recursive: true });

  for (const name in folder) {
    if (typeof folder[name] === "string") {
      zenfs.writeFileSync(path.join(parentPath, name), folder[name], {
        encoding: "utf-8",
      });
    } else if (folder[name] instanceof ArrayBuffer) {
      zenfs.mkdirSync(path.join(parentPath, name));
      zenfs.mount(
        path.join(parentPath, name),
        new ZipFS(name, folder[name] as ArrayBuffer) as any
      );
    } else {
      createUserFiles(path.join(parentPath, name), folder[name]);
    }
  }
}

async function handleInitServer(msg: MsgInitServer) {
  await initFs(msg.typeshedFallback);
  createUserFiles("/typings", msg.userFiles);

  postMessage(<MsgServerInitialized>{
    type: "serverInitialized",
  });

  onmessage = null;

  const reader = new BrowserMessageReader(self as any);
  const writer = new BrowserMessageWriter(self as any);
  const connection = createConnection(reader, writer, {
    cancellationStrategy: {
      sender: new SharedArraySenderStrategy(),
      receiver: new SharedArrayReceiverStrategy(),
    },
  });

  let server = new PyrightServer(connection as any, 0);

  return server;
}

async function init() {
  // await initFs();

  postMessage(<MsgServerLoaded>{
    type: "serverLoaded",
  });

  onmessage = (inMessage) => {
    const msg = inMessage.data as InitializeMsg;

    switch (msg.type) {
      case "initServer":
        handleInitServer(msg);
        break;
    }
  };
}

init();
