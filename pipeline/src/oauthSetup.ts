import http from "node:http";
import "dotenv/config";
import { config as loadEnv } from "dotenv";
import path from "node:path";
import { google } from "googleapis";

loadEnv({ path: path.join(process.cwd(), ".env.local") });

/**
 * One-time local script: obtains a long-lived refresh token for the real
 * Google account (not the service account), used only for creating new
 * Drive files — see googleClients.ts for why.
 *
 *   npm run pipeline:google-oauth-setup
 */
const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const PORT = 53682;
const REDIRECT_URI = `http://localhost:${PORT}`;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "Faltan GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET en .env.local",
  );
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/documents",
  ],
});

console.log("\nAbre esta URL en tu navegador, inicia sesión con tu cuenta real de Google y autoriza:\n");
console.log(authUrl);
console.log("\nEsperando la autorización...\n");

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", REDIRECT_URI);
  const code = url.searchParams.get("code");

  if (!code) {
    res.writeHead(400);
    res.end("No se recibió un código de autorización.");
    return;
  }

  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end("<h1>Listo, ya puedes cerrar esta pestaña.</h1>");

  oauth2Client
    .getToken(code)
    .then(({ tokens }) => {
      console.log("\nRefresh token obtenido:\n");
      console.log(tokens.refresh_token);
      console.log(
        "\nGuárdalo como GOOGLE_OAUTH_REFRESH_TOKEN en tu .env.local y como GitHub Secret — no lo compartas en el chat.\n",
      );
    })
    .finally(() => {
      server.close();
      process.exit(0);
    });
});

server.listen(PORT);
