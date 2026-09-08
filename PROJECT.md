# PROJECT.md — Tomo la Palabra

## Qué es

Tomo la Palabra es un medio guatemalteco nuevo, hasta ahora solo en redes sociales, enfocado en entrevistas en video largas que le dan voz a la gente común. Este proyecto es su sitio web: se alimenta directamente de un flujo editorial en Google Drive (ver `CLAUDE.md` para el detalle técnico), sin que el equipo editorial necesite tocar código.

- **Sitio**: https://tomo-la-palabra.vercel.app
- **Repo**: https://github.com/ramonzamora89/tomo-la-palabra
- **Carpeta raíz de Drive**: `11ej-EutGTMwqnKXVi99jBdbtdgewRfOM` (cuenta personal de Moncho, compartida como Editor con la service account `ramon@labetnografico.com`)
- **Presentación del flujo** (para el equipo de TLP): `presentacion-flujo/propuesta.pdf` y `.pptx` en este mismo directorio (no está en git).
- **Manual de publicación** (SOP para el equipo editorial): `manual-editorial/manual-publicacion-tomo-la-palabra.pdf`, 10 páginas con el branding del medio (no está en git — ver `CLAUDE.md` para regenerarlo).
- **Canal de YouTube**: `UC3bxUswJgceF-gA7GEXAV2w` — 1,409 suscriptores, 46 videos, 15.1 K horas de reproducción (al 7 de septiembre de 2026).

## Estado (31 de julio, 2026)

Los 10 milestones del plan original están completos y verificados de punta a punta con contenido real (3 entrevistas reales procesadas, una nota publicada en vivo, automatización corriendo sola en GitHub Actions). Después de eso se hicieron dos rondas de ajustes ya en producción:

1. **Menú móvil**: el nav de categorías se desbordaba en pantallas angostas — se reemplazó por un menú hamburguesa (`components/MobileNav.tsx`), y el header se volvió `sticky` con z-index corregido (antes el Hero de la portada tapaba el menú desplegable).
2. **Accesibilidad (WCAG 2.1 AA)**: pasada completa — skip-link, foco visible en todo fondo, jerarquía de encabezados corregida, contraste de texto insuficiente corregido (ink-500 fallaba en texto pequeño), títulos de página únicos por categoría/tag, sin links duplicados en las tarjetas. Ver el commit `Accessibility pass against WCAG 2.1 AA` para el detalle completo. Esto sigue siendo un requisito permanente, no un checkbox que ya se marcó — cualquier componente nuevo debe mantener el estándar.

## Estado (7 de septiembre, 2026)

Sesión dedicada a conectar Google con el sitio y a documentar el flujo para el equipo:

1. **`/videos` en vivo.** La pasarela del canal quedó conectada y muestra los 46 videos. En el camino aparecieron tres fallas encadenadas, ninguna visible desde afuera: `app/videos/page.tsx` nunca había llegado al repo (lo capturaba una regla de `.gitignore`), el deploy manual estaba bloqueado por el chequeo anti-tormenta de agosto, y las variables de entorno estaban creadas como `Secret` en Vercel, que `vercel pull` no puede bajar. Las tres están documentadas en `CLAUDE.md`.
2. **Manual de publicación** para el equipo editorial, en PDF con el branding del medio.
3. **Monetización de YouTube**: el canal **ya califica para el Programa de Socios completo**, con anuncios — 1,409 suscriptores (se piden 1,000) y 15.1 K horas de reproducción en los últimos 12 meses (se piden 4,000). Prácticamente todo ese tiempo viene de los videos largos, que es lo que cuenta; los Shorts no suman al criterio. Incluso supera el umbral de 8,000 horas que entra en vigor el 1 de febrero de 2027 para nuevos solicitantes.
4. **AdSense en trámite**, a registrarse en **Guatemala** (donde opera el medio y está el equipo). Pendiente: la verificación telefónica se topó con el límite de reintentos de Google.

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
3. **Fotografías**: hoy el sistema toma la primera imagen insertada en el Doc como portada única. Las demás imágenes del Doc se descargan pero **no se publican ni se commitean** (`watchPublicar.ts` solo incluye la portada en `filesToCommit`) — o sea que hoy se pierden en silencio. ¿Alcanza con la portada, o necesitan fotos dentro del cuerpo? Si la respuesta es que sí, hay trabajo real: commitear las demás y referenciarlas desde el MDX.
4. **Taxonomía final**: la lista de secciones (`content/taxonomy/categorias.ts`) es provisional (Reportaje, Comunidad, Opinión) — falta la decisión editorial definitiva de secciones y convenciones de tags.
5. **Notas tradicionales sin entrevista + monitoreo de fuentes estatales para investigaciones**: explícitamente fuera del alcance de este flujo por ahora. Se revisará aparte cuando el equipo tenga claridad de proceso.

## Pendientes técnicos conocidos

- **Fuentes de marca reales**: Chantal y Dreamwalker no existen como archivos con licencia — el sitio usa sustitutos de Google Fonts (ver nota en `app/layout.tsx`). Conseguir las fuentes reales de Voice Agency (la agencia que hizo el brandbook).
- **Migrar el flujo de Drive a la cuenta institucional (YoTomoLaPalabra)**: hoy las carpetas del pipeline viven en el Drive personal de Moncho y las credenciales de Google son de esa cuenta. Al migrar hay que: mover las cuatro carpetas + el Sheet del Registro, re-compartirlas con la service account, **generar credenciales nuevas y revocar las actuales** (JSON de la service account y `GOOGLE_OAUTH_REFRESH_TOKEN`, este último con `npm run pipeline:google-oauth-setup` logueado en la cuenta nueva), y actualizar los IDs y secretos en `.env.local` y GitHub Secrets. Ojo: la cuenta institucional también es Gmail personal, así que la limitación de cuota de storage de las service accounts (ver `CLAUDE.md`) **sigue aplicando** — la migración no la resuelve.
- **Paginación de `/videos`**: hoy muestra hasta 50 videos, que es el tope de una página de la API de YouTube. Cuando el canal pase de 50 habrá que paginar con `pageToken` (`lib/youtube.ts`).
- **Monetización de YouTube**: falta solo el trámite — verificación en 2 pasos en la cuenta del canal, acceso a funciones avanzadas, cuenta de AdSense vinculada, y postular en Studio → Ganar dinero. La revisión de Google tarda ~1 mes. Nota editorial: por los temas que cubre el medio (corrupción, agua, derechos LGBTIQ, política), es probable que varios videos queden con "anuncios limitados" por las políticas de idoneidad para anunciantes — las membresías del canal y Súper Gracias probablemente rindan más que los anuncios.
- **AdSense**: registrar en Guatemala. El país de una cuenta de AdSense **no se puede cambiar nunca** (habría que cerrarla y abrir otra), y conviene que quede a nombre de la organización y no de una persona, porque la misma cuenta va a recibir después los ingresos del sitio. La verificación de dirección se hace con un PIN por correo postal al llegar a $10 — usar una dirección donde llegue correspondencia de verdad.
- **Vercel Pro**: el sitio corre en el plan Hobby (gratis). Los términos de Vercel restringen Hobby a uso no comercial — como el sitio va a llevar AdSense, hay que pasar a Pro (~$20/mes) antes de anunciarlo públicamente.
- **Ledger de correcciones**: cuando se re-publica una nota editada (mover el Doc de Archivo de vuelta a Publicar), el Registro de Publicaciones agrega una fila nueva en vez de marcar la original como "editada". Funciona, pero podría afinarse.
- **Auditoría de accesibilidad**: la pasada de código ya está hecha; falta una prueba real con un lector de pantalla (VoiceOver/NVDA) antes de considerarlo cerrado del todo.
- **Resuelto (2026-09-07)**: la sección `/videos` ya está conectada al canal (`UC3bxUswJgceF-gA7GEXAV2w`). `YOUTUBE_API_KEY` y `YOUTUBE_CHANNEL_ID` viven en Vercel (Production) y en `.env.local`; no van en GitHub Secrets porque `deploy.yml` las obtiene vía `vercel pull`. La lista se refresca sola cada 30 min (ISR), sin deploy.
- **Incidente resuelto (2026-08-09)**: `Deploy` fallaba en cada corrida (`Too many requests... api-upload-free`) porque redesplegaba el mismo commit ~70-95 veces al día — el cron de `Publish` (cada 15 min) disparaba `Deploy` vía `workflow_run` aunque no hubiera nada nuevo publicado. Se agregó un chequeo en `deploy.yml` que compara el commit actual contra el último deploy de producción en Vercel y omite el build/deploy si son iguales (detalle técnico en `CLAUDE.md`). La cuota gratuita debería recuperarse ~24h después del incidente; no hace falta pasar a Vercel Pro por esto.

## Convenciones de trabajo con Moncho (para la próxima sesión)

- Cuando algo requiere un secreto (API key, token), nunca pedírselo directo en el chat — darle el comando exacto para que él lo corra y lo guarde en `.env.local` / GitHub Secrets. Ha habido varios traspiés de copiado (keys truncadas, `$` de más, `.env.local` sin salto de línea final pegando variables entre sí) — verificar siempre longitud/formato antes de asumir que quedó bien, sin leer el valor real.
- Moncho prefiere que se implemente directamente en vez de solo discutir opciones, cuando el pedido ya es concreto (ej. "el menú debería ser hamburguesa").
- **Nunca cargar `.env.local` con `source`/`.` en la shell.** El archivo tiene el JSON de la service account con saltos de línea reales; zsh intenta ejecutar su contenido y vuelca los secretos en los mensajes de error. Para usar una variable en un comando, extraer solo esa línea (`grep -m1 '^NOMBRE=' .env.local | sed 's/^NOMBRE=//'`) y no imprimirla nunca.
- Este repo es público — cualquier cosa que se documente en `CLAUDE.md`/`PROJECT.md` o se comitee queda visible. Mantener información sensible (de terceros, del equipo de TLP) fuera o genérica.
