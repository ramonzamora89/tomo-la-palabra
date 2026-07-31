"use client";

import { useState } from "react";
import Link from "next/link";
import { categorias } from "@/content/taxonomy/categorias";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        className="flex h-9 w-9 flex-col items-center justify-center gap-1.5"
      >
        <span
          className={`block h-0.5 w-6 bg-brand-verde transition-transform ${
            open ? "translate-y-2 rotate-45" : ""
          }`}
        />
        <span className={`block h-0.5 w-6 bg-brand-verde transition-opacity ${open ? "opacity-0" : ""}`} />
        <span
          className={`block h-0.5 w-6 bg-brand-verde transition-transform ${
            open ? "-translate-y-2 -rotate-45" : ""
          }`}
        />
      </button>

      {open && (
        <nav className="absolute left-0 right-0 top-full flex flex-col border-b border-brand-gris bg-white px-4 py-3 text-sm font-medium uppercase tracking-wide text-ink-800 shadow-sm">
          {categorias.map((c) => (
            <Link
              key={c.slug}
              href={`/categoria/${c.slug}`}
              onClick={() => setOpen(false)}
              className="border-b border-ink-100 py-3 hover:text-brand-verde"
            >
              {c.nombre}
            </Link>
          ))}
          <Link
            href="/videos"
            onClick={() => setOpen(false)}
            className="py-3 hover:text-brand-verde"
          >
            Videos
          </Link>
        </nav>
      )}
    </div>
  );
}
