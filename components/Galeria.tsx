import Image from "next/image";
import type { Nota } from "@/lib/schema";

/**
 * Photos inserted in the Doc beyond the cover, shown after the body at
 * their own aspect ratio (no cropping — a vertical portrait stays
 * vertical). Placed by the pipeline as `<Galeria />` in the MDX; the page
 * binds it to this note's `images`.
 */
export function Galeria({ images }: { images: Nota["images"] }) {
  if (images.length === 0) return null;

  return (
    <div className="not-prose my-10 flex flex-col gap-8">
      {images.map((img) => (
        <figure key={img.src} className="m-0">
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
      ))}
    </div>
  );
}
