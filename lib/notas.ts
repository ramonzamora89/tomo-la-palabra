import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { notaSchema, type Nota } from "./schema";

const NOTAS_DIR = path.join(process.cwd(), "content", "notas");

function readNota(fileName: string): Nota {
  const raw = fs.readFileSync(path.join(NOTAS_DIR, fileName), "utf8");
  const { data, content } = matter(raw);
  const frontmatter = notaSchema.parse(data);
  return { ...frontmatter, content };
}

export function getAllNotas(): Nota[] {
  if (!fs.existsSync(NOTAS_DIR)) return [];
  return fs
    .readdirSync(NOTAS_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map(readNota)
    .sort((a, b) => (a.pubDate < b.pubDate ? 1 : -1));
}

export function getNotaBySlug(slug: string): Nota | undefined {
  return getAllNotas().find((n) => n.slug === slug);
}

export function getNotasByCategoria(categoria: string): Nota[] {
  return getAllNotas().filter((n) => n.category === categoria);
}

export function getNotasByTag(tag: string): Nota[] {
  return getAllNotas().filter((n) => n.tags.includes(tag));
}

export function getAllTags(): string[] {
  const tags = new Set<string>();
  getAllNotas().forEach((n) => n.tags.forEach((t) => tags.add(t)));
  return Array.from(tags).sort();
}

export function getFeaturedNota(): Nota | undefined {
  const notas = getAllNotas();
  return notas.find((n) => n.featured) ?? notas[0];
}

export function getRelatedNotas(nota: Nota, limit = 3): Nota[] {
  return getAllNotas()
    .filter((n) => n.slug !== nota.slug)
    .sort((a, b) => {
      const aScore =
        (a.category === nota.category ? 2 : 0) +
        a.tags.filter((t) => nota.tags.includes(t)).length;
      const bScore =
        (b.category === nota.category ? 2 : 0) +
        b.tags.filter((t) => nota.tags.includes(t)).length;
      return bScore - aScore;
    })
    .slice(0, limit);
}
