import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { ParsedDoc } from "./parseDoc";
import { extractYoutubeVideoId } from "./slug";

export function generateMdxFile(params: {
  sections: ParsedDoc;
  slug: string;
  author: string;
  coverImageFileName?: string;
  coverImageAlt?: string;
  repoRoot: string;
}): { filePath: string } {
  const { sections, slug, author, coverImageFileName, coverImageAlt, repoRoot } = params;

  const rawYoutubeUrl = (sections.youtubeUrl ?? "").trim();
  const hasYoutubeUrl = rawYoutubeUrl.length > 0 && !/pendiente/i.test(rawYoutubeUrl);
  const youtubeVideoId = hasYoutubeUrl ? extractYoutubeVideoId(rawYoutubeUrl) : undefined;

  const tags = (sections.tags ?? "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const frontmatter: Record<string, unknown> = {
    title: sections.titular,
    slug,
    dek: sections.entradilla,
    pubDate: new Date().toISOString().slice(0, 10),
    author,
    category: sections.seccion,
    tags,
    coverImage: coverImageFileName
      ? `/images/notas/${slug}/${coverImageFileName}`
      : "/images/paper-texture.svg",
    coverImageAlt: coverImageAlt ?? sections.titular,
  };

  if (hasYoutubeUrl) {
    frontmatter.youtubeUrl = rawYoutubeUrl;
    if (youtubeVideoId) frontmatter.youtubeVideoId = youtubeVideoId;
  }

  const body = `${sections.cuerpo ?? ""}\n\n<TranscriptToggle>\n${sections.transcripcion ?? ""}\n</TranscriptToggle>\n`;

  const fileContent = matter.stringify(body, frontmatter);
  const filePath = path.join(repoRoot, "content", "notas", `${slug}.mdx`);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, fileContent);

  return { filePath };
}
