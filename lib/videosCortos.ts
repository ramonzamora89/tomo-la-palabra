/**
 * Short-form videos (Instagram Reels, TikTok, YouTube Shorts) pasted as
 * links under the Doc's "Videos cortos" heading and embedded at the end of
 * the note. Shared by the pipeline (link → frontmatter) and the site
 * (frontmatter → iframe).
 */
export type Plataforma = "instagram" | "tiktok" | "youtube";

export type VideoCorto = {
  plataforma: Plataforma;
  id: string;
  /** Clean public link (no tracking params) — the "Ver en …" fallback. */
  url: string;
};

export const NOMBRE_PLATAFORMA: Record<Plataforma, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
};

/**
 * Recognizes a share link from any of the three networks, ignoring
 * tracking params (?utm_source=…, &stkn=…). Undefined when it isn't one —
 * including TikTok short links (vm.tiktok.com/…), which the pipeline
 * resolves first (resolverVideoCorto).
 */
export function parseVideoCorto(raw: string): VideoCorto | undefined {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return undefined;
  }
  const host = url.hostname.replace(/^(www\.|m\.)/, "");
  const path = url.pathname;

  if (host === "instagram.com") {
    // /reel/CODE, /reels/CODE, /p/CODE, /tv/CODE — and /usuario/reel/CODE.
    const m = path.match(/\/(reels?|p|tv)\/([A-Za-z0-9_-]+)/);
    if (!m) return undefined;
    const tipo = m[1] === "p" ? "p" : "reel";
    return { plataforma: "instagram", id: m[2], url: `https://www.instagram.com/${tipo}/${m[2]}/` };
  }

  if (host === "tiktok.com") {
    const m = path.match(/\/(@[^/]*)\/(?:video|photo)\/(\d+)/);
    if (!m) return undefined;
    // Resolved short links come back as /@/video/ID (no username) — TikTok
    // serves that path fine, so it's kept as is.
    return { plataforma: "tiktok", id: m[2], url: `https://www.tiktok.com/${m[1]}/video/${m[2]}` };
  }

  if (host === "youtube.com" || host === "youtu.be") {
    const m =
      host === "youtu.be"
        ? path.match(/^\/([A-Za-z0-9_-]{11})/)
        : path.match(/^\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{11})/) ??
          (url.searchParams.get("v")?.match(/^([A-Za-z0-9_-]{11})$/) ?? null);
    if (!m) return undefined;
    return { plataforma: "youtube", id: m[1], url: `https://www.youtube.com/shorts/${m[1]}` };
  }

  return undefined;
}

/** iframe src for each network's official embed player. */
export function embedUrl(v: VideoCorto): string {
  switch (v.plataforma) {
    case "instagram":
      return `${v.url}embed/`;
    case "tiktok":
      return `https://www.tiktok.com/player/v1/${v.id}`;
    case "youtube":
      return `https://www.youtube-nocookie.com/embed/${v.id}`;
  }
}
