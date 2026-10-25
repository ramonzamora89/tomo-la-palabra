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
 */
export function Epigrafe({
  versos,
  cancion,
  autor,
}: {
  versos: string;
  cancion: string;
  autor: string;
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
    </figure>
  );
}

/** Section break (the Doc's `***`). */
export function Pausa() {
  return <hr className="not-prose mx-auto my-14 h-1 w-20 rounded-full border-0 bg-brand-amarillo" />;
}
