import {
  Model,
  init_workbench_gemini_model
} from "./chunk-W7AQ6ZXE.js";
import {
  __esm
} from "./chunk-KH45J4DC.js";

// src/code/workbench/common/workbench.gemini/workbench.gemini.chat.ts
var Chat;
var init_workbench_gemini_chat = __esm({
  "src/code/workbench/common/workbench.gemini/workbench.gemini.chat.ts"() {
    init_workbench_gemini_model();
    Chat = class {
      _model;
      constructor() {
        this._model = new Model().getModel();
      }
      async chat(_message, _history) {
        const contents = this._convert(_history, _message);
        const _response = await this._model.models.generateContent({
          model: "gemini-2.0-flash-001",
          contents
        });
        return _response.text;
      }
      _convert(_history, currentMessage) {
        const contents = [];
        for (const message of _history) {
          contents.push({
            role: message.isUser ? "user" : "model",
            parts: [
              {
                text: message.content
              }
            ]
          });
        }
        contents.push({
          role: "user",
          parts: [
            {
              text: currentMessage
            }
          ]
        });
        return contents;
      }
    };
  }
});

export {
  Chat,
  init_workbench_gemini_chat
};
