# CLAUDE.md — Tomo la Palabra

Instrucciones técnicas para trabajar en este repo. Contexto de negocio, estado y pendientes: `PROJECT.md`.

## Qué es esto

Sitio web (Next.js) + pipeline de contenido para Tomo la Palabra, un medio guatemalteco de entrevistas en video. El contenido nace en Google Drive (video o plantilla → borrador → revisión humana → publicación) y termina como archivos `.mdx` versionados en este mismo repo. No hay CMS ni base de datos externa: el repo es la fuente de verdad del contenido publicado, y Google Drive es la interfaz editorial.

- **Sitio en vivo**: https://tomolapalabra.com. `www` y `https://tomo-la-palabra.vercel.app` redirigen con 308 conservando la ruta, así que los links viejos del Registro siguen funcionando. Ver "Dominio".
- **Repo**: https://github.com/ramonzamora89/tomo-la-palabra (público)

## Stack

Next.js 15 (App Router) + TypeScript + Tailwind. Contenido en `content/notas/*.mdx`, renderizado con `next-mdx-remote` v6 y frontmatter validado por Zod (`lib/schema.ts`). Pipeline en Node/TypeScript bajo `pipeline/src/`, corrido por GitHub Actions. Imágenes procesadas con `sharp`.

## Comandos

```bash
npm run dev / build / start          # sitio (build local: ver "exFAT", se cuelga en este disco)
npx tsc --noEmit -p tsconfig.json    # type-check (incluye el pipeline)

# Pipeline, todos toman env de .env.local
npm run pipeline:transcribe-local -- "ruta/al/video.mp4"             # solo transcribe, sin Drive
npm run pipeline:draft-local -- "ruta/al/archivo.transcripcion.txt"  # solo redacta, sin Drive
npm run pipeline:watch-entrevistas   # flujo real: Entrevistas → Borradores (Drive)
npm run pipeline:watch-publicar      # flujo real: Publicar → nota en el repo → Archivo
npm run pipeline:google-oauth-setup  # una sola vez: genera GOOGLE_OAUTH_REFRESH_TOKEN
npm run pipeline:create-template -- <general|opinion> <folderId>  # crea una plantilla de Doc
```

`PUBLISH_BRANCH=nombre-rama npm run pipeline:watch-publicar` empuja a una rama de prueba en vez de a `main`, para probar sin tocar el sitio en vivo. Ojo: igual mueve el Doc a Archivo y escribe en el Registro.

## Mapa del código

| Dónde | Qué hace |
|---|---|
| `pipeline/src/watchEntrevistas.ts` | Video nuevo en Entrevistas → Deepgram → Claude → Doc en Borradores |
| `pipeline/src/draftArticle.ts` | Prompt y esquema de salida de Claude (elige sección entre las de `desdeEntrevista`) |
| `pipeline/src/lib/googleDocs.ts` | Encabezados y orden del Doc borrador |
| `pipeline/src/watchPublicar.ts` | Doc en Publicar → `.mdx` + imágenes → commit/push → Archivo → Registro |
| `pipeline/src/lib/parseDoc.ts` | Lee el Doc por encabezados (con alias) |
| `pipeline/src/lib/downloadImages.ts` | Fotos del Doc (en línea y flotantes) → JPEG normalizados |
| `pipeline/src/lib/extractVideosCortos.ts` | Links de Reels/TikTok/Shorts → datos para incrustar |
| `pipeline/src/lib/generateMdx.ts` | Frontmatter + cuerpo del `.mdx` |
| `pipeline/src/lib/renamedNota.ts` | Titular cambiado → borra la nota vieja y agrega redirect |
| `pipeline/src/createTemplate.ts` | Crea las plantillas Nota general / Opinión |
| `content/taxonomy/categorias.ts` | Las ocho secciones, con su descripción |
| `content/redirects.json` | Redirects 308 de notas renombradas (lo escribe el pipeline) |
| `lib/schema.ts` | Contrato del frontmatter |
| `lib/intercalarFotos.ts` | Reparte las fotos en el cuerpo al renderizar |
| `lib/videosCortos.ts` | Reconoce links de cada red y arma la URL del reproductor (compartido con el pipeline) |
| `app/nota/[slug]/page.tsx` | Página de nota: video o portada, cuerpo, fotos, videos cortos, variante Opinión |

## Arquitectura del pipeline

Carpetas de Drive, dentro de la raíz del proyecto (`11ej-EutGTMwqnKXVi99jBdbtdgewRfOM`), compartida con la service account como Editor:

| Carpeta | ID | Función |
|---|---|---|
| Entrevistas | `1Na_SaEwsRbo2Iwf1VCAorr1-yjRnJC-v` | El video crudo sube aquí |
| Borradores | `1x7GpoFQw0_5oOm0EAOKllahS9h5bNze_` | Doc en revisión |
| Publicar | `1FsVdoiBLz2qwim22s_Cg7eLsK691QiYc` | Mover un Doc aquí = publicarlo |
| Archivo | `1XBGv8OdyeOK4YGWUNuhKXCis__5HcJ9v` | Doc publicado, respaldo permanente |
| Registro de Publicaciones (Sheet) | `1MHjdYeT6dxqQwMfUrBRRLaW4jVO1TxJr9hJwq7aAmJU` | Ledger: fecha, título, autor, links, estado |
| PLANTILLA – Nota general (Doc, en la raíz) | `1raiEBZUYPHljitQzt0y_hO5-aOwYjDEV9QOVTqslwrE` | Notas sin entrevista |
| PLANTILLA – Columna de opinión (Doc, en la raíz) | `1SWsUag2xs5XLQAew7dhiSLVPhBVyRTuH1Y1MQrRaVoE` | Columnas firmadas |

**Flujo.** `watchEntrevistas.ts` (cron cada 30 min; salta con un aviso lo que no sea video o audio) → Deepgram (nova-3, es-419, diarize) → Claude Opus 5 (salida estructurada) → crea el Doc en Borradores. Las notas sin entrevista nacen de una copia de plantilla (el link `…/copy` abre el diálogo de copia). Un humano revisa y mueve el Doc a Publicar. `watchPublicar.ts` (cron cada 15 min) lo parsea, baja imágenes, genera el `.mdx`, hace commit/push, mueve el Doc a Archivo y anota la fila en el Registro. Un Doc con Titular **o Sección** vacíos se salta y queda en Publicar, así que una plantilla nunca se publica por accidente.

### Encabezados del Doc

Estilo Título 1 o 2; se comparan sin tildes ni mayúsculas. Todo lo que está antes del primer encabezado se ignora (ahí van las instrucciones de las plantillas). Un Doc viejo sin los encabezados opcionales sigue funcionando.

| Encabezado (alias) | Frontmatter | Notas |
|---|---|---|
| Titular | `title`, `slug` | El slug sale del titular; ver "Republicar" |
| Sección | `category` | Nombre ("La Calle") o slug (`la-calle`), vía `resolveCategoria()`. Una sección desconocida se publica tal cual con un warning |
| Autor (Autora, Autor/a, Autoría) | `author` | Vacío → "Redacción Tomo la Palabra". En JSON-LD, una firma que empieza por "Redacción" va como `Organization` |
| Sobre el autor (Sobre la autora) | `authorBio` | Solo se muestra en Opinión |
| Destacada (Destacado) | `featured` | "sí"/"si"/"x" → `true`. La nota principal de la portada es la más reciente marcada; si ninguna, la última publicada |
| Entradilla | `dek` | También meta description y OG |
| Cuerpo | cuerpo del `.mdx` | Markdown |
| Imágenes | `coverImage`, `images` | El texto se ignora; las fotos pueden estar en cualquier parte del Doc |
| Tags | `tags` | Separados por comas, en minúsculas |
| YouTube URL | `youtubeUrl`, `youtubeVideoId` | "(pendiente)" o vacío → sin video |
| Videos cortos (Video corto, Redes sociales, Instagram, Reels, TikTok, YouTube Shorts, Shorts) | `videosCortos` | Varios encabezados se juntan |
| Transcripción completa | `<TranscriptToggle>` en el cuerpo | Solo entrevistas |

### Secciones

`content/taxonomy/categorias.ts`, definidas por el equipo en octubre de 2026: Voces, Reflector, Coyuntura, Profundidad, La Conversa, Comunidad, La Calle, Opinión. La descripción de cada una se muestra en su página y se le pasa a Claude para que elija; Opinión (`desdeEntrevista: false`) queda fuera de sus opciones. `/categoria/reportaje` (sección retirada) redirige a Profundidad en `next.config.mjs`. El menú completo aparece desde `xl` (1280 px); por debajo, hamburguesa.

### Imágenes: el bug de las fotos flotantes

Google Docs guarda una imagen en `inlineObjects` solo si está "en línea con el texto"; con cualquier ajuste de texto (ajustar, separar, delante o detrás) va a `positionedObjects`, anclada a un párrafo. Hasta octubre de 2026 el pipeline solo leía las primeras, y 30 de 32 notas salieron sin fotos. `downloadImages.ts` recorre ambas en orden de documento, descarta duplicados exactos (hash) y re-codifica con `sharp` (rotación EXIF, máx. 1920 px de ancho, JPEG q82), guardando ancho y alto.

- La primera foto es la portada (`coverImage`); portada, tarjetas y OG recortan a 16:9.
- Las demás van en `images` y se muestran sin recorte. Si la nota tiene video de YouTube, `images` incluye también la portada, porque el embed la reemplaza en la página.
- `lib/intercalarFotos.ts` las reparte **al renderizar**: una cada 3 párrafos normales (sin contar subtítulos, citas ni listas), insertada antes del siguiente párrafo o subtítulo para no separar un párrafo de su cita. Las que sobran, o todas si la nota es corta, van donde el pipeline dejó `<Galeria />`. Cambiar la regla no requiere republicar.
- `next-mdx-remote` v6 bloquea expresiones JS en MDX: un prop como `n={0}` llega `undefined`. Los componentes que se insertan reciben strings (`<Foto n="0" />`).
- Sin foto, la nota usa `/images/paper-texture.svg`; la página de nota y el Hero lo detectan y no muestran un bloque vacío.

### Videos cortos

`extractVideosCortos.ts` toma las URL del texto y también las de texto enlazado (`textStyle.link.url`), limpia parámetros de rastreo, resuelve los links cortos de TikTok (`vm.tiktok.com`, `vt.tiktok.com`, `tiktok.com/t/`, que no traen el ID) siguiendo la redirección, descarta duplicados y avisa de lo que no reconoce. `components/VideosCortos.tsx` los incrusta con el reproductor oficial de cada red (iframe con `loading="lazy"`, sin scripts de terceros) bajo "También en redes", al final del texto y antes de la transcripción. Cada uno lleva un enlace "Ver en …" por si el iframe no carga. El embed de Instagram no se redimensiona sin su script: la altura fija (640 px a 340 px de ancho) se midió en octubre de 2026; si Instagram cambia su diseño, revisarla.

### Fechas

`pubDate` usa la fecha de Guatemala (`todayInGuatemala()` en `slug.ts`); antes era UTC y lo publicado después de las 6 p. m. salía con fecha del día siguiente. Al mostrarla, `formatDate` formatea con `timeZone: "UTC"` porque `"2026-10-07"` se parsea como medianoche UTC y en Guatemala sería el día anterior.

### Republicar y renombrar

Editar el Doc en Archivo y volver a moverlo a Publicar sobreescribe el `.mdx`, reemplaza sus imágenes (borra las que ya no estén en el Doc), **conserva `pubDate`** y marca `updatedDate`. Cada nota guarda `sourceDocId`: si el Titular cambió (slug nuevo), `renamedNota.ts` borra la nota vieja y agrega un redirect 308 en `content/redirects.json`, que lee `next.config.mjs`. Las cadenas se colapsan (A→B→C queda A→C) y volver a un titular anterior no deja redirects circulares. Cada republicación agrega una fila nueva en el Registro.

### Plantillas

Creadas con `createTemplate.ts` en la raíz del proyecto, nunca en Publicar. Nota general: mismos encabezados que un borrador de entrevista, sin transcripción y con Sección vacía a propósito. Opinión: Sección ya en "Opinión", con "Sobre el autor" y sin YouTube URL. En el sitio, `category: opinion` cambia la firma ("Columna de opinión"), agrega "Sobre …" y el aviso de responsabilidad. Si se recrea una plantilla, el ID cambia: actualizar esta tabla y la guía web.

## Autenticación con Google: el gotcha más importante

**Las service accounts NO tienen cuota de almacenamiento en Drive**, y en una cuenta Gmail personal (no Workspace) no existen Shared Drives ni domain-wide delegation para resolverlo. Por eso hay **dos** credenciales de Google:

- `GOOGLE_SERVICE_ACCOUNT_JSON`: todo lo que es leer, editar y mover archivos ya existentes, aunque no sean suyos.
- `GOOGLE_OAUTH_CLIENT_ID` / `_SECRET` / `_REFRESH_TOKEN`: **solo** para `drive.files.create()` (el Doc nuevo de `watchEntrevistas.ts` y las plantillas), porque ese archivo necesita nacer con dueño real. Una vez creado dentro de una carpeta compartida con la service account, esta puede editarlo.

Si `drive.files.create` o `docs.documents.create` fallan con `storageQuotaExceeded` o `The caller does not have permission`, es esta limitación de Google, no una regresión de permisos. Ver `pipeline/src/lib/googleClients.ts` y `pipeline/src/oauthSetup.ts`.

**`invalid_grant` al "Creando Google Doc" = refresh token vencido o revocado.** Mientras la app de OAuth estuvo en modo **Testing**, Google vencía el refresh token a los 7 días. Pasó el 2026-09-23: los videos se transcribían y redactaban (gastando Deepgram y Claude) y fallaban en el último paso. Desde entonces la app está **In production**, sin verificar (para uso propio no hace falta; el login muestra "app no verificada", que se pasa con *Avanzado → Ir a…*). Si vuelve a pasar: revisar que siga en producción, correr `npm run pipeline:google-oauth-setup` **en una terminal propia** (imprime el token) y actualizar `.env.local` y `gh secret set GOOGLE_OAUTH_REFRESH_TOKEN`. Google exige una política de privacidad para estar en producción: es `app/privacidad/page.tsx`, que describe solo la herramienta interna. La pantalla de consentimiento todavía tiene registrada `https://tomo-la-palabra.vercel.app/privacidad`, que llega por redirect; si Google la rechaza, cambiarla a `https://tomolapalabra.com/privacidad`. Los avisos de "Branding verification" solo aplican a la verificación de marca y se pueden ignorar.

## Dominio (GoDaddy → Vercel)

`tomolapalabra.com` está registrado en GoDaddy, que sigue manejando los DNS (`ns25/ns26.domaincontrol.com`); no se delegó a Vercel DNS. Dos registros relevantes: `A @ → 216.198.79.1` y `CNAME www → c5a9c8376c59da29.vercel-dns-017.com` (los legacy `76.76.21.21` y `cname.vercel-dns.com` también funcionarían). En Vercel → Domains, el dominio sin `www` es el de Production. Al agregar un dominio, Vercel propone `www` como principal, lo que contradice `lib/seo.ts` y el pipeline: si se reconfigura, revisar que no quede invertido.

Para diagnosticar sin esperar la propagación: `dig +short tomolapalabra.com A @ns25.domaincontrol.com`. Si devuelve `3.33.130.190` / `15.197.148.33`, son las IP de "Parked" de GoDaddy (un solo registro `A` con dos IP). El TXT `google-site-verification=…` en la raíz es la verificación de Search Console: no borrarlo.

## GitHub Actions

- `transcribe.yml`: cron `*/30 * * * *`, corre `watchEntrevistas`.
- `publish.yml`: cron `*/15 * * * *`, corre `watchPublicar`. Necesita `permissions: contents: write` y `git config user.name/email`. Se puede disparar a mano con `gh workflow run publish.yml`.
- `deploy.yml`: corre en `push` a main, en `workflow_run` después de `Publish` y a mano.
  - Un push hecho por otro workflow con el `GITHUB_TOKEN` no dispara `on: push` (regla anti-loop de GitHub); por eso escucha `workflow_run`. Hace checkout de la **punta de la rama** (`workflow_run.head_branch`), no de `workflow_run.head_sha`: ese es el commit sobre el que *corrió* Publish, el anterior a la nota. Hasta octubre de 2026 se usaba `head_sha`, y cada nota salía en vivo recién en el siguiente ciclo (15-30 min tarde).
  - **Dedupe**: `Publish` termina en éxito aunque no publique nada, y cada tick disparaba un deploy real (~70-95/día). Eso agotó la cuota gratuita de Vercel el 2026-08-09 (`api-upload-free`). Ahora consulta `GET /v6/deployments?target=production` y omite build/deploy si el `meta.githubCommitSha` del último deploy coincide con `git rev-parse HEAD`. Si Vercel cambia esa respuesta, el chequeo falla abierto y despliega igual. Además, `vercel deploy` usa `--archive=tgz`: sin eso, cada archivo del build cuenta como una subida y unos pocos deploys en un día volvían a agotar el límite (pasó otra vez el 2026-10-08).
  - El deploy manual (`workflow_dispatch`) **se salta el dedupe a propósito**: es la única forma de recoger cambios que no viven en el commit, como variables nuevas en Vercel, porque los deployments `--prebuilt` no se pueden redesplegar desde el dashboard.
  - Si una nota publicada no aparece en el sitio, revisar primero si `Deploy` corrió después de `Publish` y qué commit desplegó ("Commit a desplegar" en el log).

Todos los secrets (API keys, credenciales de Google, IDs de Drive) están en GitHub Secrets. Los valores reales solo existen ahí y en `.env.local` de Moncho, nunca en el código.

## El repo vive en un disco exFAT: tres trampas

El proyecto está en `/Volumes/Pikachu`, un volumen exFAT que no guarda permisos Unix ni distingue mayúsculas:

- **`core.fileMode`**: sin desactivarlo, todos los archivos aparecen modificados (`100644 => 100755`). Ya está `core.fileMode=false` en la config local. Si `git status` muestra todo el repo modificado, es esto.
- **`core.ignorecase=true`** (autodetectado): los patrones de `.gitignore` dejan de distinguir mayúsculas. La regla `VIDEOS/` capturaba también `app/videos/`, que quedó fuera del repo hasta que `/videos` dio 404 en producción. **Toda regla de `.gitignore` para una carpeta de la raíz va anclada con `/`** (`/VIDEOS/`, `/presentacion-flujo/`, `/manual-editorial/`).
- **`next build` se cuelga**: `.next/` quedó con una carpeta fantasma (`.next/server/app/tag`) que `rm -rf` no borra ni `ls` lista, y el build se queda en "Environments: .env.local". El build de CI no se ve afectado. Para compilar en local, copiar el repo a un disco APFS y enlazar `node_modules`:

```bash
B=/tmp/tlp && rm -rf $B && mkdir -p $B && git ls-files -co --exclude-standard \
  | while read f; do [ -e "$f" ] && echo "$f"; done | rsync -a --files-from=- . $B/ \
  && ln -s "$PWD/node_modules" $B/node_modules && cp .env.local $B/ && (cd $B && npx next build)
```

Si algo funciona en local pero no en producción, `git ls-files <ruta>` y `git check-ignore -v <ruta>` son el primer diagnóstico: el build de CI solo ve lo que está en el repo.

## Verificar cambios visuales

Con el build de la copia local, `npx next start -p <puerto>` y capturas con Chrome headless (`--screenshot`, `--window-size`). **Chrome headless no renderiza por debajo de 500 px de ancho**: a 390 px recorta una página de 500 y parece que el contenido se desborda. Para móvil, medir con 500 px o con DevTools, no confiar en esa captura.

## Variables de entorno

Ver `.env.example` para la lista completa. Nunca leer `.env.local` directo (contiene secretos reales): para verificar que algo está seteado, usar `grep -c "NOMBRE=" .env.local` o revisar la longitud (`awk -F= '{print length($2)}'`), no el valor.

## Sección /videos (YouTube Data API)

`lib/youtube.ts` lee la playlist de subidas del canal (`UC3bxUswJgceF-gA7GEXAV2w`) y muestra los 50 más recientes; es la única parte del sitio que lee datos externos en vivo. Revalida cada 30 min por ISR, sin deploy. 50 es el tope de una página de la API; más allá habría que paginar con `pageToken`.

`YOUTUBE_API_KEY` y `YOUTUBE_CHANNEL_ID` viven **en Vercel (Production) y en `.env.local`**, no en GitHub Secrets: `deploy.yml` las obtiene con `vercel pull`.

**Gotcha de Vercel, Secret vs Config**: las variables tipo `Secret` (antes "Sensitive") **no se descargan con `vercel pull`**: el CLI escribe el literal `[SENSITIVE]` y el build sigue con ese valor. El síntoma es "no se encontraron videos", sin error. Como el build corre en GitHub Actions, **toda variable que el build necesite tiene que ser `Config`**. El tipo no se puede cambiar: hay que borrar la variable y recrearla.

## Sistema de diseño

Colores y tipografías del brandbook (`TOMO LA PALABRA_BRANDBOOK 2025.pdf`, no en git). Paleta en `tailwind.config.ts` (`brand.verde/amarillo/crema/gris` y una escala `ink` cálida). **Las fuentes Chantal y Dreamwalker no existen como archivos con licencia**: el sitio usa Anton (por Dreamwalker) y Permanent Marker (por Chantal), marcadas con `TODO` en `app/layout.tsx`. El texto corrido usa Raleway.

## Accesibilidad

El sitio debe cumplir **WCAG 2.1 nivel AA**: hay personas usuarias de lector de pantalla en el equipo editorial, así que no es opcional. Ya se hizo una pasada completa (skip-link, foco visible, jerarquía de encabezados, contraste, títulos de página únicos, sin links duplicados). Todo componente nuevo debe mantenerlo: alt text real (o `alt=""` si es decorativo o redundante junto a un link con el mismo destino), encabezados sin saltos, contraste mínimo 4.5:1, iframes con `title`, y todo lo interactivo usable con teclado.

## Documentación para el equipo

Dos documentos, ambos en `manual-editorial/` (gitignored), con la paleta y las fuentes del sitio y en voseo. **Si cambia el pipeline (encabezados del Doc, taxonomía, imágenes, tiempos de cron, plantillas), los dos quedan desactualizados**: documentan comportamiento real, no intenciones.

**Manual de publicación (PDF)**: fuente en `index.html`, páginas carta con `@page { size: letter }` y un `div.page` por página. **No hay reflujo automático**: si se agrega contenido, revisar página por página que no se desborde sobre el pie (la página 4 está casi llena). Regenerar:

```bash
cd manual-editorial && "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="manual-publicacion-tomo-la-palabra.pdf" \
  --virtual-time-budget=10000 "file://$(pwd)/index.html"
```

**Guía de uso (web)**: fuente en `guia-cms.html`, con accesos directos a las carpetas y plantillas (por eso tiene los IDs de Drive). Publicada como Artifact privado en https://claude.ai/artifact/K7WnY5mBj9XmxyF3k8pZb2; para actualizarla, editar el HTML y republicar en esa misma URL.

## Reutilizado de otros proyectos (referencia, no código compartido)

- Parámetros de Deepgram y fusión de utterances en turnos: `/Users/ramonzamora/Documents/BID_Cuali/limpieza-transcripciones-bam`.
- Patrón HTML→PDF/PPTX para presentaciones: `/Users/ramonzamora/Documents/Victoria/propuesta-victoria` (ver `presentacion-flujo/`, gitignored).
