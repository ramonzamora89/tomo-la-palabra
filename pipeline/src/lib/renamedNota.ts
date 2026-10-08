import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const REDIRECTS_FILE = path.join("content", "redirects.json");

type Redirect = { source: string; destination: string };

/**
 * Slug of an already-published note that came from the same Doc under a
 * different Titular (an editor fixed a name, a typo…). Undefined when the
 * Doc was never published, or still has the same slug.
 */
export function findPreviousSlug(repoRoot: string, documentId: string, slug: string): string | undefined {
  const dir = path.join(repoRoot, "content", "notas");
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".mdx") || file === `${slug}.mdx`) continue;
    const { data } = matter(fs.readFileSync(path.join(dir, file), "utf8"));
    if (data.sourceDocId === documentId) return file.replace(/\.mdx$/, "");
  }
  return undefined;
}

/**
 * Removes the note under its old slug and records a permanent redirect
 * (read by next.config.mjs), so links already shared — and the Registro —
 * keep working. Returns every path the commit has to include.
 */
export function retireOldSlug(repoRoot: string, oldSlug: string, newSlug: string): string[] {
  const oldMdx = path.join(repoRoot, "content", "notas", `${oldSlug}.mdx`);
  const oldImages = path.join(repoRoot, "public", "images", "notas", oldSlug);
  const touched = [oldMdx];
  fs.rmSync(oldMdx, { force: true });
  if (fs.existsSync(oldImages)) {
    fs.rmSync(oldImages, { recursive: true, force: true });
    touched.push(oldImages);
  }

  const file = path.join(repoRoot, REDIRECTS_FILE);
  const redirects: Redirect[] = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : [];
  const from = `/nota/${oldSlug}`;
  const to = `/nota/${newSlug}`;
  // Collapse chains (A→B, then B→C becomes A→C) and drop a redirect away
  // from the new slug if the Titular went back to an earlier version.
  const updated = redirects
    .map((r) => (r.destination === from ? { ...r, destination: to } : r))
    .filter((r) => r.source !== to && r.source !== from && r.source !== r.destination);
  updated.push({ source: from, destination: to });
  fs.writeFileSync(file, JSON.stringify(updated, null, 2) + "\n");
  touched.push(file);

  return touched;
}
