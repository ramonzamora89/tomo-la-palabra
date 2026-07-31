# PROJECT.md — Tomo la Palabra

## Qué es

Tomo la Palabra es un medio guatemalteco nuevo, hasta ahora solo en redes sociales, enfocado en entrevistas en video largas que le dan voz a la gente común. Este proyecto es su sitio web: se alimenta directamente de un flujo editorial en Google Drive (ver `CLAUDE.md` para el detalle técnico), sin que el equipo editorial necesite tocar código.

- **Sitio**: https://tomo-la-palabra.vercel.app
- **Repo**: https://github.com/ramonzamora89/tomo-la-palabra
- **Carpeta raíz de Drive**: `11ej-EutGTMwqnKXVi99jBdbtdgewRfOM` (cuenta personal de Moncho, compartida como Editor con la service account `ramon@labetnografico.com`)
- **Presentación del flujo** (para el equipo de TLP): `presentacion-flujo/propuesta.pdf` y `.pptx` en este mismo directorio (no está en git).

## Estado (31 de julio, 2026)

Los 10 milestones del plan original están completos y verificados de punta a punta con contenido real (3 entrevistas reales procesadas, una nota publicada en vivo, automatización corriendo sola en GitHub Actions). Después de eso se hicieron dos rondas de ajustes ya en producción:

1. **Menú móvil**: el nav de categorías se desbordaba en pantallas angostas — se reemplazó por un menú hamburguesa (`components/MobileNav.tsx`), y el header se volvió `sticky` con z-index corregido (antes el Hero de la portada tapaba el menú desplegable).
2. **Accesibilidad (WCAG 2.1 AA)**: pasada completa — skip-link, foco visible en todo fondo, jerarquía de encabezados corregida, contraste de texto insuficiente corregido (ink-500 fallaba en texto pequeño), títulos de página únicos por categoría/tag, sin links duplicados en las tarjetas. Ver el commit `Accessibility pass against WCAG 2.1 AA` para el detalle completo. Esto sigue siendo un requisito permanente, no un checkbox que ya se marcó — cualquier componente nuevo debe mantener el estándar.

## Decisiones ya tomadas

- Video embebido de YouTube (no autohospedado).
- Contenido versionado como `.mdx` en el propio repo (git-as-CMS), no headless CMS externo.
- Solo AdSense en v1, con `<AdSlot>` diseñado para poder enchufar anuncios locales después sin rediseño.
- Despliegue orquestado desde GitHub Actions (no el auto-deploy nativo de Vercel), pensando en una posible migración a AWS más adelante.
- Reutilizar las keys de Deepgram y Anthropic que Moncho ya tenía en otros proyectos personales (no son credenciales de cliente).

## Preguntas abiertas para el equipo de TLP

(Estas están también en la presentación — llevarlas a esa conversación, no resolverlas unilateralmente):

1. **Nota destacada**: hoy la portada muestra automáticamente la última nota publicada como principal, no necesariamente la que el equipo editorial elegiría. El esquema de contenido ya reserva un campo `featured?: boolean` (`lib/schema.ts`) para resolver esto — falta decidir cómo se marca desde el Doc (¿un campo "Destacada"?) y conectarlo.
2. **Volumen esperado**: ¿cuántas entrevistas por semana/mes? Define el costo variable real (~$0.55/entrevista en Deepgram+Claude) y si conviene ajustar la frecuencia de los cron jobs.
3. **Fotografías**: hoy el sistema toma la primera imagen insertada en el Doc como portada única. ¿Alcanza, o necesitan más de una foto dentro del cuerpo de la nota?
4. **Taxonomía final**: la lista de secciones (`content/taxonomy/categorias.ts`) es provisional (Reportaje, Comunidad, Opinión) — falta la decisión editorial definitiva de secciones y convenciones de tags.
5. **Notas tradicionales sin entrevista + monitoreo de fuentes estatales para investigaciones**: explícitamente fuera del alcance de este flujo por ahora. Se revisará aparte cuando el equipo tenga claridad de proceso.

## Pendientes técnicos conocidos

- **Fuentes de marca reales**: Chantal y Dreamwalker no existen como archivos con licencia — el sitio usa sustitutos de Google Fonts (ver nota en `app/layout.tsx`). Conseguir las fuentes reales de Voice Agency (la agencia que hizo el brandbook).
- **YouTube Data API**: la sección `/videos` (pasarela del canal) está construida pero inactiva — falta `YOUTUBE_API_KEY` y `YOUTUBE_CHANNEL_ID`.
- **Vercel Pro**: el sitio corre en el plan Hobby (gratis). Los términos de Vercel restringen Hobby a uso no comercial — como el sitio va a llevar AdSense, hay que pasar a Pro (~$20/mes) antes de anunciarlo públicamente.
- **Ledger de correcciones**: cuando se re-publica una nota editada (mover el Doc de Archivo de vuelta a Publicar), el Registro de Publicaciones agrega una fila nueva en vez de marcar la original como "editada". Funciona, pero podría afinarse.
- **Auditoría de accesibilidad**: la pasada de código ya está hecha; falta una prueba real con un lector de pantalla (VoiceOver/NVDA) antes de considerarlo cerrado del todo.

## Convenciones de trabajo con Moncho (para la próxima sesión)

- Cuando algo requiere un secreto (API key, token), nunca pedírselo directo en el chat — darle el comando exacto para que él lo corra y lo guarde en `.env.local` / GitHub Secrets. Ha habido varios traspiés de copiado (keys truncadas, `$` de más, `.env.local` sin salto de línea final pegando variables entre sí) — verificar siempre longitud/formato antes de asumir que quedó bien, sin leer el valor real.
- Moncho prefiere que se implemente directamente en vez de solo discutir opciones, cuando el pedido ya es concreto (ej. "el menú debería ser hamburguesa").
- Este repo es público — cualquier cosa que se documente en `CLAUDE.md`/`PROJECT.md` o se comitee queda visible. Mantener información sensible (de terceros, del equipo de TLP) fuera o genérica.
