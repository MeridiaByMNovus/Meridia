import {
  createProviderEndpoint,
  createProviderHeaders,
  createRequestBody,
  parseProviderCompletion,
} from "./llm/operations.js";
import { logger } from "./logger.js";
import type {
  AIRequestHandler,
  AssistOptions,
  CustomAssistModel,
  CustomPrompt,
  PromptData,
} from "../types/assist.js";
import type { AssistAIResponse } from "../types/internal.js";
import type {
  Completion,
  CompletionCreateParams,
  Model,
  Provider,
} from "../types/llm.js";
import type { BaseAssistMetadata } from "../types/metadata.js";
import { fetchWithTimeout } from "./utils/fetch-with-timeout.js";
import validate from "./validator.js";

export abstract class Assist<Metadata> {
  protected readonly apiKey: string;
  protected provider: Provider | undefined;
  protected model: Model | CustomAssistModel;

  constructor(apiKey: string | undefined, options: AssistOptions) {
    validate.params(apiKey, options);
    this.apiKey = apiKey ?? "";
    this.provider = options.provider;
    this.model = options.model;
    validate.inputs(this.model, this.provider);
  }

  protected abstract getDefaultPrompt(metadata: Metadata): PromptData;

  protected generatePrompt(
    metadata: Metadata,
    customPrompt?: CustomPrompt<Metadata>
  ): PromptData {
    const defaultPrompt = this.getDefaultPrompt(metadata);
    return customPrompt
      ? { ...defaultPrompt, ...customPrompt(metadata) }
      : defaultPrompt;
  }

  protected async makeAIRequest(
    metadata: Metadata,
    options: {
      customPrompt?: CustomPrompt<Metadata>;
      aiRequestHandler?: AIRequestHandler;
    } = {}
  ): Promise<AssistAIResponse> {
    try {
      const prompt = this.generatePrompt(metadata, options.customPrompt);

      if (this.isCustomModel()) {
        return this.model(prompt);
      } else {
        const { aiRequestHandler } = options;
        const requestDetails = await this.prepareRequest(
          prompt,
          metadata as BaseAssistMetadata
        );
        const response = await this.sendRequest(
          requestDetails.endpoint,
          requestDetails.requestBody,
          requestDetails.headers,
          aiRequestHandler
        );

        return this.processResponse(response);
      }
    } catch (error) {
      return this.handleError(error);
    }
  }

  private async prepareRequest(
    prompt: PromptData,
    metadata: BaseAssistMetadata
  ) {
    if (!this.provider) {
      throw new Error("Provider is required for non-custom models");
    }

    return {
      endpoint: createProviderEndpoint(
        this.model as Model,
        this.apiKey,
        this.provider
      ),
      headers: createProviderHeaders(this.apiKey, this.provider),
      requestBody: createRequestBody(
        this.model as Model,
        this.provider,
        prompt,
        metadata
      ),
    };
  }

  private processResponse(response: unknown): AssistAIResponse {
    if (!this.provider) {
      throw new Error("Provider is required for non-custom models");
    }

    return {
      text: parseProviderCompletion(response as Completion, this.provider),
      raw: response,
    };
  }

  private isCustomModel(): this is {
    model: CustomAssistModel;
  } {
    return typeof this.model === "function";
  }

  protected async sendRequest(
    endpoint: string,
    requestBody: CompletionCreateParams,
    headers: Record<string, string>,
    aiRequestHandler?: AIRequestHandler
  ) {
    const resolvedHeaders = {
      "Content-Type": "application/json",
      ...headers,
    };

    if (aiRequestHandler) {
      return aiRequestHandler({
        endpoint,
        body: requestBody,
        headers: resolvedHeaders,
      });
    }

    const response = await fetchWithTimeout(endpoint, {
      method: "POST",
      headers: resolvedHeaders,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return response.json();
  }

  protected handleError(error: unknown): AssistAIResponse {
    const errorDetails = logger.report(error);
    return {
      text: null,
      error: errorDetails.message,
    };
  }
}
