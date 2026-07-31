import type { Metadata } from "next";
import { Raleway, Anton, Permanent_Marker } from "next/font/google";
import Script from "next/script";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { JsonLd } from "@/components/JsonLd";
import { organizationJsonLd, SITE_NAME, SITE_URL } from "@/lib/seo";
import "@/styles/globals.css";

// TODO: swap these for the real licensed Chantal/Dreamwalker font files
// once sourced from the brand designer (Voice Agency) — see brandbook.
// Anton stands in for Dreamwalker (bold display), Permanent Marker for
// Chantal (handwritten/marker). Raleway is the brandbook's actual font.
const bodyFont = Raleway({ subsets: ["latin"], variable: "--font-body" });
const displayFont = Anton({ subsets: ["latin"], weight: "400", variable: "--font-display" });
const handFont = Permanent_Marker({ subsets: ["latin"], weight: "400", variable: "--font-hand" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description:
    "Tomo la Palabra da voz a la gente común de Guatemala a través de entrevistas en video.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  return (
    <html lang="es-GT" className={`${bodyFont.variable} ${displayFont.variable} ${handFont.variable}`}>
      <body className="font-sans">
        <a href="#main-content" className="sr-only-focusable bg-brand-verde px-4 py-2 text-white">
          Saltar al contenido principal
        </a>
        <JsonLd data={organizationJsonLd()} />
        {adsenseClientId && (
          <Script
            async
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
            crossOrigin="anonymous"
          />
        )}
        <SiteHeader />
        <main id="main-content">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
