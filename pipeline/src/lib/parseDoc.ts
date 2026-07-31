import type { docs_v1 } from "googleapis";

/**
 * Maps the normalized (accent-stripped, lowercased) heading text to the
 * internal field name. Must match the headings buildDraftDocRequests()
 * produces (googleDocs.ts) — see plan §7.
 */
const HEADING_KEYS: Record<string, string> = {
  titular: "titular",
  seccion: "seccion",
  entradilla: "entradilla",
  cuerpo: "cuerpo",
  imagenes: "imagenes",
  tags: "tags",
  "youtube url": "youtubeUrl",
  "transcripcion completa": "transcripcion",
};

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

export type ParsedDoc = Record<string, string>;

export function parseDocSections(document: docs_v1.Schema$Document): ParsedDoc {
  const sections: ParsedDoc = {};
  let currentKey: string | null = null;
  let buffer: string[] = [];

  function flush() {
    if (currentKey) {
      sections[currentKey] = buffer.join("").trim();
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
    }
  }
  flush();

  return sections;
}
