import fs from "node:fs";
import path from "node:path";
import type { drive_v3 } from "googleapis";
import { config } from "./lib/config";
import { getGoogleClients } from "./lib/googleClients";
import { buildDraftDocRequests } from "./lib/googleDocs";
import {
  extractAudio,
  callDeepgram,
  mergeUtterancesIntoTurns,
  turnsToPlainText,
} from "./lib/deepgram";
import { draftArticle } from "./draftArticle";

const STATUS_PROPERTY = "pipelineStatus";
const STATUS_TRANSCRIBED = "transcrito";

// Rare-but-possible unusually long/high-bitrate interview — flag for a
// manual run rather than risk filling the runner disk (see plan §6).
const MAX_VIDEO_BYTES = 4 * 1024 * 1024 * 1024;

async function downloadDriveFile(
  drive: drive_v3.Drive,
  fileId: string,
  destPath: string,
): Promise<void> {
  const res = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "stream" },
  );
  await new Promise<void>((resolve, reject) => {
    const dest = fs.createWriteStream(destPath);
    (res.data as NodeJS.ReadableStream)
      .pipe(dest)
      .on("finish", () => resolve())
      .on("error", reject);
  });
}

async function processVideo(
  drive: drive_v3.Drive,
  docs: ReturnType<typeof getGoogleClients>["docs"],
  video: drive_v3.Schema$File,
  tmpDir: string,
): Promise<void> {
  console.log(`\nProcesando: ${video.name}`);

  const size = Number(video.size ?? 0);
  if (size > MAX_VIDEO_BYTES) {
    console.warn(
      `Saltando "${video.name}" (${(size / 1e9).toFixed(1)} GB) — supera el límite, requiere una corrida manual.`,
    );
    return;
  }

  const videoPath = path.join(tmpDir, video.name!);
  const audioPath = videoPath.replace(path.extname(videoPath), ".wav");

  console.log("Descargando video...");
  await downloadDriveFile(drive, video.id!, videoPath);

  console.log("Extrayendo audio...");
  await extractAudio(videoPath, audioPath);
  fs.unlinkSync(videoPath);

  console.log("Transcribiendo con Deepgram...");
  const deepgramResponse = await callDeepgram(audioPath);
  const turns = mergeUtterancesIntoTurns(deepgramResponse);
  const transcript = turnsToPlainText(turns);
  fs.unlinkSync(audioPath);

  console.log("Redactando borrador con Claude...");
  const draft = await draftArticle(transcript);

  console.log("Creando Google Doc...");
  const createRes = await docs.documents.create({
    requestBody: { title: draft.titular },
  });
  const documentId = createRes.data.documentId!;

  await docs.documents.batchUpdate({
    documentId,
    requestBody: { requests: buildDraftDocRequests(draft, "", transcript) },
  });

  await drive.files.update({
    fileId: documentId,
    addParents: config.driveFolders.borradores,
    fields: "id, parents",
  });

  await drive.files.update({
    fileId: video.id!,
    requestBody: { appProperties: { [STATUS_PROPERTY]: STATUS_TRANSCRIBED } },
  });

  console.log(`Borrador listo: https://docs.google.com/document/d/${documentId}/edit`);
}

async function main() {
  const { drive, docs } = getGoogleClients();

  const list = await drive.files.list({
    q: `'${config.driveFolders.entrevistas}' in parents and trashed = false`,
    fields: "files(id, name, size, appProperties)",
  });

  const videos = (list.data.files ?? []).filter(
    (f) => f.appProperties?.[STATUS_PROPERTY] !== STATUS_TRANSCRIBED,
  );

  if (videos.length === 0) {
    console.log("No hay videos nuevos en Entrevistas.");
    return;
  }

  const tmpDir = path.join(process.cwd(), "pipeline", "tmp");
  fs.mkdirSync(tmpDir, { recursive: true });

  for (const video of videos) {
    await processVideo(drive, docs, video, tmpDir);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
