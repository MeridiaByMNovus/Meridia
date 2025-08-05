import * as monaco from "monaco-editor";
import * as vscode from "vscode";
import { whenReady } from "@codingame/monaco-vscode-theme-defaults-default-extension";
import "@codingame/monaco-vscode-python-default-extension";
import { LogLevel } from "vscode/services";
import { createConfiguredEditor, createModelReference } from "vscode/monaco";
import { ExtensionHostKind, registerExtension } from "vscode/extensions";
import getConfigurationServiceOverride, {
    updateUserConfiguration,
} from "@codingame/monaco-vscode-configuration-service-override";
import getKeybindingsServiceOverride from "@codingame/monaco-vscode-keybindings-service-override";
import getThemeServiceOverride from "@codingame/monaco-vscode-theme-service-override";
import getTextmateServiceOverride from "@codingame/monaco-vscode-textmate-service-override";
import { initServices, MonacoLanguageClient } from "monaco-languageclient";
import {
    CloseAction,
    ErrorAction,
    MessageTransports,
} from "vscode-languageclient";
import {
    WebSocketMessageReader,
    WebSocketMessageWriter,
    toSocket,
} from "vscode-ws-jsonrpc";
import {
    RegisteredFileSystemProvider,
    registerFileSystemOverlay,
    RegisteredMemoryFile,
} from "@codingame/monaco-vscode-files-service-override";
import { Uri } from "vscode";
import { createUrl } from "../../common/client-commons.js";

const languageId = "python";
let languageClient: MonacoLanguageClient;

const createWebSocket = (url: string): WebSocket => {
    const webSocket = new WebSocket(url);
    webSocket.onopen = async () => {
        const socket = toSocket(webSocket);
        const reader = new WebSocketMessageReader(socket);
        const writer = new WebSocketMessageWriter(socket);
        languageClient = createLanguageClient({
            reader,
            writer,
        });
        await languageClient.start();
        reader.onClose(() => languageClient.stop());
    };
    return webSocket;
};

const createLanguageClient = (
    transports: MessageTransports,
): MonacoLanguageClient => {
    return new MonacoLanguageClient({
        name: "Pyright Language Client",
        clientOptions: {
            documentSelector: [languageId],

            errorHandler: {
                error: () => ({ action: ErrorAction.Continue }),
                closed: () => ({ action: CloseAction.DoNotRestart }),
            },

            workspaceFolder: {
                index: 0,
                name: "workspace",
                uri: monaco.Uri.parse("/workspace"),
            },
            synchronize: {
                fileEvents: [vscode.workspace.createFileSystemWatcher("**")],
            },
        },

        connectionProvider: {
            get: () => {
                return Promise.resolve(transports);
            },
        },
    });
};

export const startPythonClient = async () => {
    await initServices({
        userServices: {
            ...getThemeServiceOverride(),
            ...getTextmateServiceOverride(),
            ...getConfigurationServiceOverride(),
            ...getKeybindingsServiceOverride(),
        },
        debugLogging: true,
        workspaceConfig: {
            workspaceProvider: {
                trusted: true,
                workspace: {
                    workspaceUri: Uri.file("/workspace"),
                },
                async open() {
                    return false;
                },
            },
            developmentOptions: {
                logLevel: LogLevel.Debug,
            },
        },
    });

    console.log("Before ready themes");
    await whenReady();
    console.log("After ready themes");

    const extension = {
        name: "python-client",
        publisher: "monaco-languageclient-project",
        version: "1.0.0",
        engines: {
            vscode: "^1.78.0",
        },
        contributes: {
            languages: [
                {
                    id: languageId,
                    aliases: ["Python"],
                    extensions: [".py", ".pyi"],
                },
            ],
            commands: [
                {
                    command: "pyright.restartserver",
                    title: "Pyright: Restart Server",
                    category: "Pyright",
                },
                {
                    command: "pyright.organizeimports",
                    title: "Pyright: Organize Imports",
                    category: "Pyright",
                },
            ],
            keybindings: [
                {
                    key: "ctrl+k",
                    command: "pyright.restartserver",
                    when: "editorTextFocus",
                },
            ],
        },
    };
    registerExtension(extension, ExtensionHostKind.LocalProcess);

    updateUserConfiguration(`{
        "editor.fontSize": 14,
        "workbench.colorTheme": "Default Dark Modern"
    }`);

    const fileSystemProvider = new RegisteredFileSystemProvider(false);
    fileSystemProvider.registerFile(
        new RegisteredMemoryFile(
            vscode.Uri.file("/workspace/hello.py"),
            'print("Hello, World!")',
        ),
    );
    registerFileSystemOverlay(1, fileSystemProvider);

    const registerCommand = async (
        cmdName: string,
        handler: (...args: unknown[]) => void,
    ) => {
        const commands = await vscode.commands.getCommands(true);
        if (!commands.includes(cmdName)) {
            vscode.commands.registerCommand(cmdName, handler);
        }
    };

    await registerCommand("pyright.restartserver", (...args: unknown[]) => {
        languageClient.sendRequest("workspace/executeCommand", {
            command: "pyright.restartserver",
            arguments: args,
        });
    });
    await registerCommand("pyright.organizeimports", (...args: unknown[]) => {
        languageClient.sendRequest("workspace/executeCommand", {
            command: "pyright.organizeimports",
            arguments: args,
        });
    });

    const modelRef = await createModelReference(
        monaco.Uri.file("/workspace/hello.py"),
    );
    modelRef.object.setLanguageId(languageId);

    createConfiguredEditor(document.getElementById("container")!, {
        model: modelRef.object.textEditorModel,
        automaticLayout: true,
    });

    createWebSocket(
        createUrl(
            "localhost",
            30001,
            "/pyright",
            {
                authorization: "UserAuth",
            },
            false,
        ),
    );
};
