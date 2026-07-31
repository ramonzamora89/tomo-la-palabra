"use client";

import { useState } from "react";

/**
 * The transcript is always present in the initial server-rendered HTML —
 * this component only toggles CSS visibility (max-height), it never
 * conditionally unmounts the content. That's what makes the full verbatim
 * transcript indexable by search/answer engines regardless of JS execution.
 */
export function TranscriptToggle({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-10 border-t border-brand-gris pt-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="font-hand text-xl text-brand-verde underline decoration-brand-amarillo decoration-2 underline-offset-4"
      >
        {open ? "Ocultar transcripción completa" : "Ver transcripción completa"} {open ? "▴" : "▾"}
      </button>
      <div
        className={`prose prose-sm mt-4 max-w-none whitespace-pre-wrap text-ink-700 ${
          open ? "max-h-none" : "max-h-0 overflow-hidden"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
