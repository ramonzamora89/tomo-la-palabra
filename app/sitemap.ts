import type { MetadataRoute } from "next";
import { getAllNotas, getAllTags } from "@/lib/notas";
import { categorias } from "@/content/taxonomy/categorias";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const notas = getAllNotas();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/videos`, changeFrequency: "daily", priority: 0.7 },
    ...categorias.map((c) => ({
      url: `${SITE_URL}/categoria/${c.slug}`,
      changeFrequency: "hourly" as const,
      priority: 0.8,
    })),
    ...getAllTags().map((tag) => ({
      url: `${SITE_URL}/tag/${tag}`,
      changeFrequency: "daily" as const,
      priority: 0.5,
    })),
  ];

  const notaRoutes: MetadataRoute.Sitemap = notas.map((n) => ({
    url: `${SITE_URL}/nota/${n.slug}`,
    lastModified: n.updatedDate ?? n.pubDate,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticRoutes, ...notaRoutes];
}
