import type { Nota } from "@/lib/schema";
import { embedUrl, NOMBRE_PLATAFORMA, type VideoCorto } from "@/lib/videosCortos";

// Each network's official player, at a fixed width that fits a phone.
// Instagram's embed doesn't resize itself without its script: 640px holds
// header + 4:5 video + footer at 340px wide (measured October 2026).
const MARCO: Record<VideoCorto["plataforma"], string> = {
  instagram: "h-[640px]",
  tiktok: "aspect-[9/16]",
  youtube: "aspect-[9/16]",
};

/**
 * Reels / TikToks / Shorts linked under "Videos cortos" in the Doc, at the
 * end of the note (before the transcript). Iframes load lazily, so the
 * third-party players don't cost anything until the reader scrolls there.
 */
export function VideosCortos({ nota }: { nota: Nota }) {
  if (nota.videosCortos.length === 0) return null;

  return (
    <section className="not-prose my-12 border-t border-brand-gris pt-8" aria-labelledby="videos-cortos">
      <h2 id="videos-cortos" className="font-display text-2xl text-brand-verde">
        También en redes
      </h2>
      <div className="mt-6 flex flex-wrap justify-center gap-8">
        {nota.videosCortos.map((v) => {
          const red = NOMBRE_PLATAFORMA[v.plataforma];
          return (
            <figure key={`${v.plataforma}-${v.id}`} className="m-0 w-[340px] max-w-full">
              <iframe
                src={embedUrl(v)}
                title={`Video de ${red}: ${nota.title}`}
                loading="lazy"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; fullscreen"
                allowFullScreen
                className={`w-full border border-ink-200 bg-white ${MARCO[v.plataforma]}`}
              />
              <figcaption className="mt-2 text-center text-sm">
                <a
                  href={v.url}
                  className="text-brand-verde underline decoration-brand-amarillo decoration-2 underline-offset-4"
                >
                  Ver en {red}
                </a>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
