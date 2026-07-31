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
