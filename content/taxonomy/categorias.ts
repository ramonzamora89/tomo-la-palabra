/**
 * Controlled section ("Sección") list. This is a placeholder starting
 * taxonomy — the real list is an editorial decision still pending with the
 * Tomo la Palabra team (see plan). Each section gets one accent color from
 * the brand palette, used on category badges and card accents.
 */
export type Categoria = {
  slug: string;
  nombre: string;
  accent: "verde" | "amarillo";
};

export const categorias: Categoria[] = [
  { slug: "reportaje", nombre: "Reportaje", accent: "verde" },
  { slug: "comunidad", nombre: "Comunidad", accent: "amarillo" },
  { slug: "opinion", nombre: "Opinión", accent: "verde" },
];

export function getCategoria(slug: string): Categoria | undefined {
  return categorias.find((c) => c.slug === slug);
}
