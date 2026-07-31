import Image from "next/image";
import Link from "next/link";
import type { Nota } from "@/lib/schema";
import { CategoryBadge } from "./CategoryBadge";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-GT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ArticleCard({ nota, size = "md" }: { nota: Nota; size?: "md" | "lg" }) {
  const headlineSize = size === "lg" ? "text-3xl md:text-4xl" : "text-xl";

  return (
    <article className="group flex flex-col gap-3">
      <Link href={`/nota/${nota.slug}`} className="relative block aspect-video overflow-hidden bg-ink-200">
        <Image
          src={nota.coverImage}
          alt={nota.coverImageAlt}
          fill
          className="object-cover grayscale transition group-hover:grayscale-0"
          sizes="(min-width: 768px) 50vw, 100vw"
        />
      </Link>
      <div className="flex flex-col gap-2">
        <CategoryBadge slug={nota.category} />
        <Link href={`/nota/${nota.slug}`}>
          <h3 className={`font-display leading-tight tracking-tight text-brand-verde group-hover:underline ${headlineSize}`}>
            {nota.title}
          </h3>
        </Link>
        <p className="line-clamp-2 text-sm text-ink-600">{nota.dek}</p>
        <p className="text-xs uppercase tracking-wide text-ink-500">
          {nota.author} &middot; {formatDate(nota.pubDate)}
        </p>
      </div>
    </article>
  );
}
