import { getAllNotas } from "@/lib/notas";
import { categorias } from "@/content/taxonomy/categorias";
import { SITE_URL, SITE_NAME } from "@/lib/seo";

// No official Next.js metadata-route convention exists for llms.txt (unlike
// sitemap.xml/robots.txt), so a plain Route Handler is the correct escape
// hatch. Kept dynamic (not cached at build time) so it always reflects the
// latest published notas without a redeploy. (Don't also add a static
// /public/llms.txt — a static file and a route handler at the same path
// conflict; this route IS the file.)
export const dynamic = "force-dynamic";

export async function GET() {
  const notas = getAllNotas().slice(0, 20);

  const lines = [
    `# ${SITE_NAME}`,
    "",
    "> Tomo la Palabra da voz a la gente común de Guatemala a través de entrevistas en video largas, transcritas y publicadas junto a la nota periodística completa.",
    "",
    `Sitio: ${SITE_URL}`,
    "",
    "## Secciones",
    ...categorias.map((c) => `- [${c.nombre}](${SITE_URL}/categoria/${c.slug})`),
    "",
    "## Notas recientes",
    ...notas.map((n) => `- [${n.title}](${SITE_URL}/nota/${n.slug}): ${n.dek}`),
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
