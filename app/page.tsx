import { getAllNotas, getFeaturedNota } from "@/lib/notas";
import { categorias } from "@/content/taxonomy/categorias";
import { Hero } from "@/components/Hero";
import { ArticleCard } from "@/components/ArticleCard";
import { GrungeDivider } from "@/components/GrungeDivider";
import { AdSlot } from "@/components/AdSlot";

export default function HomePage() {
  const notas = getAllNotas();
  const featured = getFeaturedNota();
  const secondary = notas.filter((n) => n.slug !== featured?.slug).slice(0, 3);

  return (
    <>
      {featured && <Hero nota={featured} />}

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          {secondary.map((nota) => (
            <ArticleCard key={nota.slug} nota={nota} />
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        <AdSlot id="home-leaderboard" type="leaderboard" />
      </div>

      {categorias.map((categoria) => {
        const notasCategoria = notas.filter((n) => n.category === categoria.slug);
        if (notasCategoria.length === 0) return null;

        return (
          <section key={categoria.slug} className="mx-auto max-w-6xl px-4 py-10">
            <h2 className="font-display text-2xl tracking-tight text-brand-verde">
              {categoria.nombre}
            </h2>
            <GrungeDivider className="my-3" />
            <div className="grid gap-8 md:grid-cols-3">
              {notasCategoria.map((nota) => (
                <ArticleCard key={nota.slug} nota={nota} />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
