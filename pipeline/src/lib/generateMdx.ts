import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { ParsedDoc } from "./parseDoc";
import type { DocImage } from "./downloadImages";
import { extractYoutubeVideoId, todayInGuatemala } from "./slug";
import { resolveCategoria } from "../../../content/taxonomy/categorias";

/** "Sí", "si", "SÍ.", "x"… — anything else (empty, "no") is a no. */
function isAffirmative(text: string | undefined): boolean {
  const firstWord = (text ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z]+/)[0];
  return ["si", "yes", "x"].includes(firstWord);
}

export function generateMdxFile(params: {
  sections: ParsedDoc;
  slug: string;
  author: string;
  images: DocImage[];
  repoRoot: string;
  documentId: string;
  /** Path of this same note under its old slug, when the Titular changed. */
  previousFilePath?: string;
}): { filePath: string } {
  const { sections, slug, author, images, repoRoot, documentId } = params;
  const filePath = path.join(repoRoot, "content", "notas", `${slug}.mdx`);
  const previousFilePath = params.previousFilePath ?? filePath;

  const rawYoutubeUrl = (sections.youtubeUrl ?? "").trim();
  const hasYoutubeUrl = rawYoutubeUrl.length > 0 && !/pendiente/i.test(rawYoutubeUrl);
  const youtubeVideoId = hasYoutubeUrl ? extractYoutubeVideoId(rawYoutubeUrl) : undefined;

  const tags = (sections.tags ?? "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const rawSeccion = (sections.seccion ?? "").trim();
  const categoria = resolveCategoria(rawSeccion);
  if (!categoria) {
    console.warn(`Sección "${rawSeccion}" no está en la taxonomía — se publica tal cual.`);
  }

  // Re-publishing an edited Doc (Archivo → Publicar) keeps the original
  // publication date and records the edit as updatedDate instead.
  const today = todayInGuatemala();
  const previous = fs.existsSync(previousFilePath)
    ? (matter(fs.readFileSync(previousFilePath, "utf8")).data as { pubDate?: string })
    : undefined;

  const [cover, ...rest] = images;

  const frontmatter: Record<string, unknown> = {
    title: sections.titular,
    slug,
    dek: sections.entradilla ?? "",
    pubDate: previous?.pubDate ?? today,
    author,
    category: categoria?.slug ?? rawSeccion,
    tags,
    coverImage: cover ? `/images/notas/${slug}/${cover.fileName}` : "/images/paper-texture.svg",
    coverImageAlt: cover?.alt ?? sections.titular,
  };

  if (previous?.pubDate && previous.pubDate !== today) frontmatter.updatedDate = today;

  if (isAffirmative(sections.destacada)) frontmatter.featured = true;

  const autorBio = (sections.autorBio ?? "").trim();
  if (autorBio) frontmatter.authorBio = autorBio;

  // When the note has a video, the cover isn't shown on the note page (the
  // embed takes its place), so the gallery includes it. Otherwise the cover
  // is already at the top and the gallery holds only the rest.
  const gallery = youtubeVideoId ? images : rest;
  if (gallery.length > 0) {
    frontmatter.images = gallery.map((img) => ({
      src: `/images/notas/${slug}/${img.fileName}`,
      alt: img.alt ?? "",
      width: img.width,
      height: img.height,
    }));
  }

  frontmatter.sourceDocId = documentId;

  if (hasYoutubeUrl) {
    frontmatter.youtubeUrl = rawYoutubeUrl;
    if (youtubeVideoId) frontmatter.youtubeVideoId = youtubeVideoId;
  }

  const transcripcion = (sections.transcripcion ?? "").trim();
  let body = `${sections.cuerpo ?? ""}\n`;
  if (gallery.length > 0) body += `\n<Galeria />\n`;
  if (transcripcion) body += `\n<TranscriptToggle>\n${transcripcion}\n</TranscriptToggle>\n`;

  const fileContent = matter.stringify(body, frontmatter);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, fileContent);

  return { filePath };
}
