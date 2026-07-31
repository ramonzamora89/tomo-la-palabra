export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://tomolapalabra.com";

export const SITE_NAME = "Tomo la Palabra";

export function absoluteUrl(pathname: string): string {
  return new URL(pathname, SITE_URL).toString();
}

import type { Nota } from "./schema";
import { getCategoria } from "@/content/taxonomy/categorias";

export function newsArticleJsonLd(nota: Nota) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: nota.title,
    description: nota.dek,
    image: [absoluteUrl(nota.coverImage)],
    datePublished: nota.pubDate,
    dateModified: nota.updatedDate ?? nota.pubDate,
    author: { "@type": "Person", name: nota.author },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: absoluteUrl("/logo/logo.svg") },
    },
    articleSection: getCategoria(nota.category)?.nombre ?? nota.category,
    keywords: nota.tags.join(", "),
    mainEntityOfPage: absoluteUrl(`/nota/${nota.slug}`),
  };
}

export function videoObjectJsonLd(nota: Nota) {
  if (!nota.youtubeVideoId) return null;
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: nota.title,
    description: nota.dek,
    thumbnailUrl: [`https://i.ytimg.com/vi/${nota.youtubeVideoId}/hqdefault.jpg`],
    uploadDate: nota.pubDate,
    embedUrl: `https://www.youtube.com/embed/${nota.youtubeVideoId}`,
    ...(nota.videoDurationSeconds
      ? { duration: `PT${nota.videoDurationSeconds}S` }
      : {}),
  };
}

export function breadcrumbJsonLd(nota: Nota) {
  const categoria = getCategoria(nota.category);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: absoluteUrl("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: categoria?.nombre ?? nota.category,
        item: absoluteUrl(`/categoria/${nota.category}`),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: nota.title,
        item: absoluteUrl(`/nota/${nota.slug}`),
      },
    ],
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/logo/logo.svg"),
    sameAs: ["https://www.instagram.com/tomolapalabra"],
  };
}
