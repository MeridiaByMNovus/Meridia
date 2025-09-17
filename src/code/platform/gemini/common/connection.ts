import { GoogleGenerativeAI } from "@google/generative-ai";

class GeminiInstance {
  private googleAi: GoogleGenerativeAI;

  constructor(googleAi: GoogleGenerativeAI) {
    this.googleAi = googleAi;
  }

  public getInstance() {
    const geminiConfig = {
      temperature: 0.9,
      topP: 1,
      topK: 1,
      maxOutputTokens: 4096,
    };

    const geminiInstance = this.googleAi.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      ...geminiConfig,
    });

    return geminiInstance;
  }
}

interface ChatMessage {
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export class GeminiConnection {
  private api_key: string;
  private googleAi: GoogleGenerativeAI;
  private geminiInstance: GeminiInstance;

  constructor() {
    this.api_key = window.gemini.getApiKey();
    this.googleAi = new GoogleGenerativeAI(this.api_key);
    this.geminiInstance = new GeminiInstance(this.googleAi);
  }

  public async generate(
    prompt: string,
    previousMessages: ChatMessage[] = []
  ): Promise<string> {
    try {
      const geminiInstance = this.geminiInstance.getInstance();

      const developerMessage = `
You are a coding-focused AI assistant.

Core Identity & Role:
- You are strictly a programming and software development assistant.
- You always act as a professional coding partner, mentor, or teacher.
- Your purpose is to explain, write, and debug code across multiple programming languages and technologies, with special attention to Python.

Strict Rules:
- Do not use emojis or emoticons under any circumstances, even if the user requests them.
- Do not include unnecessary decorations or casual symbols in answers.
- Maintain a professional and clean tone at all times.

Response Style:
- Always provide clear, step-by-step explanations when needed.
- Write code in properly formatted blocks with correct syntax highlighting.
- Keep responses concise, technical, and relevant to the problem.
- When giving examples, assume the user has basic to intermediate coding knowledge.
- If the answer involves risks, errors, or security concerns, clearly point them out.

Focus:
- Prioritize correctness, performance, and readability in code.
- Provide best practices and explain why they matter.
- You can include alternative solutions but make sure the primary solution is well explained.
- Stay focused on coding, software engineering, system design, and technical problem-solving.
- Provide high-quality Python code examples, explanations, and suggestions, ensuring they follow Pythonic conventions.

Identity Reminder:
- You are not a general conversational chatbot.
- You are not a roleplay assistant or casual chatter.
- You exist purely for programming-related help.
`;

      let conversationContext = "";

      if (previousMessages.length > 0) {
        conversationContext = "\n\nPrevious Conversation:\n";

        const recentMessages = previousMessages.slice(-10);

        recentMessages.forEach((msg) => {
          const role = msg.isUser ? "User" : "Assistant";
          conversationContext += `${role}: ${msg.content}\n\n`;
        });
      }

      const fullPrompt =
        developerMessage +
        conversationContext +
        "\nCurrent User Message: " +
        prompt;

      const result = await geminiInstance.generateContent(fullPrompt);

      const response = result.response;
      const text = response.text();

      if (!text || text.trim() === "") {
        throw new Error("Received empty response from Gemini API");
      }

      return text;
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("API_KEY")) {
          throw new Error("Invalid API key. Please check your Gemini API key.");
        } else if (err.message.includes("PERMISSION_DENIED")) {
          throw new Error(
            "Permission denied. Please check your API key permissions."
          );
        } else if (err.message.includes("QUOTA_EXCEEDED")) {
          throw new Error(
            "API quota exceeded. Please check your usage limits."
          );
        } else if (err.message.includes("MODEL_NOT_FOUND")) {
          throw new Error(
            "Model not found. The specified model may not be available."
          );
        }
      }

      throw new Error(`Failed to generate response: ${err}`);
    }
  }
}
