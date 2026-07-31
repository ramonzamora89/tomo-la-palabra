import Image from "next/image";
import Link from "next/link";
import type { Nota } from "@/lib/schema";
import { CategoryBadge } from "./CategoryBadge";

export function Hero({ nota }: { nota: Nota }) {
  return (
    <section className="relative overflow-hidden bg-brand-verde bg-[url('/images/paper-texture.svg')] bg-cover">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-2 md:py-16">
        <Link href={`/nota/${nota.slug}`} className="relative block aspect-video overflow-hidden">
          <Image
            src={nota.coverImage}
            alt={nota.coverImageAlt}
            fill
            priority
            className="object-cover"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
        </Link>
        <div className="flex flex-col justify-center gap-4 text-white">
          <CategoryBadge slug={nota.category} />
          <Link href={`/nota/${nota.slug}`}>
            <h1 className="font-display text-3xl leading-[1.05] tracking-tight md:text-5xl">
              {nota.title}
            </h1>
          </Link>
          <p className="max-w-md text-brand-crema">{nota.dek}</p>
          <p className="font-hand text-2xl text-brand-amarillo -rotate-1">Guate habla</p>
        </div>
      </div>
    </section>
  );
}
