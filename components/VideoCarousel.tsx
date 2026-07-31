import Image from "next/image";
import type { YoutubeVideo } from "@/lib/youtube";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-GT", { day: "numeric", month: "short", year: "numeric" });
}

export function VideoCarousel({ videos }: { videos: YoutubeVideo[] }) {
  if (videos.length === 0) return null;

  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4">
      {videos.map((video) => (
        <a
          key={video.videoId}
          href={`https://www.youtube.com/watch?v=${video.videoId}`}
          target="_blank"
          rel="noreferrer"
          className="group w-72 flex-none snap-start"
        >
          <div className="relative aspect-video overflow-hidden bg-ink-200">
            <Image
              src={video.thumbnailUrl}
              alt=""
              fill
              className="object-cover grayscale transition group-hover:grayscale-0"
              sizes="288px"
            />
          </div>
          <h3 className="mt-2 line-clamp-2 font-display text-base leading-tight text-brand-verde">
            {video.title}
          </h3>
          <p className="text-xs uppercase tracking-wide text-ink-600">
            {formatDate(video.publishedAt)}
          </p>
        </a>
      ))}
    </div>
  );
}
