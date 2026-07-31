import fs from "node:fs";
import path from "node:path";
import { draftArticle } from "./draftArticle";

/**
 * M7 verification script: run the drafting step against a transcript
 * produced by transcribeLocal.ts (M6), with no Google Docs involved yet.
 *
 *   npm run pipeline:draft-local -- "pipeline/tmp/SHAI WA.transcripcion.txt"
 */
async function main() {
  const transcriptPath = process.argv[2];
  if (!transcriptPath) {
    console.error('Uso: npm run pipeline:draft-local -- "pipeline/tmp/<archivo>.transcripcion.txt"');
    process.exit(1);
  }

  const transcript = fs.readFileSync(transcriptPath, "utf8");
  console.log("Redactando borrador con Claude Opus 5...");
  const draft = await draftArticle(transcript);

  const outPath = transcriptPath.replace(/\.transcripcion\.txt$/, ".borrador.json");
  fs.writeFileSync(outPath, JSON.stringify(draft, null, 2));

  console.log(`\nBorrador guardado en: ${outPath}\n`);
  console.log("Titular:", draft.titular);
  console.log("Sección:", draft.seccion);
  console.log("Tags:", draft.tags.join(", "));
  console.log("\nEntradilla:\n", draft.entradilla);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
