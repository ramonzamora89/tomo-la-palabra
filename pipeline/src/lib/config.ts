import "dotenv/config";
import { config as loadEnv } from "dotenv";
import path from "node:path";

// Local dev reads .env.local (gitignored); CI provides these as real env
// vars via GitHub Secrets, so this is a no-op there.
loadEnv({ path: path.join(process.cwd(), ".env.local") });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const config = {
  get deepgramApiKey() {
    return required("DEEPGRAM_API_KEY");
  },
  get anthropicApiKey() {
    return required("ANTHROPIC_API_KEY");
  },
  get googleServiceAccountJson() {
    return required("GOOGLE_SERVICE_ACCOUNT_JSON");
  },
  driveFolders: {
    get entrevistas() {
      return required("DRIVE_FOLDER_ENTREVISTAS_ID");
    },
    get borradores() {
      return required("DRIVE_FOLDER_BORRADORES_ID");
    },
    get publicar() {
      return required("DRIVE_FOLDER_PUBLICAR_ID");
    },
    get archivo() {
      return required("DRIVE_FOLDER_ARCHIVO_ID");
    },
  },
  get ledgerSheetId() {
    return required("DRIVE_LEDGER_SHEET_ID");
  },
};
