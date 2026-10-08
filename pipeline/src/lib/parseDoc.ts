import type { docs_v1 } from "googleapis";

/**
 * Maps the normalized (accent-stripped, lowercased) heading text to the
 * internal field name. Must match the headings buildDraftDocRequests()
 * produces (googleDocs.ts) — see plan §7.
 */
const HEADING_KEYS: Record<string, string> = {
  titular: "titular",
  seccion: "seccion",
  // Optional — absent or empty falls back to the newsroom byline. Docs
  // drafted before this heading existed simply don't have it.
  autor: "autor",
  autora: "autor",
  "autor/a": "autor",
  "autor(a)": "autor",
  autoria: "autor",
  // Opinión only: a one- or two-line bio shown under the column.
  "sobre el autor": "autorBio",
  "sobre la autora": "autorBio",
  "sobre el autor/a": "autorBio",
  "sobre el autor(a)": "autorBio",
  // "sí" pins the note as the homepage's main story (see getFeaturedNota).
  destacada: "destacada",
  destacado: "destacada",
  entradilla: "entradilla",
  cuerpo: "cuerpo",
  imagenes: "imagenes",
  tags: "tags",
  "youtube url": "youtubeUrl",
  "transcripcion completa": "transcripcion",
  // Links to Reels / TikToks / Shorts, one per line, embedded at the end
  // of the note. Per-network headings are accepted too and merged.
  "videos cortos": "videosCortos",
  "video corto": "videosCortos",
  "redes sociales": "videosCortos",
  instagram: "videosCortos",
  reels: "videosCortos",
  tiktok: "videosCortos",
  "youtube shorts": "videosCortos",
  shorts: "videosCortos",
};

// Sections where a pasted link may show only its display text ("ver
// reel") — the real URL lives in the text run's link style, so it's
// appended to the section text.
const LINK_SECTIONS = new Set(["videosCortos"]);

const HEADING_STYLES = new Set(["HEADING_1", "HEADING_2"]);
const DIACRITICS_REGEX = new RegExp("[̀-ͯ]", "g");

function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "");
}

function paragraphText(paragraph: docs_v1.Schema$Paragraph): string {
  return (paragraph.elements ?? []).map((el) => el.textRun?.content ?? "").join("");
}

function paragraphLinks(paragraph: docs_v1.Schema$Paragraph): string[] {
  return (paragraph.elements ?? [])
    .map((el) => el.textRun?.textStyle?.link?.url)
    .filter((url): url is string => Boolean(url));
}

export type ParsedDoc = Record<string, string>;

export function parseDocSections(document: docs_v1.Schema$Document): ParsedDoc {
  const sections: ParsedDoc = {};
  let currentKey: string | null = null;
  let buffer: string[] = [];

  function flush() {
    if (currentKey) {
      const text = buffer.join("").trim();
      // A key can repeat (e.g. "Instagram" and "TikTok" headings) — merge.
      sections[currentKey] = sections[currentKey] ? `${sections[currentKey]}\n${text}` : text;
    }
    buffer = [];
  }

  for (const element of document.body?.content ?? []) {
    const paragraph = element.paragraph;
    if (!paragraph) continue;

    const text = paragraphText(paragraph);
    const style = paragraph.paragraphStyle?.namedStyleType;

    if (style && HEADING_STYLES.has(style)) {
      const key = HEADING_KEYS[normalize(text)];
      if (key) {
        flush();
        currentKey = key;
        continue;
      }
    }

    if (currentKey) {
      buffer.push(text);
      if (LINK_SECTIONS.has(currentKey)) {
        for (const url of paragraphLinks(paragraph)) buffer.push(`${url}\n`);
      }
    }
  }
  flush();

  return sections;
}
