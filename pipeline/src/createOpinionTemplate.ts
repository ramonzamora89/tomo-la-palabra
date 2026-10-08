import type { docs_v1 } from "googleapis";
import { getGoogleClients } from "./lib/googleClients";

/**
 * One-off: creates the "Columna de opinión" template Doc in the given Drive
 * folder (the project's root folder, NOT Publicar — a template sitting in
 * Publicar would get published). Re-run it when the Drive flow moves to
 * another account.
 *
 *   npm run pipeline:create-opinion-template -- <folderId>
 *
 * Opinion pieces aren't drafted from an interview, so the template has no
 * "YouTube URL" or "Transcripción completa" headings. Everything above the
 * first heading is ignored by parseDoc.ts, which is where the instructions
 * live — editors don't need to delete them before publishing.
 */
const INSTRUCCIONES = [
  "PLANTILLA · COLUMNA DE OPINIÓN",
  "",
  "1. No escribas sobre esta plantilla: Archivo → Hacer una copia, y guarda la copia en la carpeta Borradores.",
  "2. Escribe debajo de cada encabezado verde. No cambies ni borres los encabezados: el sistema los usa para saber qué es cada cosa.",
  "3. Sección: déjala como Opinión.",
  "4. Autor: el nombre tal como debe aparecer en la firma. Sobre el autor: una o dos líneas sobre quien escribe (opcional).",
  "5. Destacada: escribe sí para que la columna sea la nota principal de la portada; si no, déjalo en no.",
  "6. Entradilla: uno o dos párrafos que resuman la columna. Se usa también como descripción en Google y redes.",
  "7. Imágenes (opcional): pega aquí las fotos. La primera es la portada: horizontal (16:9), de al menos 1600 px de ancho y sin texto encima. Agrega una descripción a cada foto: clic derecho → Texto alternativo.",
  "8. Tags: palabras clave separadas por comas.",
  "9. Para publicar, arrastra el Doc a la carpeta Publicar. Estas instrucciones no se publican.",
  "",
].join("\n");

const SECCIONES: { heading: string; body: string }[] = [
  { heading: "Titular", body: "" },
  { heading: "Sección", body: "Opinión" },
  { heading: "Autor", body: "" },
  { heading: "Sobre el autor", body: "" },
  { heading: "Destacada", body: "no" },
  { heading: "Entradilla", body: "" },
  { heading: "Cuerpo", body: "" },
  { heading: "Imágenes", body: "" },
  { heading: "Tags", body: "" },
];

function buildRequests(): docs_v1.Schema$Request[] {
  let text = INSTRUCCIONES + "\n";
  const headingRanges: { start: number; length: number }[] = [];
  for (const s of SECCIONES) {
    headingRanges.push({ start: text.length, length: s.heading.length });
    text += `${s.heading}\n${s.body}\n\n`;
  }

  const requests: docs_v1.Schema$Request[] = [{ insertText: { location: { index: 1 }, text } }];

  // Instructions in small gray italics, so they read as notes, not content.
  requests.push({
    updateTextStyle: {
      range: { startIndex: 1, endIndex: 1 + INSTRUCCIONES.length },
      textStyle: {
        italic: true,
        fontSize: { magnitude: 10, unit: "PT" },
        foregroundColor: { color: { rgbColor: { red: 0.42, green: 0.4, blue: 0.35 } } },
      },
      fields: "italic,fontSize,foregroundColor",
    },
  });
  const firstLine = INSTRUCCIONES.split("\n")[0];
  requests.push({
    updateTextStyle: {
      range: { startIndex: 1, endIndex: 1 + firstLine.length },
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
  const folderId = process.argv[2];
  if (!folderId) throw new Error("Uso: npm run pipeline:create-opinion-template -- <folderId>");

  const { docs, driveAsUser } = getGoogleClients();
  // Created as the real OAuth user: service accounts have no Drive quota
  // (see CLAUDE.md).
  const created = await driveAsUser.files.create({
    requestBody: {
      name: "PLANTILLA – Columna de opinión",
      mimeType: "application/vnd.google-apps.document",
      parents: [folderId],
    },
    fields: "id",
  });
  const documentId = created.data.id!;

  await docs.documents.batchUpdate({ documentId, requestBody: { requests: buildRequests() } });
  console.log(`Plantilla lista: https://docs.google.com/document/d/${documentId}/edit`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
