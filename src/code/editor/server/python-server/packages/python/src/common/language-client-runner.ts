import {
    LanguageClientRunConfig,
    createMonacoEditor,
    createUrl,
    doInit,
    initWebSocketAndStartClient,
} from "./client-commons.js";

export const runLanguageClient = async (config: LanguageClientRunConfig) => {
    const languageId = config.registerConfig.id;
    await doInit(config.vscodeApiInit, config.registerConfig);
    const editorDom = document.getElementById(config.htmlElementId);
    if (editorDom) {
        await createMonacoEditor({
            htmlElement: editorDom,
            content: config.defaultContent,
            languageId,
        });
        const url = createUrl(
            config.clientUrl,
            config.serverPort,
            config.serverPath,
        );
        initWebSocketAndStartClient(url, languageId);
    } else {
        console.error(`no dom element for css id: ${config.htmlElementId}`);
    }
};
