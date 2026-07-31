import Link from "next/link";
import { categorias } from "@/content/taxonomy/categorias";

export function SiteHeader() {
  return (
    <header className="border-b border-brand-gris bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-hand text-3xl leading-none text-brand-verde">
          Tomo la Palabra
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium uppercase tracking-wide text-ink-800">
          {categorias.map((c) => (
            <Link key={c.slug} href={`/categoria/${c.slug}`} className="hover:text-brand-verde">
              {c.nombre}
            </Link>
          ))}
          <Link href="/videos" className="hover:text-brand-verde">
            Videos
          </Link>
        </nav>
      </div>
    </header>
  );
}
