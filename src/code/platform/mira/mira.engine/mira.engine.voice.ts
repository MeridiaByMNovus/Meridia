const path = window.path;
const python = window.python;
const fs = window.fs;

export class Voice {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private _analyzing: boolean = false;

  private _audioQueue: Array<() => Promise<string>> = [];
  private _isPlaying = false;

  constructor() {}

  private _audioAnalysis(audioElement: HTMLAudioElement) {
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;

    const source = this.audioContext.createMediaElementSource(audioElement);
    source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);

    this.dataArray = new Uint8Array(
      new ArrayBuffer(this.analyser.frequencyBinCount)
    );

    const circles = document.querySelectorAll(".circle");

    const analyzeAudio = () => {
      if (!this._analyzing || !this.analyser || !this.dataArray) return;

      this.analyser.getByteFrequencyData(this.dataArray as any);

      const volume =
        this.dataArray.reduce((a, b) => a + b) / this.dataArray.length;

      const scale = 1 + (volume / 255) * 1.5;
      const rotationDuration = Math.max(4, 10 - (volume / 255) * 10);
      const borderRadius = 48 - (volume / 255) * 10;

      const baseBlur = 20;
      const baseSpread = 10;
      const shadowMultiplier = 1 + (volume / 255) * 3;

      const newBlur = baseBlur * shadowMultiplier;
      const newSpread = baseSpread * shadowMultiplier;

      circles.forEach((circle: any) => {
        circle.style.transform = `translate(-50%, -50%) scale(${scale})`;
        circle.style.animationDuration = `${rotationDuration}s`;
        circle.style.setProperty("--dynamic-border-radius", `${borderRadius}%`);
        circle.style.boxShadow = `0 0 ${newBlur}px ${newSpread}px rgba(var(--color-orange), 0.05)`;
      });

      requestAnimationFrame(analyzeAudio);
    };

    this._analyzing = true;
    analyzeAudio();
  }

  private _wrapText(text: string, maxLength: number = 80): string[] {
    if (text.length <= maxLength) return [text];

    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;

      if (testLine.length <= maxLength) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          lines.push(word);
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  private _renderProgressive(
    words: any[],
    transcriptionElement: HTMLElement,
    currentWordIndex: number
  ) {
    const maxLineLength = 80;
    let html = "";
    let wordIndex = 0;

    const visibleWords = words.slice(0, currentWordIndex + 1);
    const allText = visibleWords.map((w) => w.word).join(" ");
    const lines = this._wrapText(allText, maxLineLength);

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const lineWords = lines[lineIndex]!.split(" ");

      for (let i = 0; i < lineWords.length; i++) {
        const word = lineWords[i];
        if (word!.trim()) {
          const isHighlighted = wordIndex === currentWordIndex;
          const className = isHighlighted
            ? "transcription-word highlight"
            : "transcription-word";
          html += `<span class="${className}" data-index="${wordIndex}">${word}</span>`;
          if (i < lineWords.length - 1) {
            html += " ";
          }
          wordIndex++;
        }
      }

      if (lineIndex < lines.length - 1) {
        html += "<br>";
      }
    }

    transcriptionElement.innerHTML = html;
  }

  private _renderBySentence(
    words: any[],
    transcriptionElement: HTMLElement,
    currentWordIndex: number
  ) {
    const sentences: { words: any[]; startIndex: number; endIndex: number }[] =
      [];
    let currentSentence: any[] = [];
    let sentenceStartIndex = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      currentSentence.push(word);

      if (/[.!?]$/.test(word.word.trim())) {
        sentences.push({
          words: [...currentSentence],
          startIndex: sentenceStartIndex,
          endIndex: i,
        });
        currentSentence = [];
        sentenceStartIndex = i + 1;
      }
    }

    if (currentSentence.length > 0) {
      sentences.push({
        words: currentSentence,
        startIndex: sentenceStartIndex,
        endIndex: words.length - 1,
      });
    }

    let currentSentenceIndex = -1;
    for (let i = 0; i < sentences.length; i++) {
      if (
        currentWordIndex >= sentences[i]!.startIndex &&
        currentWordIndex <= sentences[i]!.endIndex
      ) {
        currentSentenceIndex = i;
        break;
      }
    }

    const maxLineLength = 80;
    let html = "";
    let wordIndex = 0;

    for (let sentIndex = 0; sentIndex <= currentSentenceIndex; sentIndex++) {
      if (sentIndex >= sentences.length) break;

      const sentence = sentences[sentIndex];
      const sentenceText = sentence!.words.map((w) => w.word).join(" ");
      const lines = this._wrapText(sentenceText, maxLineLength);

      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const lineWords = lines[lineIndex]!.split(" ");

        for (let i = 0; i < lineWords.length; i++) {
          const word = lineWords[i];
          if (word!.trim()) {
            const isHighlighted = wordIndex === currentWordIndex;
            const className = isHighlighted
              ? "transcription-word highlight"
              : "transcription-word";
            html += `<span class="${className}" data-index="${wordIndex}">${word}</span>`;
            if (i < lineWords.length - 1) {
              html += " ";
            }
            wordIndex++;
          }
        }

        if (lineIndex < lines.length - 1) {
          html += "<br>";
        }
      }

      if (sentIndex < currentSentenceIndex) {
        html += "<br>";
      }
    }

    transcriptionElement.innerHTML = html;
  }

  private _highlight(
    currentWordIndex: number,
    transcriptionElement: HTMLElement
  ) {
    transcriptionElement
      .querySelectorAll(".transcription-word")
      .forEach((span) => span.classList.remove("highlight"));

    if (currentWordIndex >= 0) {
      const span = transcriptionElement.querySelector(
        `.transcription-word[data-index="${currentWordIndex}"]`
      );
      if (span) span.classList.add("highlight");
    }
  }

  private async _processQueue(): Promise<void> {
    if (this._isPlaying || this._audioQueue.length === 0) {
      return;
    }

    this._isPlaying = true;

    while (this._audioQueue.length > 0) {
      const nextAudio = this._audioQueue.shift();
      if (nextAudio) {
        await nextAudio();
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    this._isPlaying = false;
  }

  private async _playSingle(message: string): Promise<string> {
    const voiceScriptPath = path.join([path.__dirname, "scripts", "voice.py"]);
    const response = await python.executeScript(voiceScriptPath, [
      message,
      `${crypto.randomUUID()}.wav`,
    ]);

    const _json = JSON.parse(JSON.stringify(response));
    const voiceWavPath = JSON.parse(_json)["filepath"];

    const extractScriptPath = path.join([
      path.__dirname,
      "scripts",
      "extract_text.py",
    ]);
    const transcribeResponse = await python.executeScript(extractScriptPath, [
      voiceWavPath,
    ]);

    const transcriptionJsonString = transcribeResponse.join("\n");
    const words: { word: string; start: number; end: number }[] = JSON.parse(
      transcriptionJsonString
    );

    const transcriptionElement = document.getElementById("transcriptionText");
    if (!transcriptionElement) {
      return voiceWavPath;
    }

    return new Promise((resolve, reject) => {
      try {
        const buffer = fs.readFileBuffer(voiceWavPath);
        const uint8Array = new Uint8Array(buffer);
        const audioBlob = new Blob([uint8Array], { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        this._audioAnalysis(audio);

        transcriptionElement.innerHTML = "";

        const _update = () => {
          if (!audio) return;
          const currentTime = audio.currentTime;

          let idx = 0;
          while (idx < words.length && words[idx]!.start <= currentTime) {
            idx++;
          }
          const currentWordIndex = idx - 1;

          this._renderBySentence(words, transcriptionElement, currentWordIndex);

          if (idx < words.length) {
            requestAnimationFrame(_update);
          }
        };

        audio.onplay = () => {
          requestAnimationFrame(_update);
        };

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          this._analyzing = false;
          if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
          }
          resolve(voiceWavPath);
        };

        audio.onerror = (err) => {
          this._analyzing = false;
          if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
          }
          reject(err);
        };

        audio.play().catch((err) => {
          this._analyzing = false;
          reject(err);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  public async say(message: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this._audioQueue.push(async () => {
        try {
          const result = await this._playSingle(message);
          resolve(result);
          return result;
        } catch (err) {
          reject(err);
          return "";
        }
      });

      if (!this._isPlaying) {
        this._processQueue().catch(reject);
      }
    });
  }
}

export const _voice = new Voice();
