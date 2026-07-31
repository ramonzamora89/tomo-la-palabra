import { google } from "googleapis";
import { config } from "./config";

/**
 * Single service account, shared as an Editor collaborator directly on the
 * "Tomo la Palabra" Drive folder tree (like any human collaborator) — no
 * OAuth consent flow, no domain-wide delegation (that's Workspace-only).
 */
function getAuth() {
  const credentials = JSON.parse(config.googleServiceAccountJson);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/documents",
      "https://www.googleapis.com/auth/spreadsheets",
    ],
  });
}

export function getGoogleClients() {
  const auth = getAuth();
  return {
    drive: google.drive({ version: "v3", auth }),
    docs: google.docs({ version: "v1", auth }),
    sheets: google.sheets({ version: "v4", auth }),
  };
}
