import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategoria, categorias } from "@/content/taxonomy/categorias";
import { getNotasByCategoria } from "@/lib/notas";
import { ArticleCard } from "@/components/ArticleCard";
import { GrungeDivider } from "@/components/GrungeDivider";

export function generateStaticParams() {
  return categorias.map((c) => ({ categoria: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoria: string }>;
}): Promise<Metadata> {
  const { categoria: categoriaSlug } = await params;
  const categoria = getCategoria(categoriaSlug);
  return { title: categoria?.nombre ?? categoriaSlug };
}

export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ categoria: string }>;
}) {
  const { categoria: categoriaSlug } = await params;
  const categoria = getCategoria(categoriaSlug);
  if (!categoria) notFound();

  const notas = getNotasByCategoria(categoria.slug);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl tracking-tight text-brand-verde">{categoria.nombre}</h1>
      <GrungeDivider className="my-3" />
      <div className="grid gap-8 md:grid-cols-3">
        {notas.map((nota) => (
          <ArticleCard key={nota.slug} nota={nota} />
        ))}
      </div>
    </section>
  );
}
