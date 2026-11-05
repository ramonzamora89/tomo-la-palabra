import { Fragment } from "react";

/**
 * Pieces for hand-built special notes (`especial: true` in the frontmatter).
 * They're placed by hand in the MDX, so their props are strings:
 * next-mdx-remote v6 blocks JS expressions.
 */

// Photos and cover break out of the 3xl reading column, only where the
// viewport has room for it (from lg) so it never scrolls sideways.
export const FOTO_AMPLIA = "lg:-mx-24 xl:-mx-32";
export const FOTO_AMPLIA_SIZES = "(min-width: 1280px) 992px, (min-width: 1024px) 928px, 100vw";

/**
 * A song stanza opening a section: one verse per line, in italics, with
 * the song and artist below. Verses are separated by "|" in `versos`.
 * `spotify` (a track ID, from open.spotify.com/track/<ID>) adds Spotify's
 * compact player underneath — lazy-loaded, like the short-video embeds.
 */
export function Epigrafe({
  versos,
  cancion,
  autor,
  spotify,
}: {
  versos: string;
  cancion: string;
  autor: string;
  spotify?: string;
}) {
  const lineas = versos.split("|").map((l) => l.trim());
  return (
    <figure className="not-prose my-12 ml-auto max-w-md border-r-4 border-brand-amarillo pr-5 text-right">
      <blockquote className="text-lg italic leading-relaxed text-ink-700">
        <p>
          {lineas.map((linea, i) => (
            <Fragment key={i}>
              {i > 0 && <br />}
              {linea}
            </Fragment>
          ))}
        </p>
      </blockquote>
      <figcaption className="mt-3 text-sm uppercase tracking-wide text-ink-600">
        “{cancion}”, {autor}
      </figcaption>
      {spotify && (
        <>
          <iframe
            src={`https://open.spotify.com/embed/track/${spotify}?utm_source=generator`}
            title={`Escuchar “${cancion}”, de ${autor}, en Spotify`}
            width="100%"
            height="80"
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            className="mt-3 rounded-xl border-0"
          />
          <a
            href={`https://open.spotify.com/track/${spotify}`}
            className="mt-1 inline-block text-xs text-ink-600 underline hover:text-brand-verde"
          >
            Escuchar en Spotify
          </a>
        </>
      )}
    </figure>
  );
}

/**
 * A partner's interactive embed (e.g. Ciclos CAP's special), from the iframe
 * code they send. Their `style="…"` can't go in MDX (it would be a JS
 * object), so it's rebuilt here. `alto` in px; `titulo` is the iframe's
 * accessible name. A plain link below in case the iframe doesn't load.
 */
export function Incrustado({
  src,
  titulo,
  alto = "600",
  amplia,
}: {
  src: string;
  titulo: string;
  alto?: string;
  amplia?: boolean;
}) {
  return (
    <div className={`not-prose my-10 ${amplia ? FOTO_AMPLIA : ""}`}>
      <iframe
        src={src}
        title={titulo}
        width="100%"
        height={alto}
        loading="lazy"
        className="mx-auto block overflow-hidden rounded-xl border-0"
      />
      <a
        href={src}
        className="mt-2 inline-block text-sm text-ink-600 underline hover:text-brand-verde"
      >
        Abrir “{titulo}” en una página aparte
      </a>
    </div>
  );
}

/** Section break (the Doc's `***`). */
export function Pausa() {
  return <hr className="not-prose mx-auto my-14 h-1 w-20 rounded-full border-0 bg-brand-amarillo" />;
}
