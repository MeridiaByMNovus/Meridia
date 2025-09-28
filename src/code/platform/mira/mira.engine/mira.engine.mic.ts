import { Chat } from "../../../workbench/common/workbench.mira/workbench.mira.chat";
import { _voice } from "./mira.engine.voice";

export class Mic {
  private _pyshell: any | null = null;
  private isListening: boolean = false;
  private currentDir: string;
  private _path: string;

  constructor() {
    this.currentDir = window.path.__dirname;
    this._path = window.path.join([this.currentDir, "scripts", "mic.py"]);
  }

  public _start(): void {
    if (this.isListening) {
      return;
    }

    try {
      this._pyshell = window.python.createStreamingShell(this._path, []);

      if (!this._pyshell) {
        console.error("Failed to start Python voice recognition process");
        return;
      }

      this.isListening = true;
      console.log("Started voice recognition...");

      this._pyshell.onMessage((message: string) => {
        this._handleData(message);
      });

      this._pyshell.onError((error: Error) => {
        console.error("Voice recognition error:", error);
        this.isListening = false;
        this._pyshell = null;
      });

      this._pyshell.onClose(() => {
        console.log("Voice recognition process closed");
        this.isListening = false;
        this._pyshell = null;
      });
    } catch (error) {
      console.error("Failed to create Python shell:", error);
      this.isListening = false;
    }
  }

  public _stop(): void {
    if (!this.isListening || !this._pyshell) {
      console.warn("Mic is not currently listening");
      return;
    }

    try {
      this._pyshell.terminate();

      setTimeout(() => {
        if (this._pyshell && this.isListening) {
          console.warn("Force killing voice recognition process");
          this._pyshell.kill();
        }
      }, 5000);
    } catch (error) {
      console.error("Error stopping mic:", error);
    }

    this.isListening = false;
    console.log("Stopped voice recognition");
  }

  private async _handleData(data: string) {
    try {
      if (
        data.trim().startsWith("{") &&
        (data.includes('"partial"') || data.includes('"text"'))
      ) {
        const result = JSON.parse(data);

        if (result.partial !== undefined) {
          console.log("🎤 Partial:", result.partial);
          this._onPartialTranscription(result.partial);
        } else if (result.text !== undefined) {
          console.log("Final:", result.text);
          const _response = await new Chat().chat(result.text);
          console.log(_response);
          _voice.say(_response!);

          this._onFinalTranscription(result);
        }
      } else {
        console.log("🎤 Raw output:", data);
      }
    } catch (error) {
      console.log("🎤 Raw output:", data);
    }
  }

  private _onPartialTranscription(partialText: string): void {
    const transcriptionElement = document.getElementById("liveTranscription");
    if (transcriptionElement) {
      transcriptionElement.textContent = partialText;
      transcriptionElement.style.opacity = "0.7";
    }

    window.dispatchEvent(
      new CustomEvent("voicePartial", {
        detail: { text: partialText },
      })
    );
  }

  private _onFinalTranscription(result: any): void {
    const transcriptionElement = document.getElementById("liveTranscription");
    if (transcriptionElement) {
      transcriptionElement.textContent = result.text;
      transcriptionElement.style.opacity = "1";
    }

    const historyElement = document.getElementById("transcriptionHistory");
    if (historyElement) {
      const resultDiv = document.createElement("div");
      resultDiv.className = "transcription-result";
      resultDiv.innerHTML = `
        <div class="timestamp">${new Date().toLocaleTimeString()}</div>
        <div class="text">${result.text}</div>
      `;
      historyElement.appendChild(resultDiv);
      historyElement.scrollTop = historyElement.scrollHeight;
    }

    window.dispatchEvent(
      new CustomEvent("voiceFinal", {
        detail: { result },
      })
    );
  }

  public get listening(): boolean {
    return this.isListening;
  }
}

export const _mic = new Mic();
