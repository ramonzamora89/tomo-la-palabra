const DIACRITICS_REGEX = new RegExp("[̀-ͯ]", "g");

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

export function extractYoutubeVideoId(url: string): string | undefined {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1];
}

/**
 * Today's date (YYYY-MM-DD) in Guatemala. The runners are on UTC, which
 * stamped anything published after 6 p.m. local time with tomorrow's date.
 */
export function todayInGuatemala(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Guatemala" });
}
