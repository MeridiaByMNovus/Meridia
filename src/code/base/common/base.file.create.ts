import { PUBLIC_FOLDER, STORE_JSON_PATH } from "./base.utils.js";
import fs from "fs";

const folders = [PUBLIC_FOLDER!];

folders.forEach((folder) => {
  try {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
  } catch (error) {
    throw error;
  }
});

const files = { [STORE_JSON_PATH]: {} };

Object.entries(files).forEach(([filePath, defaultContent]) => {
  if (!fs.existsSync(filePath)) {
    const jsonString = JSON.stringify(defaultContent, null, 2);

    fs.writeFileSync(filePath, jsonString);
  }
});
