export type YoutubeVideo = {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
};

const API_BASE = "https://www.googleapis.com/youtube/v3";

/**
 * The only part of the site that reads live external data instead of
 * git-committed content (see plan). Revalidated periodically via Next.js
 * fetch caching rather than rebuilt on every push.
 */
export async function getChannelUploads(limit = 50): Promise<YoutubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;

  if (!apiKey || !channelId) return [];

  const channelRes = await fetch(
    `${API_BASE}/channels?part=contentDetails&id=${channelId}&key=${apiKey}`,
    { next: { revalidate: 1800 } },
  );
  if (!channelRes.ok) {
    // Silenciar el error dejaba la página mostrando "no se encontraron
    // videos" sin rastro de la causa: un `[SENSITIVE]` de Vercel, una API
    // key restringida o la cuota diaria agotada se ven todos igual.
    console.error(
      `[youtube] channels.list falló: ${channelRes.status} — ${await channelRes.text()}`,
    );
    return [];
  }
  const channelData = await channelRes.json();
  const uploadsPlaylistId =
    channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) {
    console.error(
      `[youtube] el canal ${channelId} no devolvió playlist de subidas`,
    );
    return [];
  }

  const itemsRes = await fetch(
    `${API_BASE}/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${limit}&key=${apiKey}`,
    { next: { revalidate: 1800 } },
  );
  if (!itemsRes.ok) {
    console.error(
      `[youtube] playlistItems.list falló: ${itemsRes.status} — ${await itemsRes.text()}`,
    );
    return [];
  }
  const itemsData = await itemsRes.json();

  return (itemsData.items ?? []).map((item: any) => ({
    videoId: item.snippet.resourceId.videoId,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnailUrl:
      item.snippet.thumbnails?.high?.url ?? item.snippet.thumbnails?.default?.url,
    publishedAt: item.snippet.publishedAt,
  }));
}
