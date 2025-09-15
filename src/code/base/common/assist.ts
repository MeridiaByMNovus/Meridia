import { CompletionAssist } from "../../platform/assist/";

export const assist = new CompletionAssist(process.env.MISTAL_API, {
  provider: "mistral",
  model: "codestral",
});
