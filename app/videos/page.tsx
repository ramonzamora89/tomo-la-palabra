import type { Metadata } from "next";
import { getChannelUploads } from "@/lib/youtube";
import { VideoCarousel } from "@/components/VideoCarousel";
import { GrungeDivider } from "@/components/GrungeDivider";

export const metadata: Metadata = { title: "Videos" };
export const revalidate = 1800;

export default async function VideosPage() {
  const videos = await getChannelUploads();
  const configured = Boolean(process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_CHANNEL_ID);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl tracking-tight text-brand-verde">Videos</h1>
      <p className="mt-2 font-hand text-xl text-brand-amarillo -rotate-1">Guate habla, en video</p>
      <GrungeDivider className="my-4" />

      {!configured ? (
        <p className="max-w-xl text-ink-600">
          Pendiente de conectar con el canal de YouTube de Tomo la Palabra: falta configurar
          las variables de entorno <code className="text-sm">YOUTUBE_API_KEY</code> y{" "}
          <code className="text-sm">YOUTUBE_CHANNEL_ID</code>. En cuanto estén, esta sección
          muestra automáticamente todos los videos del canal, del más reciente al más antiguo.
        </p>
      ) : videos.length === 0 ? (
        <p className="text-ink-600">No se encontraron videos en el canal.</p>
      ) : (
        <>
          <h2 className="sr-only">Todos los videos</h2>
          <VideoCarousel videos={videos} />
        </>
      )}
    </section>
  );
}
