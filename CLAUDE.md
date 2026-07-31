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

Todos los secrets (API keys + credenciales de Google + IDs de Drive, aunque estos últimos no son sensibles) están en GitHub Secrets del repo. Los valores reales solo existen ahí y en `.env.local` de Moncho — nunca en el código.

## Variables de entorno

Ver `.env.example` para la lista completa con comentarios. Nunca leer `.env.local` directo (contiene secretos reales) — para verificar que algo está seteado, usar `grep -c "NOMBRE=" .env.local` o revisar longitud (`awk -F= '{print length($2)}'`), no el valor.

## Sistema de diseño

Colores y tipografías del brandbook real (`TOMO LA PALABRA_BRANDBOOK 2025.pdf`, no en git — ver `.gitignore`). Paleta en `tailwind.config.ts` (`brand.verde/amarillo/crema/gris`). **Las fuentes Chantal y Dreamwalker del brandbook no existen como archivos con licencia** — hoy el sitio usa sustitutos de Google Fonts (Anton por Dreamwalker, Permanent Marker por Chantal, ambos marcados con un comentario `TODO` en `app/layout.tsx`) hasta conseguir las fuentes reales.

## Accesibilidad

El sitio debe cumplir **WCAG 2.1 nivel AA** — hay usuarios reales de lector de pantalla en el equipo editorial de Tomo la Palabra, así que esto no es opcional ni cosmético. Ya se hizo una pasada completa (skip-link, foco visible en todo fondo, jerarquía de encabezados, contraste de texto, títulos de página únicos, sin links duplicados). Cualquier componente o página nueva debe mantener ese estándar: alt text real (o `alt=""` si es puramente decorativo/redundante junto a un link con el mismo destino), jerarquía de encabezados sin saltos, contraste mínimo 4.5:1 en texto normal, y todo interactivo debe funcionar con teclado.

## Reutilizado de otros proyectos (referencia, no código compartido)

- Parámetros de Deepgram y lógica de fusión de utterances en turnos: `/Users/ramonzamora/Documents/BID_Cuali/limpieza-transcripciones-bam` (flujo manual, no automatizado — solo se copió el patrón).
- Patrón HTML→PDF/PPTX para presentaciones: `/Users/ramonzamora/Documents/Victoria/propuesta-victoria` (ver `presentacion-flujo/` en este proyecto, gitignored, no es parte del sitio).
