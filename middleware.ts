import { NextResponse, type NextRequest } from "next/server";

/**
 * Embargoed notes (`publishAt` in the frontmatter): until that minute their
 * page asks for the team's password (HTTP Basic, any user name). Runs on
 * every request, so the note opens at exactly publishAt without a deploy;
 * listings and the homepage pick it up on the next deploy (deploy.yml).
 *
 * Link-preview crawlers get through so posts scheduled in social media
 * before the release show the note's title, dek and cover.
 */
const EMBARGOS: Record<string, string> = JSON.parse(process.env.EMBARGOS_JSON || "{}");
const CLAVE = process.env.EMBARGO_PASSWORD || "";

const VISTA_PREVIA =
  /facebookexternalhit|facebookcatalog|meta-externalagent|Facebot|Twitterbot|LinkedInBot|WhatsApp|TelegramBot|Slackbot|Discordbot|Pinterest|redditbot|Applebot|SkypeUriPreview|Bluesky|Iframely|Embedly|Google-PageRenderer/i;

const PAGINA = `<!doctype html>
<html lang="es-GT"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>Nota aún no publicada · Tomo la Palabra</title></head>
<body style="font-family:system-ui,sans-serif;background:#EFE9CF;color:#1C1B17;margin:0;padding:3rem 1rem">
<main style="max-width:32rem;margin:0 auto"><h1 style="color:#104734">Esta nota todavía no está publicada</h1>
<p>Se publica el <strong>__HORA__</strong> (hora de Guatemala). Si sos del equipo editorial, recargá la página e ingresá la contraseña.</p>
<p><a href="/" style="color:#104734">Ir a la portada de Tomo la Palabra</a></p></main></body></html>`;

function horaGuatemala(iso: string) {
  return new Date(iso).toLocaleString("es-GT", {
    timeZone: "America/Guatemala",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  });
}

function claveCorrecta(authorization: string | null) {
  if (!CLAVE || !authorization?.startsWith("Basic ")) return false;
  try {
    const decodificado = atob(authorization.slice(6));
    return decodificado.slice(decodificado.indexOf(":") + 1) === CLAVE;
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
  const slug = req.nextUrl.pathname.split("/")[2];
  const publishAt = slug ? EMBARGOS[decodeURIComponent(slug)] : undefined;
  if (!publishAt || Date.now() >= Date.parse(publishAt)) return NextResponse.next();

  if (VISTA_PREVIA.test(req.headers.get("user-agent") ?? "")) return NextResponse.next();

  if (claveCorrecta(req.headers.get("authorization"))) {
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "private, no-store");
    res.headers.set("X-Robots-Tag", "noindex");
    return res;
  }

  return new NextResponse(PAGINA.replace("__HORA__", horaGuatemala(publishAt)), {
    status: 401,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "WWW-Authenticate": 'Basic realm="Tomo la Palabra: nota con embargo", charset="UTF-8"',
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

export const config = { matcher: "/nota/:slug*" };
