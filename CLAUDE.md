# CLAUDE.md — Tomo la Palabra

Instrucciones técnicas para trabajar en este repo. Para contexto de negocio, estado del proyecto y preguntas pendientes, ver `PROJECT.md`.

## Qué es esto

Sitio web (Next.js) + pipeline de contenido para Tomo la Palabra, un medio guatemalteco de entrevistas en video. El contenido nace en Google Drive (video → transcripción → borrador → revisión humana → publicación) y termina como archivos `.mdx` versionados en este mismo repo. No hay CMS ni base de datos externa — el repo es la fuente de verdad del contenido publicado.

- **Sitio en vivo**: https://tomolapalabra.com (dominio en GoDaddy, DNS apuntando a Vercel: `A @ → 216.198.79.1` y `CNAME www → c5a9c8376c59da29.vercel-dns-017.com`; `www` redirige con 308 al dominio sin `www`). `https://tomo-la-palabra.vercel.app` también redirige con 308 a `tomolapalabra.com` conservando la ruta, así que los links viejos del Registro siguen funcionando. La pantalla de consentimiento de OAuth todavía tiene registrada `https://tomo-la-palabra.vercel.app/privacidad` (llega por redirect); si Google la rechaza algún día, cambiarla a `https://tomolapalabra.com/privacidad`.
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
npm run pipeline:create-opinion-template -- <folderId>  # recrea la plantilla de Opinión (p. ej. al migrar de cuenta)
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

Flujo: `watchEntrevistas.ts` (cron cada 30 min) → Deepgram (nova-3, es-419, diarize) → Claude Opus 5 (salida estructurada) → crea el Doc en Borradores con encabezados `Titular / Sección / Autor / Destacada / Entradilla / Cuerpo / Imágenes / Tags / YouTube URL / Videos cortos / Transcripción completa`. Un humano revisa y arrastra el Doc a Publicar. `watchPublicar.ts` (cron cada 15 min) parsea el Doc por esos encabezados (estilo Título 1/2; todo lo que esté antes del primero se ignora), baja las imágenes, genera el `.mdx`, hace commit/push, mueve el Doc a Archivo y anota la fila en el Registro.

Encabezados opcionales (un Doc viejo sin ellos sigue funcionando):
- **`Autor`** — firma de la nota; vacío o ausente → "Redacción Tomo la Palabra". En JSON-LD, una firma que empieza por "Redacción" se declara como `Organization`, no `Person`.
- **`Destacada`** — "sí" la fija como nota principal de la portada (`featured: true`). Gana la más reciente marcada; si ninguna, la última publicada. Se desmarca republicando con "no".
- **`Sobre el autor`** — solo Opinión: bio corta que se muestra bajo la columna.
- **`Videos cortos`** — links de Reels, TikTok o YouTube Shorts, uno por línea (también acepta encabezados por red: `Instagram`, `TikTok`, `YouTube Shorts`, `Reels`, y los junta). Se leen las URL del texto y también las de texto enlazado. `extractVideosCortos.ts` limpia parámetros de rastreo, resuelve los links cortos de TikTok (`vm.tiktok.com`, que no traen el ID) y descarta lo que no reconoce. En el sitio, `components/VideosCortos.tsx` los incrusta con el reproductor oficial de cada red (iframe con carga diferida, sin scripts de terceros) bajo "También en redes", al final del texto y antes de la transcripción. El embed de Instagram no se redimensiona sin su script: la altura fija (640 px a 340 px de ancho) se midió en octubre de 2026; si Instagram cambia su diseño, revisarla.

**Secciones** (`content/taxonomy/categorias.ts`, definidas por el equipo en octubre de 2026): Voces, Reflector, Coyuntura, Profundidad, La Conversa, Comunidad, La Calle, Opinión. El Doc acepta el nombre ("La Calle") o el slug (`la-calle`). La descripción de cada una se muestra en su página y se le pasa a Claude para que elija sección; Opinión (`desdeEntrevista: false`) queda fuera de esas opciones. `/categoria/reportaje` (sección retirada) redirige a Profundidad.

**Imágenes — el bug de las fotos flotantes.** Google Docs guarda una imagen en `inlineObjects` solo si está "en línea con el texto"; con cualquier ajuste de texto (ajustar, separar, delante/detrás) va a `positionedObjects`, anclada a un párrafo. Hasta octubre de 2026 el pipeline solo leía las primeras, y 30 de 32 notas salieron sin fotos. `downloadImages.ts` ahora recorre ambas en orden de documento, descarta duplicados exactos (hash) y re-codifica todo con `sharp` (rotación EXIF, máx. 1920 px de ancho, JPEG q82). La primera es la portada; las demás van en `images` del frontmatter y se muestran sin recorte. Al renderizar, `lib/intercalarFotos.ts` las reparte en el cuerpo: una cada 3 párrafos normales (sin contar subtítulos, citas ni listas), insertada antes del siguiente párrafo o subtítulo para no separar un párrafo de su cita. Las que sobran, o todas si la nota es corta, van donde el pipeline dejó `<Galeria />`. Como se hace al renderizar, la regla aplica a todas las notas sin republicar. Ojo: `next-mdx-remote` v6 bloquea expresiones JS en MDX, así que el índice va como texto (`<Foto n="0" />`). Si la nota tiene video, la galería incluye también la portada (el embed la reemplaza en la página). Portada y tarjetas recortan a 16:9.

**Fecha**: `pubDate` usa la fecha de Guatemala (`todayInGuatemala()`); antes era UTC y lo publicado después de las 6 p. m. salía con fecha del día siguiente. Al mostrarla, `formatDate` formatea en UTC porque `"2026-10-07"` se parsea como medianoche UTC.

**Plantilla de Opinión**: Doc "PLANTILLA – Columna de opinión" en la carpeta raíz del proyecto (`1L-AHePlvBAANPLyaUKR9xabce17_zbiE7h2wST9BPds`), sin YouTube URL ni transcripción. El equipo hace una copia, la llena y la arrastra a Publicar. Con Titular vacío el pipeline la salta, así que la plantilla misma nunca se publica. En el sitio, `category: opinion` cambia la firma ("Columna de opinión"), agrega "Sobre …" y el aviso de responsabilidad.

**Reprocesar/editar una nota ya publicada**: editar el Doc en Archivo y volver a arrastrarlo a Publicar. Sobreescribe el `.mdx`, reemplaza sus imágenes (borra las que ya no estén en el Doc), **conserva `pubDate`** y marca `updatedDate`. Cada nota guarda `sourceDocId`: si el Titular cambió (slug nuevo), `renamedNota.ts` borra la nota vieja y agrega una redirección 308 en `content/redirects.json`, que lee `next.config.mjs`. Las cadenas se colapsan (A→B→C queda A→C).

## Autenticación con Google — el gotcha más importante

**Las service accounts NO tienen cuota de almacenamiento en Drive**, y en una cuenta Gmail personal (no Workspace) no existen Shared Drives ni domain-wide delegation para resolverlo. Por eso hay **dos** credenciales de Google en juego, no una:

- `GOOGLE_SERVICE_ACCOUNT_JSON` — hace todo lo que es leer/editar/mover archivos ya existentes.
- `GOOGLE_OAUTH_CLIENT_ID` / `_SECRET` / `_REFRESH_TOKEN` — se usa **solo** para `drive.files.create()` (crear el Doc nuevo en `watchEntrevistas.ts`), porque ese archivo necesita nacer con dueño real (cuota real). Una vez creado dentro de una carpeta ya compartida con la service account, esta puede editarlo sin problema.

Si `drive.files.create` o `docs.documents.create` empiezan a fallar con `storageQuotaExceeded` o `The caller does not have permission`, es este mismo problema — no es una regresión de permisos, es la limitación de Google. Ver `pipeline/src/lib/googleClients.ts` y `pipeline/src/oauthSetup.ts`.

**`invalid_grant` al "Creando Google Doc" = refresh token vencido o revocado.** Mientras la app
de OAuth estuvo en modo **Testing** en Google Cloud Console, Google hacía vencer el refresh token
a los 7 días. Eso pasó el 2026-09-23: los videos se transcribían y redactaban (gastando
Deepgram y Claude) y fallaban en el último paso. Desde ese día la app está **In production**
(sin verificar, cosa que para uso propio no hace falta; el login muestra la advertencia de "app
no verificada", que se pasa con *Avanzado → Ir a…*). Si vuelve a aparecer: revisar que siga en
producción, correr `npm run pipeline:google-oauth-setup` **en una terminal propia** (imprime el
token en pantalla) y actualizar el valor en `.env.local` y en `gh secret set
GOOGLE_OAUTH_REFRESH_TOKEN`. Google exige una URL de política de privacidad para estar en
producción: es `app/privacidad/page.tsx`, que describe solo la herramienta interna, no el sitio.
Los avisos de "Branding verification" (dominio no registrado, nombre distinto) solo aplican si
se quiere la verificación de marca y se pueden ignorar.

## Dominio (GoDaddy → Vercel)

`tomolapalabra.com` está registrado en GoDaddy, que sigue manejando los DNS con sus nameservers (`ns25/ns26.domaincontrol.com`); no se delegó a Vercel DNS. Solo hay dos registros relevantes: `A @ → 216.198.79.1` y `CNAME www → c5a9c8376c59da29.vercel-dns-017.com` (los valores "nuevos" que recomienda Vercel; los legacy `76.76.21.21` y `cname.vercel-dns.com` también funcionarían). En Vercel → Domains, el dominio sin `www` es el de Production, y tanto `www` como `tomo-la-palabra.vercel.app` redirigen con 308. Al agregar un dominio, Vercel propone `www` como principal por defecto, lo que contradice `lib/seo.ts` y el pipeline: si se reconfigura, revisar que no vuelva a quedar invertido.

Para diagnosticar DNS sin esperar la propagación, se puede preguntar directo a GoDaddy: `dig +short tomolapalabra.com A @ns25.domaincontrol.com`. Si devuelve `3.33.130.190` / `15.197.148.33`, son las IP de "Parked" de GoDaddy: es **un solo** registro `A` que resuelve a dos IP, no dos registros. El TXT `google-site-verification=…` en la raíz es la verificación de Search Console: no borrarlo.

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

## El repo vive en un disco exFAT — trampas de git y de build

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

- **`next build` se cuelga en el volumen exFAT** (octubre de 2026): `.next/` quedó con una carpeta
  fantasma (`.next/server/app/tag`) que `rm -rf` no puede borrar ni `ls` listar, y el build se
  queda en "Environments: .env.local" sin avanzar. El build de CI no se ve afectado. Para compilar
  en local, copiar el repo a un disco APFS y enlazar `node_modules`:
  `git ls-files -co --exclude-standard | rsync -a --files-from=- . /tmp/tlp/ && ln -s "$PWD/node_modules" /tmp/tlp/`.

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
