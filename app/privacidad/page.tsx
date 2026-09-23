import type { Metadata } from "next";
import { GrungeDivider } from "@/components/GrungeDivider";

// Required as the privacy policy URL of the Google OAuth app the content
// pipeline uses to create Docs (see pipeline/src/oauthSetup.ts). Scoped to
// that internal tool only — not a reader-facing policy for the site.
export const metadata: Metadata = {
  title: "Privacidad del pipeline editorial",
  description:
    "Cómo la herramienta interna de Tomo la Palabra usa los datos de Google Drive para preparar borradores.",
};

export default function PrivacidadPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl tracking-tight text-brand-verde">
        Privacidad del pipeline editorial
      </h1>
      <GrungeDivider className="my-4" />

      <div className="space-y-4 text-ink-700">
        <p>
          Tomo la Palabra Pipeline es una herramienta interna del equipo de Tomo la Palabra. No
          es una aplicación pública: solo la usa el propio equipo, con su propia cuenta de
          Google, para convertir entrevistas en video en borradores de notas.
        </p>

        <h2 className="pt-4 font-display text-xl text-brand-verde">Qué datos de Google usa</h2>
        <p>
          La herramienta accede a Google Drive y Google Docs únicamente dentro de las carpetas
          del proyecto de Tomo la Palabra. Lee los videos que el equipo sube a esas carpetas y
          crea en ellas un documento de Google Docs con el borrador de cada nota. No accede a
          otros archivos de la cuenta, no lee correos ni contactos y no guarda datos de Google
          fuera de ese Drive.
        </p>

        <h2 className="pt-4 font-display text-xl text-brand-verde">Servicios externos</h2>
        <p>
          Para preparar cada borrador, el audio de la entrevista se envía a Deepgram, que lo
          transcribe, y la transcripción se envía a Anthropic (Claude), que redacta una primera
          versión de la nota. Ambos servicios reciben solo el contenido de la entrevista que se
          está procesando. Los datos no se venden ni se comparten con nadie más.
        </p>

        <h2 className="pt-4 font-display text-xl text-brand-verde">Qué se publica</h2>
        <p>
          Nada se publica automáticamente. Cada borrador lo revisa una persona del equipo, y
          solo las notas que el equipo decide publicar aparecen en este sitio.
        </p>
      </div>
    </section>
  );
}
