"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { categorias } from "@/content/taxonomy/categorias";

const MENU_ID = "mobile-nav-menu";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={MENU_ID}
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        className="flex h-9 w-9 flex-col items-center justify-center gap-1.5"
      >
        <span
          aria-hidden="true"
          className={`block h-0.5 w-6 bg-brand-verde transition-transform ${
            open ? "translate-y-2 rotate-45" : ""
          }`}
        />
        <span
          aria-hidden="true"
          className={`block h-0.5 w-6 bg-brand-verde transition-opacity ${open ? "opacity-0" : ""}`}
        />
        <span
          aria-hidden="true"
          className={`block h-0.5 w-6 bg-brand-verde transition-transform ${
            open ? "-translate-y-2 -rotate-45" : ""
          }`}
        />
      </button>

      {open && (
        <nav
          id={MENU_ID}
          aria-label="Menú principal"
          className="absolute left-0 right-0 top-full flex flex-col border-b border-brand-gris bg-white px-4 py-3 text-sm font-medium uppercase tracking-wide text-ink-800 shadow-sm"
        >
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
