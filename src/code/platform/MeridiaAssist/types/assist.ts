import type { Awaitable } from "./internal";
import type { Provider, ProviderImplementationMap } from "./llm";

export interface PromptData {
  context: string;
  instruction: string;
  fileContent: string;
}

export type CustomPrompt<T> = (metadata: T) => Partial<PromptData>;

type CustomOptions = {
  provider?: undefined;
  model: CustomAssistModel;
};

export type CustomAssistModel = (
  prompt: PromptData
) => Awaitable<CustomModelResponse>;

type CustomModelResponse = {
  text: string | null;
};

export type AIRequestHandler = (params: {
  endpoint: string;
  body: Record<string, unknown>;
  headers: Record<string, string>;
}) => Promise<Record<string, unknown>>;

export type AssistOptions = ProviderOptions<"mistral"> | CustomOptions;

export type ProviderOptions<T extends Provider> = {
  provider: T;
  model: ProviderImplementationMap[T]["Model"];
};
