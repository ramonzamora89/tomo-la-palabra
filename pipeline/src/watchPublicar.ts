import fs from "node:fs";
import path from "node:path";
import type { drive_v3, docs_v1, sheets_v4 } from "googleapis";
import { config } from "./lib/config";
import { getGoogleClients } from "./lib/googleClients";
import { parseDocSections } from "./lib/parseDoc";
import { downloadDocImages } from "./lib/downloadImages";
import { generateMdxFile } from "./lib/generateMdx";
import { slugify, todayInGuatemala } from "./lib/slug";
import { commitAndPush } from "./lib/gitCommit";
import { moveDocToArchivo } from "./lib/moveToArchivo";
import { ensureLedgerHeader, appendLedgerRow } from "./lib/updateLedger";
import { findPreviousSlug, retireOldSlug } from "./lib/renamedNota";

const REPO_ROOT = process.cwd();
const DEFAULT_AUTHOR = "Redacción Tomo la Palabra";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tomolapalabra.com";
// Pass a test branch while verifying by hand (plan's M9 milestone) —
// undefined pushes to whatever branch is currently checked out (main in CI).
const PUBLISH_BRANCH = process.env.PUBLISH_BRANCH;

async function processDoc(
  drive: drive_v3.Drive,
  docs: docs_v1.Docs,
  sheets: sheets_v4.Sheets,
  file: drive_v3.Schema$File,
): Promise<void> {
  console.log(`\nPublicando: ${file.name}`);
  const documentId = file.id!;

  const docRes = await docs.documents.get({ documentId });
  const document = docRes.data;

  const sections = parseDocSections(document);
  if (!sections.titular) {
    console.warn(`"${file.name}" no tiene un Titular reconocible — se omite.`);
    return;
  }

  const slug = slugify(sections.titular);
  const author = sections.autor?.trim() || DEFAULT_AUTHOR;

  // Re-publishing replaces the note's images wholesale: a photo removed
  // from the Doc must disappear from the site too, not linger as image-N.
  const imagesDir = path.join(REPO_ROOT, "public", "images", "notas", slug);
  const hadImages = fs.existsSync(imagesDir);
  fs.rmSync(imagesDir, { recursive: true, force: true });
  const images = await downloadDocImages(document, imagesDir);
  console.log(`  ${images.length} imagen(es) encontradas en el Doc.`);

  const previousSlug = findPreviousSlug(REPO_ROOT, documentId, slug);
  const { filePath } = generateMdxFile({
    sections,
    slug,
    author,
    images,
    repoRoot: REPO_ROOT,
    documentId,
    previousFilePath: previousSlug
      ? path.join(REPO_ROOT, "content", "notas", `${previousSlug}.mdx`)
      : undefined,
  });

  // `git add <dir>` also stages deletions inside it — but fails if the
  // path never existed, so only add it when there's something to record.
  const filesToCommit = [filePath];
  if (hadImages || images.length > 0) filesToCommit.push(imagesDir);
  if (previousSlug) {
    console.log(`  El Titular cambió: /nota/${previousSlug} redirige ahora a /nota/${slug}.`);
    filesToCommit.push(...retireOldSlug(REPO_ROOT, previousSlug, slug));
  }

  await commitAndPush({
    repoRoot: REPO_ROOT,
    files: filesToCommit,
    message: `feat(nota): publicar "${sections.titular}"`,
    branch: PUBLISH_BRANCH,
  });

  await moveDocToArchivo(drive, documentId);

  await ensureLedgerHeader(sheets);
  await appendLedgerRow(sheets, {
    fecha: todayInGuatemala(),
    titulo: sections.titular,
    autor: author,
    linkDoc: `https://docs.google.com/document/d/${documentId}/edit`,
    linkYoutube: sections.youtubeUrl ?? "",
    urlPublicada: `${SITE_URL}/nota/${slug}`,
    estado: "Publicado",
  });

  console.log(`Publicado: content/notas/${slug}.mdx`);
}

async function main() {
  const { drive, docs, sheets } = getGoogleClients();

  const list = await drive.files.list({
    q: `'${config.driveFolders.publicar}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.document'`,
    fields: "files(id, name)",
  });

  const docsToPublish = list.data.files ?? [];
  if (docsToPublish.length === 0) {
    console.log("No hay notas listas para publicar.");
    return;
  }

  for (const file of docsToPublish) {
    try {
      await processDoc(drive, docs, sheets, file);
    } catch (err) {
      // A doc never gets moved/marked without a successful publish — see plan.
      console.error(`Error publicando "${file.name}":`, err);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
