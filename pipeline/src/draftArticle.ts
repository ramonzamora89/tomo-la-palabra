import Anthropic from "@anthropic-ai/sdk";
import { config } from "./lib/config";
import { categorias } from "../../content/taxonomy/categorias";

const client = new Anthropic({ apiKey: config.anthropicApiKey });

const SYSTEM_PROMPT = `Eres redactor(a) editorial de Tomo la Palabra, un medio guatemalteco que da voz a la gente común a través de entrevistas en video largas. Tu tono es directo e irreverente, fiel a la voz de la marca ("Prohibido dejar de pensar", "Dilo sin tabús y sin pelos en la lengua", "Guate habla"), pero nunca sacrificas la precisión: no inventas hechos, cifras, nombres ni citas que no estén explícitamente en la transcripción que se te entrega. Si algo no queda claro en la transcripción, no lo afirmes.

Redactas un borrador para que un periodista humano lo revise y edite antes de publicarse — tu trabajo es dar un punto de partida sólido, no una versión final.`;

const draftSchema = {
  type: "object",
  properties: {
    titular: {
      type: "string",
      description: "Titular de la nota: directo, concreto, sin clickbait vacío.",
    },
    seccion: {
      type: "string",
      enum: categorias.map((c) => c.slug),
      description: "La sección del sitio a la que pertenece esta nota.",
    },
    entradilla: {
      type: "string",
      description: "Uno o dos párrafos de entradilla que resuman de qué trata la entrevista.",
    },
    cuerpo: {
      type: "string",
      description: "Cuerpo de la nota en Markdown, desarrollando el reportaje con base en la transcripción.",
    },
    imagenesNotas: {
      type: "string",
      description: "Notas para el equipo editorial sobre qué imágenes hacen falta o se sugieren para esta nota.",
    },
    tags: {
      type: "array",
      items: { type: "string" },
      description: "Etiquetas libres en minúsculas, sin espacios (usar guiones), relevantes al contenido.",
    },
  },
  required: ["titular", "seccion", "entradilla", "cuerpo", "imagenesNotas", "tags"],
  additionalProperties: false,
} as const;

export type DraftArticle = {
  titular: string;
  seccion: string;
  entradilla: string;
  cuerpo: string;
  imagenesNotas: string;
  tags: string[];
};

/**
 * Low-frequency editorial job (one call per new interview) — Claude Opus 5,
 * the current flagship, is the right trade here over a cheaper/faster model.
 * Thinking is on by default on Opus 5 (no `thinking` param needed); do not
 * set temperature/top_p/top_k — they're rejected (400) on this model.
 * Streaming avoids any risk of the request timing out while it thinks over
 * a long transcript.
 */
export async function draftArticle(transcript: string): Promise<DraftArticle> {
  const stream = client.messages.stream({
    model: "claude-opus-5",
    max_tokens: 16000,
    system: [
      // Stable across every call — cached (min. cacheable prefix on Opus 5 is 512 tokens).
      { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    ],
    output_config: {
      format: { type: "json_schema", schema: draftSchema },
    },
    messages: [
      {
        role: "user",
        content: `Redacta el borrador de nota a partir de esta transcripción de entrevista:\n\n${transcript}`,
      },
    ],
  });

  const message = await stream.finalMessage();

  if (message.stop_reason === "refusal") {
    throw new Error("Claude rechazó la solicitud de redacción (stop_reason: refusal)");
  }

  const textBlock = message.content.find(
    (block): block is Anthropic.TextBlock => block.type === "text",
  );
  if (!textBlock) {
    throw new Error("Claude no devolvió contenido de texto con el borrador");
  }

  return JSON.parse(textBlock.text) as DraftArticle;
}
