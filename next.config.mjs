import fs from "node:fs";
import matter from "gray-matter";

// Written by the publish pipeline when a note is re-published under a new
// Titular (pipeline/src/lib/renamedNota.ts): old /nota/ URL → new one.
const notaRedirects = JSON.parse(fs.readFileSync("./content/redirects.json", "utf8"));

// Notes with a `publishAt` embargo, slug → date-time. middleware.ts can't
// read the filesystem, so the list is inlined into it at build time.
const embargos = Object.fromEntries(
  fs
    .readdirSync("./content/notas")
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => matter(fs.readFileSync(`./content/notas/${f}`, "utf8")).data)
    .filter((d) => d.publishAt)
    .map((d) => [d.slug, String(d.publishAt)]),
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    EMBARGOS_JSON: JSON.stringify(embargos),
    // Shared with the editorial team to preview embargoed notes. Lives in
    // Vercel (Production, type Config so `vercel pull` brings it to the
    // build); without it an embargoed note simply stays closed.
    EMBARGO_PASSWORD: process.env.EMBARGO_PASSWORD ?? "",
  },
  async redirects() {
    return [
      // "Reportaje" was retired in the October 2026 section overhaul; most
      // of its notes went to Profundidad.
      { source: "/categoria/reportaje", destination: "/categoria/profundidad", permanent: true },
      // Opinión was folded into Voces, which became the opinion section.
      { source: "/categoria/opinion", destination: "/categoria/voces", permanent: true },
      ...notaRedirects.map((r) => ({ ...r, permanent: true })),
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
    // Placeholder cover art is SVG until real photography is available.
    dangerouslyAllowSVG: true,
    contentDispositionType: "inline",
  },
};

export default nextConfig;
