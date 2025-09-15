import type { AIRequestHandler, CustomPrompt } from "./assist";

import type { Filename, RelatedFile, Technologies } from "./metadata";

import type { BaseAssistMetadata } from "./metadata";

import type {
  FetchCompletionItemHandler,
  FetchCompletionItemParams,
  FetchCompletionItemReturn,
} from "./internal";

import type {
  CursorPosition,
  EditorCancellationToken,
  EditorModel,
  EditorRange,
  Monaco,
} from "./monaco";

export type CompletionMetadata = BaseAssistMetadata;

export interface RegisterCompletionOptions {
  language: string;
  trigger?: Trigger;
  filename?: Filename;
  technologies?: Technologies;
  relatedFiles?: RelatedFile[];
  maxContextLines?: number;
  enableCaching?: boolean;
  allowFollowUpCompletions?: boolean;
  onError?: (error: Error) => void;
  requestHandler?: FetchCompletionItemHandler;
  onCompletionShown?: (
    completion: string,
    range: EditorRange | undefined
  ) => void;
  onCompletionAccepted?: () => void;
  onCompletionRejected?: () => void;
  onCompletionRequested?: (params: FetchCompletionItemParams) => void;
  onCompletionRequestFinished?: (
    params: FetchCompletionItemParams,
    response: FetchCompletionItemReturn
  ) => void;
  triggerIf?: (params: {
    text: string;
    position: CursorPosition;
    triggerType: Trigger;
  }) => boolean;
}

export type Trigger = "onTyping" | "onIdle" | "onDemand";

export enum TriggerEnum {
  OnTyping = "onTyping",
  OnIdle = "onIdle",
  OnDemand = "onDemand",
}

export interface CompletionRegistration {
  trigger: () => void;
  deregister: () => void;
  updateOptions: (
    callback: (
      currentOptions: RegisterCompletionOptions
    ) => Partial<RegisterCompletionOptions>
  ) => void;
}

export interface InlineCompletionProcessorParams {
  monaco: Monaco;
  mdl: EditorModel;
  pos: CursorPosition;
  token: EditorCancellationToken;
  isCompletionAccepted: boolean;
  options: RegisterCompletionOptions;
}

export type LocalPredictionSnippets = Record<string, string>;
export interface LocalPrediction {
  language: string;
  snippets: LocalPredictionSnippets;
}

export interface CompletionRequest {
  body: CompletionRequestBody;
  options?: CompletionRequestOptions;
}

export interface CompletionRequestBody {
  completionMetadata: CompletionMetadata;
}

export interface CompletionRequestOptions {
  customPrompt?: CustomPrompt<CompletionMetadata>;
  aiRequestHandler?: AIRequestHandler;
}

export interface CompletionResponse {
  completion: string | null;
  error?: string;
  raw?: unknown;
}
