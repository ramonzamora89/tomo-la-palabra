import Link from "next/link";
import { categorias } from "@/content/taxonomy/categorias";
import { MobileNav } from "./MobileNav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-brand-gris bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="whitespace-nowrap font-hand text-3xl leading-none text-brand-verde">
          Tomo la Palabra
        </Link>
        <nav className="hidden items-center gap-4 text-sm font-medium uppercase tracking-wide text-ink-800 xl:flex">
          {categorias.map((c) => (
            <Link key={c.slug} href={`/categoria/${c.slug}`} className="whitespace-nowrap hover:text-brand-verde">
              {c.nombre}
            </Link>
          ))}
          <Link href="/videos" className="hover:text-brand-verde">
            Videos
          </Link>
        </nav>
        <MobileNav />
      </div>
    </header>
  );
}
