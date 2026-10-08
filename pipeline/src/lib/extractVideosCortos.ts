import { parseVideoCorto, type VideoCorto } from "../../../lib/videosCortos";

// TikTok's share links (vm.tiktok.com/…, vt.tiktok.com/…, tiktok.com/t/…)
// don't carry the video ID — it only appears after following the redirect.
const TIKTOK_CORTO = /^https?:\/\/(vm|vt)\.tiktok\.com\/|^https?:\/\/(www\.)?tiktok\.com\/t\//;

async function resolverVideoCorto(link: string): Promise<VideoCorto | undefined> {
  const directo = parseVideoCorto(link);
  if (directo || !TIKTOK_CORTO.test(link)) return directo;
  try {
    const res = await fetch(link, {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/130 Safari/537.36" },
    });
    return parseVideoCorto(res.url);
  } catch {
    return undefined;
  }
}

/**
 * Every recognizable Reel / TikTok / Short link in the "Videos cortos"
 * section, in order and without repeats. Anything else there (the
 * template's instructions, a stray link) is ignored with a warning.
 */
export async function extractVideosCortos(text: string | undefined): Promise<VideoCorto[]> {
  const links = (text ?? "").match(/https?:\/\/[^\s<>"')\]]+/g) ?? [];
  const videos: VideoCorto[] = [];
  for (const link of links) {
    const video = await resolverVideoCorto(link);
    if (!video) {
      console.warn(`  Link no reconocido en Videos cortos (se omite): ${link}`);
      continue;
    }
    if (!videos.some((v) => v.plataforma === video.plataforma && v.id === video.id)) videos.push(video);
  }
  return videos;
}
