import { editor, languages } from "monaco-editor";
import {
    createConfiguredEditor,
    createModelReference,
    IReference,
    ITextFileEditorModel,
} from "vscode/monaco";
import "@codingame/monaco-vscode-theme-defaults-default-extension";
import "@codingame/monaco-vscode-json-default-extension";
import getConfigurationServiceOverride from "@codingame/monaco-vscode-configuration-service-override";
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
import { Uri } from "vscode";

export interface LanguageClientRunConfig {
    vscodeApiInit: boolean;
    clientUrl: string;
    serverPath: string;
    serverPort: number;
    registerConfig: languages.ILanguageExtensionPoint;
    defaultContent: string;
    /** CSS id selector */
    htmlElementId: string;
}

export const createLanguageClient = (
    transports: MessageTransports,
    languageId: string,
): MonacoLanguageClient => {
    return new MonacoLanguageClient({
        name: "Sample Language Client",
        clientOptions: {
            documentSelector: [languageId],
            errorHandler: {
                error: () => ({ action: ErrorAction.Continue }),
                closed: () => ({ action: CloseAction.DoNotRestart }),
            },
        },
        connectionProvider: {
            get: () => {
                return Promise.resolve(transports);
            },
        },
    });
};

export const createUrl = (
    hostname: string,
    port: number,
    path: string,
    searchParams: Record<string, string | string[]> = {},
    secure: boolean = location.protocol === "https:",
): string => {
    const protocol = secure ? "wss" : "ws";
    const url = new URL(`${protocol}://${hostname}:${port}${path}`);

    for (const [key, value] of Object.entries(searchParams)) {
        let output: string | undefined;
        if (value instanceof Array) {
            output = value.join(",");
        } else {
            output = value?.toString();
        }
        url.searchParams.set(key, output);
    }

    return url.toString();
};

/** parameterized version , support all languageId */
export const initWebSocketAndStartClient = (
    url: string,
    languageId: string,
): WebSocket => {
    const webSocket = new WebSocket(url);
    webSocket.onopen = () => {
        const socket = toSocket(webSocket);
        const reader = new WebSocketMessageReader(socket);
        const writer = new WebSocketMessageWriter(socket);
        const languageClient = createLanguageClient(
            {
                reader,
                writer,
            },
            languageId,
        );
        languageClient.start();
        reader.onClose(() => languageClient.stop());
    };
    return webSocket;
};

export type ExampleJsonEditor = {
    languageId: string;
    editor: editor.IStandaloneCodeEditor;
    uri: Uri;
    modelRef: IReference<ITextFileEditorModel>;
};

/* parameterized version, support for any lang */
export const doInit = async (
    vscodeApiInit: boolean,
    registerConfig: languages.ILanguageExtensionPoint,
) => {
    if (vscodeApiInit === true) {
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
            },
        });
        languages.register(registerConfig);
    }
};

/* parameterized version, support for any lang */
export const createMonacoEditor = async (config: {
    htmlElement: HTMLElement;
    content: string;
    languageId: string;
}) => {
    const uri = Uri.parse("/workspace/model.json");
    const modelRef = await createModelReference(uri, config.content);
    modelRef.object.setLanguageId(config.languageId);
    const editor = createConfiguredEditor(config.htmlElement, {
        model: modelRef.object.textEditorModel,
        glyphMargin: true,
        lightbulb: {
            enabled: true,
        },
        automaticLayout: true,
        wordBasedSuggestions: "off",
    });

    const result = {
        editor,
        uri,
        modelRef,
    } as ExampleJsonEditor;
    return Promise.resolve(result);
};
