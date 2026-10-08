import fs from "node:fs";

// Written by the publish pipeline when a note is re-published under a new
// Titular (pipeline/src/lib/renamedNota.ts): old /nota/ URL → new one.
const notaRedirects = JSON.parse(fs.readFileSync("./content/redirects.json", "utf8"));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // "Reportaje" was retired in the October 2026 section overhaul; most
      // of its notes went to Profundidad.
      { source: "/categoria/reportaje", destination: "/categoria/profundidad", permanent: true },
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
