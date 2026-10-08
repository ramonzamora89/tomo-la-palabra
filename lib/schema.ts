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
  author: z.string(), // = "Autor" in the Doc; "Redacción Tomo la Palabra" by default
  authorBio: z.string().optional(), // = "Sobre el autor" — Opinión columns

  category: z.string(), // = "Sección" in the Doc
  tags: z.array(z.string()).default([]),
  coverImage: z.string(),
  coverImageAlt: z.string(),
  // Every other photo inserted in the Doc, in document order — rendered by
  // <Galeria /> after the body. Includes the cover when the note has a
  // video, since the embed replaces the cover on the note page.
  images: z
    .array(
      z.object({
        src: z.string(),
        alt: z.string(),
        width: z.number().optional(),
        height: z.number().optional(),
      }),
    )
    .default([]),
  // Optional: an Opinión piece may not originate from a video interview.
  youtubeUrl: z.string().optional(),
  youtubeVideoId: z.string().optional(),
  videoDurationSeconds: z.number().optional(),
  canonicalUrl: z.string().optional(),
  // Google Doc this note was published from — lets a re-publish with an
  // edited Titular (new slug) find and replace the old note.
  sourceDocId: z.string().optional(),
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
