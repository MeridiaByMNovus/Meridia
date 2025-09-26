import { GoogleGenAI } from "@google/genai";
import { Model } from "./workbench.gemini.model.js";
import { IChatMessage } from "../../workbench.types.js";

export class Chat {
  private _model: GoogleGenAI;

  constructor() {
    this._model = new Model().getModel();
  }

  public async chat(_message: string, _history: IChatMessage[]) {
    const contents = this._convert(_history, _message);

    const _response = await this._model.models.generateContent({
      model: "gemini-2.0-flash-001",
      contents: contents,
    });

    return _response.text;
  }

  private _convert(_history: IChatMessage[], currentMessage: string) {
    const contents = [];

    for (const message of _history) {
      contents.push({
        role: message.isUser ? "user" : "model",
        parts: [
          {
            text: message.content,
          },
        ],
      });
    }

    contents.push({
      role: "user",
      parts: [
        {
          text: currentMessage,
        },
      ],
    });

    return contents;
  }
}
