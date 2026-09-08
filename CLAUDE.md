# CLAUDE.md — Tomo la Palabra

Instrucciones técnicas para trabajar en este repo. Para contexto de negocio, estado del proyecto y preguntas pendientes, ver `PROJECT.md`.

## Qué es esto

Sitio web (Next.js) + pipeline de contenido para Tomo la Palabra, un medio guatemalteco de entrevistas en video. El contenido nace en Google Drive (video → transcripción → borrador → revisión humana → publicación) y termina como archivos `.mdx` versionados en este mismo repo. No hay CMS ni base de datos externa — el repo es la fuente de verdad del contenido publicado.

- **Sitio en vivo**: https://tomo-la-palabra.vercel.app
- **Repo**: https://github.com/ramonzamora89/tomo-la-palabra (público)

## Stack

Next.js 15 (App Router) + TypeScript + Tailwind. Contenido en `content/notas/*.mdx` con frontmatter validado por Zod (`lib/schema.ts`). Pipeline en Node/TypeScript bajo `pipeline/src/`, corrido por GitHub Actions.

## Comandos

```bash
npm run dev / build / start          # sitio
npx tsc --noEmit -p tsconfig.json    # type-check

# Pipeline, todos toman env de .env.local
npm run pipeline:transcribe-local -- "ruta/al/video.mp4"        # solo transcribe (M6), sin Drive
npm run pipeline:draft-local -- "ruta/al/archivo.transcripcion.txt"  # solo redacta (M7), sin Drive
npm run pipeline:watch-entrevistas   # flujo real: Entrevistas → Borradores (Drive)
npm run pipeline:watch-publicar      # flujo real: Publicar → nota en el repo → Archivo
npm run pipeline:google-oauth-setup  # una sola vez: genera GOOGLE_OAUTH_REFRESH_TOKEN
```

`PUBLISH_BRANCH=nombre-rama npm run pipeline:watch-publicar` empuja a una rama de prueba en vez de a `main` — útil para probar sin tocar el sitio en vivo.

## Arquitectura del pipeline

Carpetas de Drive (dentro de la raíz del proyecto, compartida con la service account como Editor):

| Carpeta | ID | Función |
|---|---|---|
| Entrevistas | `1Na_SaEwsRbo2Iwf1VCAorr1-yjRnJC-v` | Video crudo sube aquí |
| Borradores | `1x7GpoFQw0_5oOm0EAOKllahS9h5bNze_` | Doc generado, en revisión |
| Publicar | `1FsVdoiBLz2qwim22s_Cg7eLsK691QiYc` | Mover un Doc aquí = disparador de publicación |
| Archivo | `1XBGv8OdyeOK4YGWUNuhKXCis__5HcJ9v` | Doc publicado, respaldo permanente |
| Registro de Publicaciones (Sheet) | `1MHjdYeT6dxqQwMfUrBRRLaW4jVO1TxJr9hJwq7aAmJU` | Ledger: fecha/título/autor/links/estado |

Flujo: `watchEntrevistas.ts` (cron cada 30 min) → Deepgram (nova-3, es-419, diarize) → Claude Opus 5 (salida estructurada) → crea el Doc en Borradores con encabezados `Titular / Sección / Entradilla / Cuerpo / Imágenes / Tags / YouTube URL / Transcripción completa`. Un humano revisa y arrastra el Doc a Publicar. `watchPublicar.ts` (cron cada 15 min) parsea el Doc por esos mismos encabezados exactos, baja imágenes inline, genera el `.mdx`, hace commit/push, mueve el Doc a Archivo y anota la fila en el Registro.

**Reprocesar/editar una nota ya publicada**: editar el Doc en Archivo y volver a arrastrarlo a Publicar — mismo slug, sobreescribe el `.mdx`. Ya probado, funciona.

## Autenticación con Google — el gotcha más importante

**Las service accounts NO tienen cuota de almacenamiento en Drive**, y en una cuenta Gmail personal (no Workspace) no existen Shared Drives ni domain-wide delegation para resolverlo. Por eso hay **dos** credenciales de Google en juego, no una:

- `GOOGLE_SERVICE_ACCOUNT_JSON` — hace todo lo que es leer/editar/mover archivos ya existentes.
- `GOOGLE_OAUTH_CLIENT_ID` / `_SECRET` / `_REFRESH_TOKEN` — se usa **solo** para `drive.files.create()` (crear el Doc nuevo en `watchEntrevistas.ts`), porque ese archivo necesita nacer con dueño real (cuota real). Una vez creado dentro de una carpeta ya compartida con la service account, esta puede editarlo sin problema.

Si `drive.files.create` o `docs.documents.create` empiezan a fallar con `storageQuotaExceeded` o `The caller does not have permission`, es este mismo problema — no es una regresión de permisos, es la limitación de Google. Ver `pipeline/src/lib/googleClients.ts` y `pipeline/src/oauthSetup.ts`.

## GitHub Actions

- `transcribe.yml` — cron `*/30 * * * *`, corre `watchEntrevistas`.
- `publish.yml` — cron `*/15 * * * *`, corre `watchPublicar`. Necesita `permissions: contents: write` y `git config user.name/email` (no vienen por defecto).
- `deploy.yml` — **no** se dispara solo con `on: push` cuando el push lo hace otro workflow con el `GITHUB_TOKEN` por defecto (regla anti-loop de GitHub). Por eso también escucha `workflow_run` sobre la conclusión de `Publish`, y hace checkout del `head_sha` exacto que Publish empujó. Si algún día una nota publicada no aparece en el sitio, revisar primero si `Deploy` corrió después de `Publish`.
  - Un deploy pedido a mano (`workflow_dispatch`, desde Actions → Deploy → Run workflow) **se
    salta ese chequeo a propósito**: es la única forma de recoger cambios que no viven en el
    commit, como variables de entorno nuevas en Vercel. Hace falta porque `vercel deploy
    --prebuilt` produce deployments que Vercel se niega a redesplegar desde su dashboard
    ("Prebuilt deployments cannot be redeployed"); sin esta salida no habría manera de forzar un
    deploy sin inventar un commit.
  - `Publish` corre cada 15 min y termina en éxito aunque no haya nada nuevo que publicar, así que `workflow_run` disparaba un `vercel deploy` real en cada tick (~70-95/día) aunque el commit no hubiera cambiado. Eso agotó la cuota gratuita de subida de Vercel (5000/día, error `api-upload-free`) el 2026-08-09. Fix: `deploy.yml` ahora consulta la API de Vercel (`GET /v6/deployments?target=production`) por el `githubCommitSha` del último deploy en producción y **omite build/deploy** si coincide con el commit actual. Si Vercel algún día deja de exponer `meta.githubCommitSha` en esa respuesta (o cambia el shape del JSON), el chequeo falla abierto (`skip=false`) y despliega igual — no se queda bloqueado, pero tampoco dedupea.

Todos los secrets (API keys + credenciales de Google + IDs de Drive, aunque estos últimos no son sensibles) están en GitHub Secrets del repo. Los valores reales solo existen ahí y en `.env.local` de Moncho — nunca en el código.

## El repo vive en un disco exFAT — dos trampas de git

El proyecto está en `/Volumes/Pikachu`, un volumen exFAT que no guarda permisos Unix ni
distingue mayúsculas. Eso cambia el comportamiento de git de dos formas que ya causaron
problemas reales:

- **`core.fileMode`**: sin desactivarlo, los 78 archivos del repo aparecen como modificados
  (`100644 => 100755`) sin que nadie los haya tocado. Ya está puesto `core.fileMode=false` en
  la config local. Si aparece un `git status` con todo el repo modificado, es esto.
- **`core.ignorecase=true`** (autodetectado): los patrones de `.gitignore` dejan de distinguir
  mayúsculas. La regla `VIDEOS/` —pensada para el material de video crudo de la raíz— también
  capturaba `app/videos/`, que quedó fuera del repo sin que nadie lo notara hasta que `/videos`
  dio 404 en producción mientras funcionaba perfecto en local. **Toda regla de `.gitignore` que
  apunte a una carpeta de la raíz debe ir anclada con `/` al inicio** (`/VIDEOS/`,
  `/presentacion-flujo/`, `/manual-editorial/`). Sin el ancla, un patrón coincide a cualquier
  profundidad.

Si algo funciona en local pero no en producción, `git ls-files <ruta>` y `git check-ignore -v
<ruta>` son el primer diagnóstico: el build de CI solo ve lo que está en el repo.

## Variables de entorno

Ver `.env.example` para la lista completa con comentarios. Nunca leer `.env.local` directo (contiene secretos reales) — para verificar que algo está seteado, usar `grep -c "NOMBRE=" .env.local` o revisar longitud (`awk -F= '{print length($2)}'`), no el valor.

## Sección /videos (YouTube Data API)

`lib/youtube.ts` lee la playlist de subidas del canal (`UC3bxUswJgceF-gA7GEXAV2w`) y muestra
los 50 más recientes; es la única parte del sitio que lee datos externos en vivo en vez de los
`.mdx` versionados. Revalida cada 30 min por ISR, así que un video nuevo aparece solo, sin
deploy. 50 es el tope de una página de la API — más allá habría que paginar con `pageToken`.

`YOUTUBE_API_KEY` y `YOUTUBE_CHANNEL_ID` viven **en Vercel (Production) y en `.env.local`**, no
en GitHub Secrets: `deploy.yml` las obtiene con `vercel pull`.

**Gotcha de Vercel — Secret vs Config**: al crear una variable, Vercel ofrece tipo `Secret`
(antes "Sensitive") o `Config`. Las `Secret` **no se pueden descargar con `vercel pull`**: el
CLI escribe el literal `[SENSITIVE]` como placeholder y el build sigue adelante con ese valor.
El síntoma no es un error sino una página que dice "no se encontraron videos", porque la
variable existe y no está vacía. Como el build corre en GitHub Actions y no en Vercel, **toda
variable que el build necesite tiene que ser `Config`**. El flag no se puede cambiar después:
hay que borrar la variable y recrearla.

## Sistema de diseño

Colores y tipografías del brandbook real (`TOMO LA PALABRA_BRANDBOOK 2025.pdf`, no en git — ver `.gitignore`). Paleta en `tailwind.config.ts` (`brand.verde/amarillo/crema/gris`). **Las fuentes Chantal y Dreamwalker del brandbook no existen como archivos con licencia** — hoy el sitio usa sustitutos de Google Fonts (Anton por Dreamwalker, Permanent Marker por Chantal, ambos marcados con un comentario `TODO` en `app/layout.tsx`) hasta conseguir las fuentes reales.

## Accesibilidad

El sitio debe cumplir **WCAG 2.1 nivel AA** — hay usuarios reales de lector de pantalla en el equipo editorial de Tomo la Palabra, así que esto no es opcional ni cosmético. Ya se hizo una pasada completa (skip-link, foco visible en todo fondo, jerarquía de encabezados, contraste de texto, títulos de página únicos, sin links duplicados). Cualquier componente o página nueva debe mantener ese estándar: alt text real (o `alt=""` si es puramente decorativo/redundante junto a un link con el mismo destino), jerarquía de encabezados sin saltos, contraste mínimo 4.5:1 en texto normal, y todo interactivo debe funcionar con teclado.

## Manual editorial (SOP)

`manual-editorial/` (gitignored) tiene el manual de publicación para el equipo de TLP: el
recorrido de video crudo a nota publicada, escrito para gente que no toca código. Fuente en
`index.html`, con la paleta y las fuentes del sitio. Regenerar el PDF:

```bash
cd manual-editorial && "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="manual-publicacion-tomo-la-palabra.pdf" \
  --virtual-time-budget=10000 "file://$(pwd)/index.html"
```

El HTML maqueta páginas carta con `@page { size: letter }` y un `div.page` por página; **no hay
reflujo automático**, así que si se agrega contenido hay que revisar el PDF página por página
para que no se desborde sobre el pie. Mismo patrón que `presentacion-flujo/`.

Si se cambia el pipeline (encabezados del Doc, taxonomía, manejo de imágenes, tiempos de cron),
**el manual queda desactualizado y hay que regenerarlo** — documenta comportamiento real, no
intenciones.

## Reutilizado de otros proyectos (referencia, no código compartido)

- Parámetros de Deepgram y lógica de fusión de utterances en turnos: `/Users/ramonzamora/Documents/BID_Cuali/limpieza-transcripciones-bam` (flujo manual, no automatizado — solo se copió el patrón).
- Patrón HTML→PDF/PPTX para presentaciones: `/Users/ramonzamora/Documents/Victoria/propuesta-victoria` (ver `presentacion-flujo/` en este proyecto, gitignored, no es parte del sitio).
