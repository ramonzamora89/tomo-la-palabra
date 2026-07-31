import type { Metadata } from "next";
import { getAllTags, getNotasByTag } from "@/lib/notas";
import { ArticleCard } from "@/components/ArticleCard";
import { GrungeDivider } from "@/components/GrungeDivider";

export function generateStaticParams() {
  return getAllTags().map((tag) => ({ tag }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  return { title: `#${tag}` };
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const notas = getNotasByTag(tag);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl tracking-tight text-brand-verde">#{tag}</h1>
      <GrungeDivider className="my-3" />
      <div className="grid gap-8 md:grid-cols-3">
        {notas.map((nota) => (
          <ArticleCard key={nota.slug} nota={nota} />
        ))}
      </div>
    </section>
  );
}
