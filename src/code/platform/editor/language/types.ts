export interface LanguageManifest {
  name: string;
  ext: string[];
  worker: string;
  type: "browser" | "server" | "client";
  main: string;
}
