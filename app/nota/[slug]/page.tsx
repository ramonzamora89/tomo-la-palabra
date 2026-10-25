import { notFound } from "next/navigation";
import Image from "next/image";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { Metadata } from "next";
import { enEmbargo, getNotaBySlug, getRelatedNotas, getSlugsParaPaginas } from "@/lib/notas";
import { getCategoria } from "@/content/taxonomy/categorias";
import { CategoryBadge } from "@/components/CategoryBadge";
import { ArticleCard } from "@/components/ArticleCard";
import { AdSlot } from "@/components/AdSlot";
import { JsonLd } from "@/components/JsonLd";
import { TranscriptToggle } from "@/components/TranscriptToggle";
import { Foto, Galeria } from "@/components/Galeria";
import { Epigrafe, FOTO_AMPLIA, FOTO_AMPLIA_SIZES, Pausa } from "@/components/Especial";
import { intercalarFotos } from "@/lib/intercalarFotos";
import { citasEnEspanol } from "@/lib/citas";
import { VideosCortos } from "@/components/VideosCortos";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  newsArticleJsonLd,
  videoObjectJsonLd,
} from "@/lib/seo";

export function generateStaticParams() {
  // Embargoed notes too: their page is built ahead of time and middleware.ts
  // holds it behind the team's password until publishAt.
  return getSlugsParaPaginas().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const nota = getNotaBySlug(slug);
  if (!nota) return {};

  return {
    title: nota.title,
    description: nota.dek,
    alternates: { canonical: nota.canonicalUrl ?? absoluteUrl(`/nota/${nota.slug}`) },
    robots: nota.noindex || enEmbargo(nota) ? { index: false, follow: false } : undefined,
    openGraph: {
      title: nota.title,
      description: nota.dek,
      type: "article",
      publishedTime: nota.pubDate,
      authors: [nota.author],
      images: [absoluteUrl(nota.coverImage)],
    },
    twitter: {
      card: "summary_large_image",
      title: nota.title,
      description: nota.dek,
      images: [absoluteUrl(nota.coverImage)],
    },
  };
}

// pubDate is a bare date ("2026-10-07"), which JS parses as UTC midnight —
// formatting it in Guatemala time would show the previous day.
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-GT", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function NotaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const nota = getNotaBySlug(slug);
  if (!nota) notFound();

  const categoria = getCategoria(nota.category);
  const related = getRelatedNotas(nota);
  const videoJsonLd = videoObjectJsonLd(nota);
  // Voces is the opinion section: signed columns, not interviews.
  const esOpinion = nota.category === "voces";
  // The paper texture is the "no photo" placeholder — fine on a card, but
  // an empty textured box at the top of the note itself reads as a bug.
  const hasCover = nota.coverImage !== "/images/paper-texture.svg";
  const fotos = intercalarFotos(citasEnEspanol(nota.content), nota.images.length);
  // Short videos go at the very end of the note's text, before the
  // transcript (or simply last, when there's no transcript).
  const content = fotos.content.includes("<TranscriptToggle>")
    ? fotos.content.replace("<TranscriptToggle>", "<VideosCortos />\n\n<TranscriptToggle>")
    : `${fotos.content}\n\n<VideosCortos />\n`;
  const usadas = fotos.usadas;

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <JsonLd data={newsArticleJsonLd(nota)} />
      {videoJsonLd && <JsonLd data={videoJsonLd} />}
      <JsonLd data={breadcrumbJsonLd(nota)} />

      <CategoryBadge slug={nota.category} />
      <h1 className="mt-3 font-display text-3xl leading-[1.05] tracking-tight text-brand-verde md:text-5xl">
        {nota.title}
      </h1>
      <p className="mt-3 text-lg text-ink-600">{nota.dek}</p>
      {esOpinion ? (
        <p className="mt-5 border-l-4 border-brand-amarillo pl-3">
          <span className="block font-hand text-2xl leading-tight text-brand-verde">
            {nota.author}
          </span>
          <span className="text-sm uppercase tracking-wide text-ink-600">
            Columna de opinión &middot;{" "}
            <time dateTime={nota.pubDate}>{formatDate(nota.pubDate)}</time>
          </span>
        </p>
      ) : (
        <p className="mt-4 text-sm uppercase tracking-wide text-ink-600">
          Por {nota.author} &middot; <time dateTime={nota.pubDate}>{formatDate(nota.pubDate)}</time>
          {categoria ? <> &middot; {categoria.nombre}</> : null}
        </p>
      )}

      {nota.youtubeVideoId ? (
        <div className="relative mt-6 aspect-video overflow-hidden bg-black">
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube.com/embed/${nota.youtubeVideoId}`}
            title={nota.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : hasCover ? (
        <div
          className={`relative mt-6 aspect-video overflow-hidden bg-ink-200 ${nota.especial ? FOTO_AMPLIA : ""}`}
        >
          <Image
            src={nota.coverImage}
            alt={nota.coverImageAlt}
            fill
            priority
            className="object-cover"
            sizes={nota.especial ? FOTO_AMPLIA_SIZES : "(min-width: 768px) 768px, 100vw"}
          />
        </div>
      ) : null}

      <div className="prose prose-lg mt-8 max-w-none prose-headings:font-display prose-headings:text-brand-verde prose-blockquote:font-hand prose-blockquote:text-2xl prose-blockquote:not-italic prose-blockquote:text-brand-verde prose-blockquote:border-brand-amarillo">
        <MDXRemote
          source={content}
          components={{
            TranscriptToggle,
            Foto: ({ n }: { n: string }) => (
              <Foto img={nota.images[Number(n)]} amplia={nota.especial} />
            ),
            Epigrafe,
            Pausa,
            Galeria: () => <Galeria images={nota.images.slice(usadas)} />,
            VideosCortos: () => <VideosCortos nota={nota} />,
          }}
        />
      </div>

      {esOpinion && (
        <aside className="mt-10 border-t border-brand-gris pt-6">
          {nota.authorBio && (
            <>
              <h2 className="font-display text-xl text-brand-verde">Sobre {nota.author}</h2>
              <p className="mt-2 text-ink-700">{nota.authorBio}</p>
            </>
          )}
          <p className="mt-4 text-sm italic text-ink-600">
            Las opiniones expresadas en esta columna son responsabilidad de quien la firma y no
            representan necesariamente la línea editorial de Tomo la Palabra.
          </p>
        </aside>
      )}

      <div className="my-10">
        <AdSlot id={`nota-${nota.slug}-in-article`} type="in-article" />
      </div>

      {related.length > 0 && (
        <section className="mt-12 border-t border-brand-gris pt-8">
          <h2 className="font-display text-xl text-brand-verde">También te puede interesar</h2>
          <div className="mt-4 grid gap-8 sm:grid-cols-3">
            {related.map((r) => (
              <ArticleCard key={r.slug} nota={r} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-10">
        <AdSlot id={`nota-${nota.slug}-rectangle`} type="rectangle" />
      </div>
    </article>
  );
}
