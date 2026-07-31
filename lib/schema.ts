import { z } from "zod";

/**
 * Contract between the content pipeline (pipeline/src/generateMdx.ts) and
 * the site. A "nota" is one published note; frontmatter fields here map
 * directly to the Google Doc headings the pipeline parses
 * (Titular, Sección, Entradilla, Cuerpo, Imágenes, Tags, YouTube URL).
 */
export const notaSchema = z.object({
  title: z.string(),
  slug: z.string(),
  dek: z.string(), // Entradilla — also used as meta description / OG description
  pubDate: z.string(), // ISO 8601
  updatedDate: z.string().optional(),
  author: z.string(),
  category: z.string(), // = "Sección" in the Doc
  tags: z.array(z.string()).default([]),
  coverImage: z.string(),
  coverImageAlt: z.string(),
  // Optional: an Opinión piece may not originate from a video interview.
  youtubeUrl: z.string().optional(),
  youtubeVideoId: z.string().optional(),
  videoDurationSeconds: z.number().optional(),
  canonicalUrl: z.string().optional(),
  noindex: z.boolean().optional(),
  // Reserved for later phases — unused in v1, see plan.
  premium: z.boolean().optional(),
  featured: z.boolean().optional(),
});

export type Nota = z.infer<typeof notaSchema> & {
  // Raw MDX body (Cuerpo + an embedded <TranscriptToggle> block when the
  // pipeline includes the full interview transcript) — rendered via
  // next-mdx-remote in app/nota/[slug]/page.tsx.
  content: string;
};
