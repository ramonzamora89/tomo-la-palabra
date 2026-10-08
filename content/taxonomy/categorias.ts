/**
 * Controlled section ("Sección") list, as defined by the Tomo la Palabra
 * team (October 2026). `descripcion` is the team's own wording — shown on
 * each section page and passed to the drafting model so it can pick a
 * section. Each section gets one accent color from the brand palette, used
 * on category badges and card accents.
 *
 * `desdeEntrevista: false` keeps a section out of the drafting model's
 * choices: Opinión pieces are written by a columnist from the Opinión
 * template, never drafted from an interview transcript.
 */
export type Categoria = {
  slug: string;
  nombre: string;
  descripcion: string;
  accent: "verde" | "amarillo";
  desdeEntrevista: boolean;
};

export const categorias: Categoria[] = [
  {
    slug: "voces",
    nombre: "Voces",
    descripcion:
      "Personas expertas, líderes de opinión y representantes de sectores de la sociedad toman la palabra para expresar su perspectiva sobre los hechos que acentúan su interés.",
    accent: "verde",
    desdeEntrevista: true,
  },
  {
    slug: "reflector",
    nombre: "Reflector",
    descripcion:
      "La cultura y el entretenimiento encuentran los reflectores encendidos para descubrir actividades, sitios o personajes que merecen la atención del público. El arte y los espectáculos se combinan con las ciencias sociales para explicar fenómenos humanos y ofrecer un catálogo de entretenimiento.",
    accent: "amarillo",
    desdeEntrevista: true,
  },
  {
    slug: "coyuntura",
    nombre: "Coyuntura",
    descripcion:
      "Los hechos de la jornada que marcan la agenda política desde el poder público y privado. Notas periodísticas que explican y cuentan lo que hay que saber sobre la realidad nacional.",
    accent: "verde",
    desdeEntrevista: true,
  },
  {
    slug: "profundidad",
    nombre: "Profundidad",
    descripcion:
      "Los hechos cotidianos merecen una mirada hacia el fondo para comprenderlos de manera integral. Este es el espacio para los reportajes y los análisis que permiten comprender las capas de los asuntos públicos.",
    accent: "amarillo",
    desdeEntrevista: true,
  },
  {
    slug: "la-conversa",
    nombre: "La Conversa",
    descripcion:
      "Un encuentro para conocer las perspectivas de las personas que protagonizan la agenda pública de Guatemala: un videopodcast que muestra distintas voces para explicar el país y su contexto.",
    accent: "verde",
    desdeEntrevista: true,
  },
  {
    slug: "comunidad",
    nombre: "Comunidad",
    descripcion:
      "Hechos que parecen locales, pero que trascienden fronteras por su repercusión en el ambiente, los recursos naturales y los derechos humanos.",
    accent: "amarillo",
    desdeEntrevista: true,
  },
  {
    slug: "la-calle",
    nombre: "La Calle",
    descripcion:
      "La participación ciudadana implica ejercer el derecho a la expresión sin censura y con la apertura democrática para ofrecer una plataforma plural que refleje los reclamos cotidianos de la gente. Además, queremos conocer las opiniones sobre los temas que abordamos para complementar nuestra cobertura con las perspectivas desde la voz del pueblo.",
    accent: "verde",
    desdeEntrevista: true,
  },
  {
    slug: "opinion",
    nombre: "Opinión",
    descripcion:
      "Columnas firmadas por sus autoras y autores. Las opiniones expresadas son responsabilidad de quien las escribe y no representan necesariamente la línea editorial de Tomo la Palabra.",
    accent: "amarillo",
    desdeEntrevista: false,
  },
];

export function getCategoria(slug: string): Categoria | undefined {
  return categorias.find((c) => c.slug === slug);
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

/**
 * Maps whatever an editor typed under "Sección" ("La Calle", "la calle",
 * "Opinión", "la-conversa"…) to a section slug. Undefined when it matches
 * none — the caller decides what to do with an unknown section.
 */
export function resolveCategoria(text: string): Categoria | undefined {
  const key = normalize(text);
  return categorias.find((c) => c.slug === key || normalize(c.nombre) === key);
}
