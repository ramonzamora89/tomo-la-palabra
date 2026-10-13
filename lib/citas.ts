/**
 * Quotes in a note's body (`> …` in the Doc) closed the Spanish way: the
 * period goes after the closing quote mark ("Hola”.), not before it.
 *
 * The quote marks used to come from the typography plugin's CSS
 * (open-quote/close-quote around the whole paragraph), which can't move the
 * period, so they are written into the text here instead and the CSS ones
 * are turned off in tailwind.config.ts. Done at render time, like
 * intercalarFotos, so it applies to every note already published.
 *
 * - A quote the editor typed without quote marks gets “ ”.
 * - A quote that already has them keeps them (straight outer ones become
 *   curly, to match), and only the final period is moved outside.
 * - A quote that ends in ?, ! or an ellipsis keeps it inside the marks.
 * - An attribution at the end stays outside: “…”, dice la vecina.
 * - A quote with any quote mark somewhere else in it (`…", cuenta un
 *   vecino.`) is the editor's own markup: only the period is touched.
 */
const APERTURA = /^["“«]/;
const PUNTO_ANTES_DEL_CIERRE = /([^.])\.(["”»])(\s*)$/;
const TERMINA_EN_PUNTO = /([^.])\.(\s*)$/;
const PREFIJO = /^(\s*>\s?)(.*)$/;
const COMILLA = /["“”«»]/;
const VERBOS =
  "dice|dijo|afirma|afirmó|explica|explicó|cuenta|contó|señala|señaló|agrega|agregó|" +
  "añade|añadió|comenta|comentó|asegura|aseguró|relata|relató|indica|indicó|expresa|" +
  "expresó|menciona|mencionó|sostiene|sostuvo|apunta|apuntó|advierte|advirtió|" +
  "denuncia|denunció|concluye|concluyó|opina|opinó|recuerda|recordó|insiste|insistió|" +
  "reconoce|reconoció|lamenta|lamentó|detalla|detalló|subraya|subrayó";
// Short, and not "…, cuenta con agua" / "…, dice que…", which are still the quote.
const ATRIBUCION = new RegExp(
  `,(\\s+(?:${VERBOS})\\s(?!(?:que|con)\\b)[^.?!,]{1,60}\\.?\\s*)$`,
  "i",
);

export function citasEnEspanol(content: string): string {
  // Leave the transcript alone: it's verbatim, not edited prose.
  const corte = content.indexOf("<TranscriptToggle>");
  const cuerpo = corte === -1 ? content : content.slice(0, corte);
  const resto = corte === -1 ? "" : content.slice(corte);

  const bloques = cuerpo.split(/(\n[ \t]*\n)/);
  return (
    bloques
      .map((bloque) => {
        const lineas = bloque.split("\n");
        const esCita = lineas.every((l) => PREFIJO.test(l)) && bloque.trim() !== "";
        return esCita ? arreglarCita(lineas) : bloque;
      })
      .join("") + resto
  );
}

function arreglarCita(lineas: string[]): string {
  const partes = lineas.map((l) => PREFIJO.exec(l)!.slice(1, 3) as [string, string]);
  const conTexto = partes.filter(([, t]) => t.trim() !== "");
  if (conTexto.length === 0) return lineas.join("\n");
  const primera = conTexto[0];
  const ultima = conTexto[conTexto.length - 1];

  const texto = conTexto.map(([, t]) => t).join(" ");

  if (APERTURA.test(primera[1].trimStart()) || COMILLA.test(texto)) {
    ultima[1] = ultima[1].replace(PUNTO_ANTES_DEL_CIERRE, "$1$2.$3");
    // Curly only as a pair: `"…", dijo un estudiante.` keeps its straight ones.
    if (/^\s*"/.test(primera[1]) && /"\.?\s*$/.test(ultima[1])) {
      primera[1] = primera[1].replace(/^(\s*)"/, "$1“");
      ultima[1] = ultima[1].replace(/"(\.?\s*)$/, "”$1");
    }
  } else {
    primera[1] = "“" + primera[1];
    ultima[1] = ATRIBUCION.test(ultima[1])
      ? ultima[1].replace(ATRIBUCION, "”,$1")
      : TERMINA_EN_PUNTO.test(ultima[1])
      ? ultima[1].replace(TERMINA_EN_PUNTO, "$1”.$2")
      : ultima[1].replace(/(\s*)$/, "”$1");
  }
  return partes.map(([p, t]) => p + t).join("\n");
}
