import { CompletionAssist } from "../../platform/assist/";

export const assist = new CompletionAssist(process.env.MISTRAL_API, {
  provider: "mistral",
  model: "codestral",
});
