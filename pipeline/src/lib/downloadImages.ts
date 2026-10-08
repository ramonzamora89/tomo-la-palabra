import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import type { docs_v1 } from "googleapis";

// Widest an image is ever shown on the site (hero/OG at 2x on a ~1000px
// column) — anything bigger only bloats the repo and the deploy.
const MAX_WIDTH = 1920;

export type DocImage = { fileName: string; alt?: string; width: number; height: number };

/**
 * Google Docs stores an image in one of two places depending on how it was
 * inserted: "In line" images live in `inlineObjects` and appear as elements
 * inside a paragraph; anything with text wrapping ("Wrap text", "Break
 * text", "In front of text"…) lives in `positionedObjects` and is only
 * anchored to a paragraph. Editors use both, so both are collected, in the
 * order they appear in the document — the first one is the cover.
 */
function imageIdsInDocumentOrder(
  document: docs_v1.Schema$Document,
): { id: string; kind: "inline" | "positioned" }[] {
  const ids: { id: string; kind: "inline" | "positioned" }[] = [];
  const seen = new Set<string>();
  const push = (id: string, kind: "inline" | "positioned") => {
    if (seen.has(id)) return;
    seen.add(id);
    ids.push({ id, kind });
  };

  for (const element of document.body?.content ?? []) {
    const paragraph = element.paragraph;
    if (!paragraph) continue;
    for (const id of paragraph.positionedObjectIds ?? []) push(id, "positioned");
    for (const el of paragraph.elements ?? []) {
      const id = el.inlineObjectElement?.inlineObjectId;
      if (id) push(id, "inline");
    }
  }

  // Images inside tables, headers, etc. aren't walked above — keep them
  // rather than silently dropping them, after everything found in order.
  for (const id of Object.keys(document.inlineObjects ?? {})) push(id, "inline");
  for (const id of Object.keys(document.positionedObjects ?? {})) push(id, "positioned");

  return ids;
}

function embeddedObjectFor(
  document: docs_v1.Schema$Document,
  ref: { id: string; kind: "inline" | "positioned" },
): docs_v1.Schema$EmbeddedObject | undefined {
  return ref.kind === "inline"
    ? document.inlineObjects?.[ref.id]?.inlineObjectProperties?.embeddedObject
    : document.positionedObjects?.[ref.id]?.positionedObjectProperties?.embeddedObject;
}

/**
 * Image contentUris are short-lived signed URLs — must be fetched right
 * after documents.get(), in the same script run (see plan §5).
 *
 * Every image is re-encoded as a JPEG no wider than MAX_WIDTH, with EXIF
 * rotation applied (phone photos otherwise show up sideways).
 */
export async function downloadDocImages(
  document: docs_v1.Schema$Document,
  outputDir: string,
): Promise<DocImage[]> {
  const images: DocImage[] = [];
  // The same photo is sometimes pasted twice (e.g. once in line, once
  // floating) — publish it once.
  const seenHashes = new Set<string>();

  for (const ref of imageIdsInDocumentOrder(document)) {
    const embedded = embeddedObjectFor(document, ref);
    const contentUri = embedded?.imageProperties?.contentUri;
    if (!contentUri) continue;

    const res = await fetch(contentUri);
    if (!res.ok) {
      console.warn(`No se pudo descargar una imagen del Doc (HTTP ${res.status}) — se omite.`);
      continue;
    }
    const original = Buffer.from(await res.arrayBuffer());
    const hash = crypto.createHash("sha1").update(original).digest("hex");
    if (seenHashes.has(hash)) continue;
    seenHashes.add(hash);

    const fileName = images.length === 0 ? "cover.jpg" : `image-${images.length}.jpg`;
    fs.mkdirSync(outputDir, { recursive: true });
    const info = await sharp(original)
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(path.join(outputDir, fileName));

    images.push({
      fileName,
      alt: embedded?.description?.trim() || embedded?.title?.trim() || undefined,
      width: info.width,
      height: info.height,
    });
  }

  return images;
}
