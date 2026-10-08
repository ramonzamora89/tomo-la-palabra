import type { docs_v1 } from "googleapis";
import type { DraftArticle } from "../draftArticle";
import { getCategoria } from "../../../content/taxonomy/categorias";

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
    // Display name ("La Calle") reads better for editors than the slug;
    // generateMdx.ts resolves either form back to the slug.
    { heading: "Sección", body: getCategoria(draft.seccion)?.nombre ?? draft.seccion },
    // Editors overwrite this with the real byline; left as is, it's the
    // same default watchPublicar.ts uses when the heading is missing.
    { heading: "Autor", body: "Redacción Tomo la Palabra" },
    // "sí" makes it the homepage's main story (the newest one marked wins).
    { heading: "Destacada", body: "no" },
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
