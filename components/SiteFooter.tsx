import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-brand-verde text-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="font-hand text-4xl -rotate-1">Contanos tu historia</p>
        <p className="mt-2 max-w-md text-sm text-brand-crema">
          Prohibido dejar de pensar. Dilo sin tabús y sin pelos en la lengua.
        </p>
        <div className="mt-8 flex flex-wrap gap-6 text-sm uppercase tracking-wide text-brand-crema">
          <Link href="/videos" className="hover:text-brand-amarillo">Videos</Link>
          <a href="https://www.instagram.com" className="hover:text-brand-amarillo">Instagram</a>
        </div>
        <p className="mt-8 text-xs text-ink-300">
          &copy; {new Date().getFullYear()} Tomo la Palabra
        </p>
      </div>
    </footer>
  );
}
