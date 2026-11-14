/**
 * Voces columnists. A column's `Autor` in the Doc is enough: the site finds
 * the columnist here (lib/columnistas.ts) and takes the portrait, the
 * column's name, the bio and the default cover from this entry, so they
 * don't have to be repeated in every column.
 *
 * Two images per columnist, both from the approved illustration:
 * - `retrato`: square, cropped to the face. Circular avatar in the byline.
 * - `portada`: 16:9. Cover for the homepage, cards and social previews when
 *   the Doc has no photo of its own (a photo in the Doc always wins).
 *
 * Only public data goes here: the repo is public. Email, phone and place of
 * residence from the application form stay out.
 */
export type Columnista = {
  firma: string; // exactly as it's signed; matched without accents or case
  alias?: string[]; // other ways the Doc may sign (without the initial, etc.)
  columna?: string; // the column's permanent name
  bio?: string; // fallback when the Doc has no "Sobre el autor"
  retrato: string;
  portada: string;
};

export const columnistas: Columnista[] = [
  {
    firma: "Paola Escobar",
    columna: "Territorio y Memoria",
    bio: "Soy abogada y maestra en Derechos Humanos y Derecho Constitucional, con especialización en Criminología Forense. Cuento con trayectoria en la investigación de delitos contra la vida y redes de corrupción e impunidad en Guatemala, complementada con herramientas de analítica de datos e inteligencia artificial. Como consultora independiente y estratega legal, analizo el poder, el deterioro institucional y los derechos humanos en Centroamérica. En este espacio me gusta escribir desde lo emocional y la empatía, conectando el análisis político y social con las vivencias humanas que atraviesan a nuestra región.",
    retrato: "/images/columnistas/paola-escobar/retrato.jpg",
    portada: "/images/columnistas/paola-escobar/portada.jpg",
  },
  {
    // Mafer and Paola Jiménez are sisters who take turns with the column:
    // each signs alone every other Thursday, so each has her own entry.
    firma: "Mafer Jiménez C.",
    alias: ["Mafer Jiménez"],
    columna: "Potencia Social",
    bio: "Educadora de corazón, escritora por vocación, y activista por convicción. Entrelaza su trayectoria literaria y la perspectiva que le ha dado vivir con discapacidad motora, con el compromiso de reivindicar los derechos de las personas con discapacidad. Cree en la potencia de las palabras para abrir conversaciones, cuestionar prejuicios y resignificar la inclusión como una oportunidad para aprender, convivir y crecer. Su mirada crítica y profundamente humana, cuestiona el capacitismo y alza la voz para visibilizar las barreras. Educa para generar conciencia social, escribe para desafiar silencios, hace activismo para convertir las palabras en acciones capaces de derribar barreras y defiende la inclusión como un derecho.",
    retrato: "/images/columnistas/mafer-jimenez/retrato.jpg",
    portada: "/images/columnistas/mafer-jimenez/portada.jpg",
  },
  {
    firma: "Paola Jiménez C.",
    alias: ["Paola Jiménez"],
    columna: "Potencia Social",
    bio: "Encuentra en las formas un lenguaje, en el diseño su medio y en la comunicación visual una manera de transformar miradas. Su voz fusiona creatividad y sensibilidad, para que las personas con discapacidad no queden fuera del encuadre, al margen de la composición ni detrás de barreras invisibles como las que enfrenta al vivir con movilidad reducida. Explora la potencia de la creatividad para cuestionar paradigmas y redibujar realidades. Su pasión por crear se entrelaza con la profunda convicción de que el diseño puede derribar barreras, desafiar prejuicios y contribuir a construir una sociedad inclusiva, donde todas las personas encuentren un lugar al que pertenecer y la libertad para ser.",
    retrato: "/images/columnistas/paola-jimenez/retrato.jpg",
    portada: "/images/columnistas/paola-jimenez/portada.jpg",
  },
];
