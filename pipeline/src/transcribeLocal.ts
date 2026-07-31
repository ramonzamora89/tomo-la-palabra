import path from "node:path";
import fs from "node:fs";
import { extractAudio, callDeepgram, mergeUtterancesIntoTurns, turnsToPlainText } from "./lib/deepgram";

/**
 * M6 verification script: run the transcription step against a real local
 * video file, with no Google Drive involved yet.
 *
 *   npm run pipeline:transcribe-local -- "/path/to/video.mp4"
 */
async function main() {
  const videoPath = process.argv[2];
  if (!videoPath) {
    console.error('Uso: npm run pipeline:transcribe-local -- "/ruta/al/video.mp4"');
    process.exit(1);
  }

  const tmpDir = path.join(process.cwd(), "pipeline", "tmp");
  fs.mkdirSync(tmpDir, { recursive: true });

  const baseName = path.basename(videoPath, path.extname(videoPath));
  const audioPath = path.join(tmpDir, `${baseName}.wav`);

  console.log(`Extrayendo audio de: ${videoPath}`);
  await extractAudio(videoPath, audioPath);
  console.log(`Audio extraído en: ${audioPath}`);

  console.log("Enviando a Deepgram (nova-3, es-419, diarize)...");
  const deepgramResponse = await callDeepgram(audioPath);

  const rawJsonPath = path.join(tmpDir, `${baseName}.deepgram.json`);
  fs.writeFileSync(rawJsonPath, JSON.stringify(deepgramResponse, null, 2));
  console.log(`Respuesta cruda de Deepgram guardada en: ${rawJsonPath}`);

  const turns = mergeUtterancesIntoTurns(deepgramResponse);
  const transcriptText = turnsToPlainText(turns);

  const transcriptPath = path.join(tmpDir, `${baseName}.transcripcion.txt`);
  fs.writeFileSync(transcriptPath, transcriptText);

  console.log(`\nTranscripción (${turns.length} turnos) guardada en: ${transcriptPath}\n`);
  console.log(transcriptText.slice(0, 1000));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
