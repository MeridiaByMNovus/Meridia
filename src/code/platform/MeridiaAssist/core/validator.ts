import { PROVIDERS, PROVIDER_MODEL_MAP } from "./llm/base.js";
import type { AssistOptions, CustomAssistModel } from "../types/assist.js";
import type { Model, Provider } from "../types/llm.js";
import { joinWithAnd } from "./utils/text.js";

const _validateParams = (
  apiKey: string | undefined,
  options: AssistOptions
): void => {
  if (!apiKey && typeof options.model !== "function") {
    throw new Error(
      options.provider
        ? `Please provide the ${options.provider} API key.`
        : "Please provide an API key."
    );
  }

  if (
    !options ||
    (typeof options === "object" && Object.keys(options).length === 0)
  ) {
    throw new Error(
      'Please provide required Assist options, such as "model" and "provider".'
    );
  }
};

const _validateInputs = (
  model: Model | CustomAssistModel,
  provider?: Provider
): void => {
  if (typeof model === "function" && provider !== undefined) {
    throw new Error(
      "Provider should not be specified when using a custom model."
    );
  }

  if (
    typeof model !== "function" &&
    (!provider || !PROVIDERS.includes(provider))
  ) {
    throw new Error(
      `Provider must be specified and supported when using built-in models. Please choose from: ${joinWithAnd(
        PROVIDERS
      )}`
    );
  }

  if (
    typeof model === "string" &&
    provider !== undefined &&
    !PROVIDER_MODEL_MAP[provider].includes(model)
  ) {
    throw new Error(
      `Model "${model}" is not supported by the "${
        provider
      }" provider. Supported models: ${joinWithAnd(
        PROVIDER_MODEL_MAP[provider]
      )}`
    );
  }
};

export default {
  params: _validateParams,
  inputs: _validateInputs,
};
