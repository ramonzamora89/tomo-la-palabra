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

function getOAuthUserClient() {
  const client = new google.auth.OAuth2(
    config.googleOAuthClientId,
    config.googleOAuthClientSecret,
  );
  client.setCredentials({ refresh_token: config.googleOAuthRefreshToken });
  return client;
}

export function getGoogleClients() {
  const auth = getAuth();
  const oauthUser = getOAuthUserClient();
  return {
    drive: google.drive({ version: "v3", auth }),
    docs: google.docs({ version: "v1", auth }),
    sheets: google.sheets({ version: "v4", auth }),
    // Only for creating new Drive files (drive.files.create) — the new file
    // lands owned by the real account (real quota) and, since it's created
    // inside a folder already shared Editor with the SA, the SA can
    // immediately read/edit it via the regular `drive`/`docs` clients above.
    driveAsUser: google.drive({ version: "v3", auth: oauthUser }),
  };
}
