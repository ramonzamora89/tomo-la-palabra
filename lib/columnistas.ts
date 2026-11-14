import { columnistas, type Columnista } from "@/content/columnistas";

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** The columnist who signs a note, matched by `author`. */
export function getColumnista(author: string): Columnista | undefined {
  const key = normalize(author);
  return columnistas.find(
    (c) => normalize(c.firma) === key || (c.alias ?? []).some((a) => normalize(a) === key),
  );
}
