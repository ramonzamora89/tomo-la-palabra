import fs from "node:fs";
import path from "node:path";
import type { docs_v1 } from "googleapis";

/**
 * Inline image contentUris are short-lived signed URLs — must be fetched
 * right after documents.get(), in the same script run (see plan §5).
 */
export async function downloadDocImages(
  document: docs_v1.Schema$Document,
  outputDir: string,
): Promise<{ coverImage?: string; coverImageAlt?: string }> {
  const inlineObjects = document.inlineObjects ?? {};
  const entries = Object.values(inlineObjects);

  if (entries.length === 0) return {};

  fs.mkdirSync(outputDir, { recursive: true });

  let coverImage: string | undefined;
  let coverImageAlt: string | undefined;
  let index = 0;

  for (const obj of entries) {
    const embedded = obj.inlineObjectProperties?.embeddedObject;
    const contentUri = embedded?.imageProperties?.contentUri;
    if (!contentUri) continue;

    const res = await fetch(contentUri);
    if (!res.ok) continue;
    const buffer = Buffer.from(await res.arrayBuffer());

    const fileName = index === 0 ? "cover.jpg" : `image-${index}.jpg`;
    fs.writeFileSync(path.join(outputDir, fileName), buffer);

    if (index === 0) {
      coverImage = fileName;
      coverImageAlt = embedded?.description || embedded?.title || undefined;
    }
    index += 1;
  }

  return { coverImage, coverImageAlt };
}
