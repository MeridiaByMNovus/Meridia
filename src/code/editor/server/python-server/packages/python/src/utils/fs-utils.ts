import { dirname } from "path";
import { fileURLToPath } from "url";

export const getLocalDirectory = (referenceUrl: string | URL) => {
    const __filename = fileURLToPath(referenceUrl);
    return dirname(__filename);
};
