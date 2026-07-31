import type { docs_v1 } from "googleapis";
import type { DraftArticle } from "../draftArticle";

/**
 * Exact heading order the drafting step produces and parseDoc.ts (M9)
 * expects, each styled Heading 1 — see plan §7.
 */
export function buildDraftDocRequests(
  draft: DraftArticle,
  youtubeUrl: string,
  transcript: string,
): docs_v1.Schema$Request[] {
  const sections: { heading: string; body: string }[] = [
    { heading: "Titular", body: draft.titular },
    { heading: "Sección", body: draft.seccion },
    { heading: "Entradilla", body: draft.entradilla },
    { heading: "Cuerpo", body: draft.cuerpo },
    { heading: "Imágenes", body: draft.imagenesNotas },
    { heading: "Tags", body: draft.tags.join(", ") },
    { heading: "YouTube URL", body: youtubeUrl || "(pendiente)" },
    { heading: "Transcripción completa", body: transcript },
  ];

  let text = "";
  const headingRanges: { start: number; length: number }[] = [];

  for (const section of sections) {
    headingRanges.push({ start: text.length, length: section.heading.length });
    text += `${section.heading}\n${section.body}\n\n`;
  }

  const requests: docs_v1.Schema$Request[] = [
    { insertText: { location: { index: 1 }, text } },
  ];

  for (const range of headingRanges) {
    const startIndex = 1 + range.start;
    const endIndex = startIndex + range.length;
    requests.push({
      updateParagraphStyle: {
        range: { startIndex, endIndex },
        paragraphStyle: { namedStyleType: "HEADING_1" },
        fields: "namedStyleType",
      },
    });
  }

  return requests;
}
