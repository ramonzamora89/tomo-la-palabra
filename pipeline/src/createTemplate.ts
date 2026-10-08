import type { docs_v1 } from "googleapis";
import { getGoogleClients } from "./lib/googleClients";

/**
 * One-off: creates a template Doc for notes that don't come from an
 * interview, in the given Drive folder (the project's root folder, NOT
 * Publicar — a template sitting in Publicar would get published). Re-run it
 * when the Drive flow moves to another account.
 *
 *   npm run pipeline:create-template -- <general|opinion> <folderId>
 *
 * Neither has a "Transcripción completa" heading. Everything above the
 * first heading is ignored by parseDoc.ts, which is where the instructions
 * live — editors don't need to delete them before publishing. A copy left
 * with an empty Titular or Sección is skipped by watchPublicar.ts, so the
 * template itself can never be published by accident.
 */
type Tipo = "general" | "opinion";

const FOTOS =
  "Imágenes (opcional): pegá aquí las fotos. La primera es la portada: horizontal (16:9), ideal 1920 × 1080 px y sin texto encima. Las demás se reparten en el texto. Agregá una descripción a cada foto: clic derecho › Texto alternativo.";
const VIDEOS =
  "Videos cortos (opcional): pegá links de Reels, TikTok o YouTube Shorts, uno por línea. Se incrustan al final de la nota.";
const PUBLICAR =
  "Para publicar, arrastrá el Doc a la carpeta Publicar. Estas instrucciones no se publican.";

const PLANTILLAS: Record<Tipo, { nombre: string; instrucciones: string[]; secciones: { heading: string; body: string }[] }> = {
  general: {
    nombre: "PLANTILLA – Nota general",
    instrucciones: [
      "PLANTILLA · NOTA GENERAL",
      "Para notas que no salen de una entrevista en video (las entrevistas generan su borrador solas).",
      "",
      "1. No escribas sobre esta plantilla: Archivo › Hacer una copia, y guardá la copia en la carpeta Borradores.",
      "2. Escribí debajo de cada encabezado verde. No cambies ni borres los encabezados: el sistema los usa para saber qué es cada cosa.",
      "3. Sección (obligatoria): Voces, Reflector, Coyuntura, Profundidad, La Conversa, Comunidad o La Calle. Sin sección, la nota no se publica.",
      "4. Autor: dejá Redacción Tomo la Palabra o escribí el nombre de quien firma.",
      "5. Destacada: escribí sí para que sea la nota principal de la portada; si no, dejá no.",
      "6. Entradilla: uno o dos párrafos que resuman la nota. Es también el resumen que muestran Google y las redes.",
      `7. ${FOTOS}`,
      "8. Tags: palabras clave en minúsculas, separadas por comas.",
      "9. YouTube URL (opcional): el link de un video largo, que se muestra arriba de la nota. Si no hay, dejá (pendiente).",
      `10. ${VIDEOS}`,
      `11. ${PUBLICAR}`,
      "",
    ],
    secciones: [
      { heading: "Titular", body: "" },
      { heading: "Sección", body: "" },
      { heading: "Autor", body: "Redacción Tomo la Palabra" },
      { heading: "Destacada", body: "no" },
      { heading: "Entradilla", body: "" },
      { heading: "Cuerpo", body: "" },
      { heading: "Imágenes", body: "" },
      { heading: "Tags", body: "" },
      { heading: "YouTube URL", body: "(pendiente)" },
      { heading: "Videos cortos", body: "" },
    ],
  },
  opinion: {
    nombre: "PLANTILLA – Columna de opinión",
    instrucciones: [
      "PLANTILLA · COLUMNA DE OPINIÓN",
      "",
      "1. No escribas sobre esta plantilla: Archivo › Hacer una copia, y guardá la copia en la carpeta Borradores.",
      "2. Escribí debajo de cada encabezado verde. No cambies ni borres los encabezados: el sistema los usa para saber qué es cada cosa.",
      "3. Sección: dejala como Opinión.",
      "4. Autor: el nombre tal como debe aparecer en la firma. Sobre el autor: una o dos líneas sobre quien escribe (opcional).",
      "5. Destacada: escribí sí para que la columna sea la nota principal de la portada; si no, dejá no.",
      "6. Entradilla: uno o dos párrafos que resuman la columna. Es también el resumen que muestran Google y las redes.",
      `7. ${FOTOS}`,
      "8. Tags: palabras clave en minúsculas, separadas por comas.",
      `9. ${VIDEOS}`,
      `10. ${PUBLICAR}`,
      "",
    ],
    secciones: [
      { heading: "Titular", body: "" },
      { heading: "Sección", body: "Opinión" },
      { heading: "Autor", body: "" },
      { heading: "Sobre el autor", body: "" },
      { heading: "Destacada", body: "no" },
      { heading: "Entradilla", body: "" },
      { heading: "Cuerpo", body: "" },
      { heading: "Imágenes", body: "" },
      { heading: "Tags", body: "" },
      { heading: "Videos cortos", body: "" },
    ],
  },
};

function buildRequests(tipo: Tipo): docs_v1.Schema$Request[] {
  const { instrucciones, secciones } = PLANTILLAS[tipo];
  const intro = instrucciones.join("\n");
  let text = intro + "\n";
  const headingRanges: { start: number; length: number }[] = [];
  for (const s of secciones) {
    headingRanges.push({ start: text.length, length: s.heading.length });
    text += `${s.heading}\n${s.body}\n\n`;
  }

  const requests: docs_v1.Schema$Request[] = [{ insertText: { location: { index: 1 }, text } }];

  // Instructions in small gray italics, so they read as notes, not content.
  requests.push({
    updateTextStyle: {
      range: { startIndex: 1, endIndex: 1 + intro.length },
      textStyle: {
        italic: true,
        fontSize: { magnitude: 10, unit: "PT" },
        foregroundColor: { color: { rgbColor: { red: 0.42, green: 0.4, blue: 0.35 } } },
      },
      fields: "italic,fontSize,foregroundColor",
    },
  });
  requests.push({
    updateTextStyle: {
      range: { startIndex: 1, endIndex: 1 + instrucciones[0].length },
      textStyle: { bold: true, italic: false },
      fields: "bold,italic",
    },
  });

  for (const range of headingRanges) {
    const startIndex = 1 + range.start;
    requests.push({
      updateParagraphStyle: {
        range: { startIndex, endIndex: startIndex + range.length },
        paragraphStyle: { namedStyleType: "HEADING_1" },
        fields: "namedStyleType",
      },
    });
  }
  return requests;
}

async function main() {
  const [tipo, folderId] = process.argv.slice(2) as [Tipo, string];
  if (!(tipo in PLANTILLAS) || !folderId) {
    throw new Error("Uso: npm run pipeline:create-template -- <general|opinion> <folderId>");
  }

  const { docs, driveAsUser } = getGoogleClients();
  // Created as the real OAuth user: service accounts have no Drive quota
  // (see CLAUDE.md).
  const created = await driveAsUser.files.create({
    requestBody: {
      name: PLANTILLAS[tipo].nombre,
      mimeType: "application/vnd.google-apps.document",
      parents: [folderId],
    },
    fields: "id",
  });
  const documentId = created.data.id!;

  await docs.documents.batchUpdate({ documentId, requestBody: { requests: buildRequests(tipo) } });
  console.log(`Plantilla lista: https://docs.google.com/document/d/${documentId}/edit`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
