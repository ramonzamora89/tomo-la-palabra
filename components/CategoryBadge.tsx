import Link from "next/link";
import { getCategoria } from "@/content/taxonomy/categorias";

const ACCENT_BG: Record<string, string> = {
  verde: "bg-brand-verde text-white",
  amarillo: "bg-brand-amarillo text-brand-verde",
};

export function CategoryBadge({ slug }: { slug: string }) {
  const categoria = getCategoria(slug);
  const label = categoria?.nombre ?? slug;
  const accent = ACCENT_BG[categoria?.accent ?? "verde"];

  return (
    <Link
      href={`/categoria/${slug}`}
      className={`inline-block -rotate-1 rounded-sm px-2.5 py-1 font-hand text-sm leading-none tracking-wide ${accent}`}
    >
      {label}
    </Link>
  );
}
