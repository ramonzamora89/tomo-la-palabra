/**
 * Spreads a note's gallery photos through the body: one after every
 * PARRAFOS_POR_FOTO plain paragraphs, the rest (or all of them, in a short
 * note) at the end where the pipeline left `<Galeria />`.
 *
 * Done at render time on the MDX source, so the rule applies to every note
 * already published without re-running the pipeline.
 *
 * A photo is never dropped between a paragraph and the quote or list that
 * follows it ("…dijo lo siguiente:" + blockquote): once the count is
 * reached, it waits for the next block that starts a new thought — a
 * paragraph or a heading — and goes right before it.
 */
const PARRAFOS_POR_FOTO = 3;
const GALERIA_TAG = "<Galeria />";

// Headings, quotes, lists, tables, JSX and images aren't "paragraphs".
const NO_ES_PARRAFO = /^\s*(#|>|[-*+]\s|\d+[.)]\s|\||<|!\[|```)/;
const ES_TITULO = /^\s*#/;

export function intercalarFotos(
  content: string,
  totalFotos: number,
): { content: string; usadas: number } {
  const corte = content.indexOf(GALERIA_TAG);
  if (corte === -1 || totalFotos === 0) return { content, usadas: 0 };

  const cuerpo = content.slice(0, corte);
  const resto = content.slice(corte);
  const bloques = cuerpo.split(/\n[ \t]*\n/);

  const salida: string[] = [];
  let parrafos = 0;
  let usadas = 0;

  for (const bloque of bloques) {
    const vacio = bloque.trim() === "";
    const esParrafo = !vacio && !NO_ES_PARRAFO.test(bloque);
    const empiezaIdea = esParrafo || ES_TITULO.test(bloque);

    if (parrafos >= PARRAFOS_POR_FOTO && empiezaIdea && usadas < totalFotos) {
      // String attribute: next-mdx-remote v6 blocks JS expressions like n={0}.
      salida.push(`<Foto n="${usadas}" />`);
      usadas += 1;
      parrafos = 0;
    }
    if (esParrafo) parrafos += 1;
    salida.push(bloque);
  }

  return { content: salida.join("\n\n") + resto, usadas };
}
