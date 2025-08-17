import hljs from "highlight.js";
import "highlight.js/styles/github.css";
import { ElementCore } from "../../layout/elementCore.js";
import { GeminiConnection } from "../common/connection.js";
import { marked } from "marked";

interface ChatMessage {
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export class GeminiLayout extends ElementCore {
  private agentEl: HTMLDivElement | null = null;
  private chatEl: HTMLDivElement | null = null;
  private tabContentEl: HTMLDivElement | null = null;
  private chatboxEl: HTMLDivElement | null = null;
  private geminiConnection: GeminiConnection | null = null;
  private messages: ChatMessage[] = [];
  private chatMessagesEl: HTMLDivElement | null = null;
  private isGenerating = false;
  private agentHead: HTMLDivElement | null = null;

  constructor() {
    super();
    this.render();
    this.setupTabContent();
    this.setupAgent();
    this.changeTabContent(this.agentEl!);
    this.setupConnection();
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  private setupConnection() {
    this.geminiConnection = new GeminiConnection();
  }

  private render() {
    this.elementEl = document.createElement("div");
    this.elementEl.className = "gm-layout";

    const tabs = document.createElement("div");
    tabs.className = "gm-tabs";

    const tabsHead = document.createElement("p");
    tabsHead.className = "gm-tabs-head";
    tabsHead.textContent = "Gemini";

    tabs.appendChild(tabsHead);
    this.elementEl.appendChild(tabs);
  }

  private setupTabContent() {
    this.tabContentEl = document.createElement("div");
    this.tabContentEl.className = "gm-tab-content";
    this.elementEl!.appendChild(this.tabContentEl);
  }

  private changeTabContent(content: HTMLDivElement) {
    if (this.tabContentEl) {
      this.tabContentEl.innerHTML = "";
      this.tabContentEl.appendChild(content);
    }
  }

  private setupAgent() {
    this.agentEl = document.createElement("div");
    this.agentEl.className = "gm-agent";

    const contentPart = document.createElement("div");
    contentPart.className = "gm-agent-content";

    const chatboxPart = document.createElement("div");
    chatboxPart.className = "gm-chatbox-wrapper";

    const defContent = document.createElement("div");
    defContent.className = "gm-agent-def";

    this.agentHead = document.createElement("div");
    this.agentHead.className = "gm-agent-head";

    const heading = document.createElement("span");
    heading.className = "gm-agent-head-title";
    heading.textContent = "Hello, Python Developer";

    const description = document.createElement("span");
    description.className = "gm-agent-head-desc";
    description.textContent = "What can I help you build today?";

    this.chatEl = document.createElement("div");
    this.chatEl.className = "gm-chat";

    this.chatMessagesEl = document.createElement("div");
    this.chatMessagesEl.className = "gm-chat-messages";

    this.agentHead.appendChild(heading);
    this.agentHead.appendChild(description);
    defContent.appendChild(this.agentHead);
    defContent.appendChild(this.chatMessagesEl);

    contentPart.appendChild(defContent);

    this.chatboxEl = document.createElement("div");
    this.chatboxEl.className = "gm-chatbox";

    const textarea = document.createElement("textarea");
    textarea.className = "gm-chatbox-input";
    textarea.placeholder = "Type your message here...";
    textarea.style.resize = "none";

    const options = document.createElement("div");
    options.className = "gm-chatbox-options";

    const sendButton = document.createElement("button");
    sendButton.className = "gm-send-btn";
    sendButton.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="var(--icon-color)" stroke-width="0.00024000000000000003"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M3.3938 2.20468C3.70395 1.96828 4.12324 1.93374 4.4679 2.1162L21.4679 11.1162C21.7953 11.2895 22 11.6296 22 12C22 12.3704 21.7953 12.7105 21.4679 12.8838L4.4679 21.8838C4.12324 22.0662 3.70395 22.0317 3.3938 21.7953C3.08365 21.5589 2.93922 21.1637 3.02382 20.7831L4.97561 12L3.02382 3.21692C2.93922 2.83623 3.08365 2.44109 3.3938 2.20468ZM6.80218 13L5.44596 19.103L16.9739 13H6.80218ZM16.9739 11H6.80218L5.44596 4.89699L16.9739 11Z" fill="var(--icon-color)"></path> </g></svg>`;
    sendButton.disabled = true;

    textarea.addEventListener("input", () => {
      sendButton.disabled = textarea.value.trim() === "" || this.isGenerating;
    });

    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (textarea.value.trim() && !this.isGenerating) {
          this.sendMessage(textarea.value.trim());
          textarea.value = "";
          sendButton.disabled = true;
        }
      }
    });

    sendButton.addEventListener("click", () => {
      if (textarea.value.trim() && !this.isGenerating) {
        this.sendMessage(textarea.value.trim());
        textarea.value = "";
        sendButton.disabled = true;
      }
    });

    options.appendChild(sendButton);
    this.chatboxEl.appendChild(textarea);
    this.chatboxEl.appendChild(options);

    chatboxPart.appendChild(this.chatboxEl);

    this.agentEl.appendChild(contentPart);
    this.agentEl.appendChild(chatboxPart);
  }

  private async sendMessage(content: string) {
    if (!this.geminiConnection || this.isGenerating) return;

    this.isGenerating = true;
    this.updateSendButton();

    this.addMessage(content, true);

    const typingEl = this.addTypingIndicator();

    try {
      const previousMessages = this.messages.slice(0, -1);
      const response = await this.geminiConnection.generate(
        content,
        previousMessages
      );

      this.removeTypingIndicator(typingEl);

      if (response && response.trim()) {
        this.addMessage(response, false);
      } else {
        this.addMessage(
          "I received an empty response. Please try again.",
          false
        );
      }
    } catch (error) {
      this.removeTypingIndicator(typingEl);
      this.addMessage(`Sorry, I encountered an error: ${error}`, false);
    } finally {
      this.isGenerating = false;
      this.updateSendButton();
    }
  }

  private addMessage(content: string, isUser: boolean) {
    const message: ChatMessage = {
      content,
      isUser,
      timestamp: new Date(),
    };

    this.messages.push(message);

    if (this.messages.length === 1 && this.agentHead) {
      this.agentHead.remove();
      this.agentHead = null;
    }

    this.renderMessage(message);
    this.scrollToBottom();
  }

  private async renderMessage(message: ChatMessage) {
    if (!this.chatMessagesEl) return;

    const messageEl = document.createElement("div");
    messageEl.className = `gm-message ${message.isUser ? "gm-message-user" : "gm-message-assistant"}`;

    const contentEl = document.createElement("div");
    contentEl.className = "gm-message-content";

    if (message.isUser) {
      contentEl.textContent = message.content;
    } else {
      try {
        const codeBlocks: string[] = [];

        const renderer = new marked.Renderer();

        renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
          const codeIndex = codeBlocks.length;
          codeBlocks.push(text);

          const validLanguage = lang && hljs.getLanguage(lang) ? lang : null;

          let highlightedCode: string;
          let detectedLanguage: string;

          if (validLanguage) {
            try {
              const result = hljs.highlight(text, { language: validLanguage });
              highlightedCode = result.value;
              detectedLanguage = validLanguage;
            } catch (e) {
              const result = hljs.highlightAuto(text);
              highlightedCode = result.value;
              detectedLanguage = result.language || "plaintext";
            }
          } else {
            const result = hljs.highlightAuto(text);
            highlightedCode = result.value;
            detectedLanguage = result.language || "plaintext";
          }

          return `
          <div class="gm-code-wrapper">
            <pre><code class="hljs language-${detectedLanguage}">${highlightedCode}</code></pre>
            <button class="gm-copy-btn" data-code-index="${codeIndex}">Copy</button>
          </div>
        `;
        };

        const htmlContent = await marked.parse(message.content, { renderer });
        contentEl.innerHTML = htmlContent;

        contentEl.querySelectorAll(".gm-copy-btn").forEach((btn) => {
          btn.addEventListener("click", async (e) => {
            const button = e.currentTarget as HTMLButtonElement;
            const codeIndex = parseInt(
              button.getAttribute("data-code-index") || "0"
            );
            const originalCode = codeBlocks[codeIndex];

            if (originalCode) {
              try {
                await navigator.clipboard.writeText(originalCode);
                const originalText = button.textContent;
                button.textContent = "Copied!";
                button.classList.add("copied");

                setTimeout(() => {
                  button.textContent = originalText;
                  button.classList.remove("copied");
                }, 2000);
              } catch (error) {
                console.error("Failed to copy to clipboard:", error);

                this.fallbackCopyToClipboard(originalCode);

                const originalText = button.textContent;
                button.textContent = "Copied!";
                button.classList.add("copied");

                setTimeout(() => {
                  button.textContent = originalText;
                  button.classList.remove("copied");
                }, 2000);
              }
            }
          });
        });
      } catch (error) {
        console.error("Error rendering message:", error);
        contentEl.textContent = message.content;
      }
    }

    messageEl.appendChild(contentEl);
    this.chatMessagesEl.appendChild(messageEl);
    this.scrollToBottom();
  }

  private fallbackCopyToClipboard(text: string): void {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-999999px";
    textarea.style.top = "-999999px";
    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();

    try {
      document.execCommand("copy");
    } catch (err) {
      console.error("Fallback copy failed:", err);
    }

    document.body.removeChild(textarea);
  }

  private addTypingIndicator(): HTMLDivElement {
    if (!this.chatMessagesEl) return document.createElement("div");

    const typingEl = document.createElement("div");
    typingEl.className = "gm-message gm-message-assistant gm-typing";

    const contentEl = document.createElement("div");
    contentEl.className = "gm-message-content";
    contentEl.innerHTML = "working...";

    typingEl.appendChild(contentEl);

    this.chatMessagesEl.appendChild(typingEl);
    this.scrollToBottom();

    return typingEl;
  }

  private removeTypingIndicator(typingEl: HTMLDivElement) {
    if (typingEl && typingEl.parentNode) {
      typingEl.parentNode.removeChild(typingEl);
    }
  }

  public scrollToBottom() {
    if (this.chatMessagesEl) {
      this.chatMessagesEl.scrollTop = this.chatMessagesEl.scrollHeight;
    }
  }

  private updateSendButton() {
    const sendBtn = this.chatboxEl?.querySelector(
      ".gm-send-btn"
    ) as HTMLButtonElement;
    const textarea = this.chatboxEl?.querySelector(
      ".gm-chatbox-input"
    ) as HTMLTextAreaElement;

    if (sendBtn && textarea) {
      sendBtn.disabled = textarea.value.trim() === "" || this.isGenerating;
    }
  }
}
