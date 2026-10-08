import Image from "next/image";
import type { Nota } from "@/lib/schema";

type Imagen = Nota["images"][number];

/**
 * One photo from the Doc, at its own aspect ratio (no cropping — a
 * vertical portrait stays vertical). lib/intercalarFotos.ts places these
 * through the body as `<Foto n="…" />`.
 */
export function Foto({ img }: { img: Imagen | undefined }) {
  if (!img) return null;
  return (
    <figure className="not-prose my-10">
      {img.width && img.height ? (
        <Image
          src={img.src}
          alt={img.alt}
          width={img.width}
          height={img.height}
          className="mx-auto h-auto max-h-[80vh] w-auto max-w-full"
          sizes="(min-width: 768px) 768px, 100vw"
        />
      ) : (
        <div className="relative aspect-video bg-ink-200">
          <Image
            src={img.src}
            alt={img.alt}
            fill
            className="object-contain"
            sizes="(min-width: 768px) 768px, 100vw"
          />
        </div>
      )}
    </figure>
  );
}

/**
 * Whatever photos didn't fit through the body (a short note, or more
 * photos than paragraph breaks), stacked where the pipeline left
 * `<Galeria />` — after the body, before the transcript.
 */
export function Galeria({ images }: { images: Imagen[] }) {
  if (images.length === 0) return null;

  return (
    <div className="my-10">
      {images.map((img) => (
        <Foto key={img.src} img={img} />
      ))}
    </div>
  );
}
