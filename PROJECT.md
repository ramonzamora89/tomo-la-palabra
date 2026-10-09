# PROJECT.md — Tomo la Palabra

Contexto de negocio, estado y pendientes. El detalle técnico está en `CLAUDE.md`.

## Qué es

Tomo la Palabra es un medio guatemalteco, nacido en redes sociales, enfocado en entrevistas en video largas que le dan voz a la gente común. Este proyecto es su sitio web, que se alimenta de un flujo editorial en Google Drive: el equipo trabaja con carpetas y documentos de Google, sin tocar código ni entrar a un panel de administración.

## Enlaces

- **Sitio**: https://tomolapalabra.com (`www` y `tomo-la-palabra.vercel.app` redirigen con 308). Verificado en Google Search Console como propiedad de dominio, con el sitemap enviado.
- **Repo**: https://github.com/ramonzamora89/tomo-la-palabra (público)
- **Carpeta raíz de Drive**: `11ej-EutGTMwqnKXVi99jBdbtdgewRfOM`, en la cuenta personal de Moncho y compartida como Editor con la service account `ramon@labetnografico.com`. Contiene las cuatro carpetas del flujo y las dos plantillas.
- **Guía de uso del sistema** (web, para el equipo): https://claude.ai/artifact/K7WnY5mBj9XmxyF3k8pZb2. Es privada: se comparte desde su menú Compartir.
- **Manual de publicación** (PDF, 12 páginas, v1.2 del 8 de octubre de 2026): `manual-editorial/manual-publicacion-tomo-la-palabra.pdf`. No está en git.
- **Presentación del flujo**: `presentacion-flujo/propuesta.pdf` y `.pptx`. No está en git.
- **Canal de YouTube**: `UC3bxUswJgceF-gA7GEXAV2w` (1,409 suscriptores y 15.1 K horas de reproducción al 7 de septiembre de 2026).

## Estado actual (9 de octubre de 2026)

El sitio está en producción con dominio propio y 31 notas reales. El flujo editorial funciona solo, en GitHub Actions, con un reloj en Cloudflare que lo lanza a tiempo:

- **Tres formas de empezar una nota**: subir una entrevista en video (el borrador se transcribe y redacta solo), o copiar una de las dos plantillas, **Nota general** u **Opinión**. Desde ahí, mover el Doc a Publicar lo publica en unos 15 minutos.
- **Ocho secciones** definidas por el equipo: Voces, Reflector, Coyuntura, Profundidad, La Conversa, Comunidad, La Calle y Opinión.
- **Desde el Doc** se controla la firma (`Autor`, por defecto "Redacción Tomo la Palabra"), la nota principal de la portada (`Destacada`), las fotos (todas se publican, repartidas en el texto) y los videos cortos de Instagram, TikTok o YouTube Shorts (`Videos cortos`).
- **Corregir** una nota es editar su Doc en Archivo y volver a moverlo a Publicar. Conserva la fecha original; si cambió el titular, la URL vieja redirige a la nueva.

## Historial

### 31 de julio de 2026: lanzamiento

Los 10 milestones del plan original completos y verificados con contenido real. Después, dos ajustes en producción: menú hamburguesa en móvil y una pasada completa de accesibilidad WCAG 2.1 AA (commit `Accessibility pass against WCAG 2.1 AA`). La accesibilidad es un requisito permanente: hay personas usuarias de lector de pantalla en el equipo.

### 7 de septiembre de 2026: videos y manual

- **`/videos` en vivo**, conectada al canal. Salieron tres fallas encadenadas, documentadas en `CLAUDE.md`: una regla de `.gitignore` que dejaba `app/videos/` fuera del repo, el chequeo anti-tormenta que bloqueaba el deploy manual, y variables de Vercel creadas como `Secret`.
- **Manual de publicación** v1.0 en PDF.
- **Monetización**: el canal ya califica para el Programa de Socios de YouTube (pide 1,000 suscriptores y 4,000 horas). AdSense en trámite.

### 6 de octubre de 2026: dominio propio

`tomolapalabra.com` en vivo (GoDaddy → Vercel), sin `www` como dominio canónico, con el pipeline anotando las URLs nuevas en el Registro y Search Console verificado.

### 7 y 8 de octubre de 2026: primera ronda de pedidos del equipo

- **Fotos recuperadas.** El equipo insertaba las fotos con ajuste de texto y el pipeline solo leía las que estaban "en línea": 30 de 32 notas se habían publicado sin imágenes. Se republicaron desde sus Docs y se recuperaron 75 fotos. Ahora la primera es la portada y las demás se reparten en el texto, una cada tres párrafos.
- **Secciones definitivas** y reclasificación de las 32 notas, también en sus Docs. "Reportaje" desapareció; su URL redirige a Profundidad.
- **Encabezados nuevos en el Doc**: `Autor`, `Destacada`, `Sobre el autor` (Opinión) y `Videos cortos`.
- **Plantillas de Nota general y Opinión**. La de nota general habilita notas sin entrevista, que hasta ahora estaban fuera del alcance.
- **Se quitaron las 3 notas de ejemplo** del andamiaje inicial. Una de ellas, con texto de relleno, era la nota principal fija de la portada en vivo.
- **Bugs corregidos**: republicar con otro titular duplicaba la nota; la fecha salía en UTC (un día después de noche) y se mostraba un día antes; el deploy posterior a Publish tomaba el commit anterior a la nota, que salía en vivo con 15 a 30 minutos de atraso.
- **Guía web de uso** para el equipo y manual en PDF actualizado a la v1.2, con las dos plantillas.

### 8 y 9 de octubre de 2026: el flujo, a tiempo

- **Reloj en Cloudflare.** El cron de GitHub corría Publish "cada 15 minutos" cada 4 a 6 horas, así que una nota podía tardar medio día en salir. Un Worker de Cloudflare (`cron/`, mismo patrón que Escucha-Social) lo lanza ahora cada 15 minutos y Transcribe cada 30. Para hacerle lugar en el cupo gratuito de 5 crons se le quitó el suyo al reloj de otro proyecto (rastreo-carta), que ya no lo necesitaba.
- **Sin corridas simultáneas** (`concurrency` en los tres workflows): evita procesar un video dos veces y pagar doble, o que un deploy viejo termine después de uno nuevo.
- **Se quitó una nota duplicada**: "Nos ponen al final de la cola…" (agosto) era una versión de prueba de "Sin agua en la colonia Landívar…" (octubre), con la misma entrevista. Su URL redirige a la de octubre.
- El equipo republicó buena parte de las notas desde Archivo, con fotos y titulares corregidos: el flujo de corrección ya está en uso.

## Decisiones ya tomadas

- Video embebido de YouTube, no autohospedado. Los videos cortos usan el reproductor oficial de cada red.
- Contenido versionado como `.mdx` en el propio repo (git como CMS), sin CMS ni base de datos externa. Google Drive es la interfaz editorial.
- Solo AdSense en v1, con `<AdSlot>` diseñado para enchufar anuncios locales después sin rediseño.
- Despliegue orquestado desde GitHub Actions, no el auto-deploy de Vercel, pensando en una posible migración a AWS.
- El horario lo marca un Worker de Cloudflare con `workflow_dispatch`, no el `schedule` de GitHub, que se atrasa horas. El `schedule` queda solo como respaldo.
- Keys de Deepgram y Anthropic reutilizadas de otros proyectos personales de Moncho (no son credenciales de cliente).
- Las reglas de presentación (fotos cada tres párrafos, videos cortos al final) se aplican al mostrar la página, no al publicar: cambiarlas no requiere republicar notas.

## Preguntas abiertas para el equipo de TLP

1. **Volumen esperado**: ¿cuántas notas por semana o mes? Define el costo variable real (~$0.55 por entrevista en Deepgram y Claude) y si conviene ajustar la frecuencia de los cron.
2. **Convenciones de tags**: no hay lista controlada; las etiquetas se multiplican cuando una nota usa `agua` y otra `el-agua`.
3. **Texto alternativo y portadas**: hoy ninguna foto trae texto alternativo, y muchas portadas son capturas verticales de Reels con texto encima, que pierden dos tercios al recortarse. Es práctica editorial, no código; está en la guía y el manual.
4. **Monitoreo de fuentes estatales para investigaciones**: sigue fuera del alcance de este flujo, hasta que el equipo tenga claridad de proceso.
5. **Hilos de X en el sitio**: el equipo arma hilos y los guarda unificados en PDF. Quieren integrarlos más adelante. Propuesta inicial: una tercera plantilla de Doc, "Hilo", con un párrafo por tuit, que entre al flujo de Publicar, y mostrarlos como texto propio con un enlace al hilo original, sin el embed de X (script de terceros, flojo con lector de pantalla). Falta definir si es formato o sección, si lleva fotos por tuit y si se publican los hilos viejos. Mientras tanto, los PDF no deberían ir en Entrevistas.

## Pendientes

### Para verificar pronto

- **Primera nota desde plantilla publicada por alguien del equipo.** Las copias de plantilla quedan a nombre de cada persona, no de la cuenta de Moncho. La service account debería poder moverlas igual (ya mueve Docs que no son suyos), pero no se probó con una cuenta del equipo.
- **Doc de prueba de la nota de la zona 7** (creado el 31 de julio, "Nos ponen al final de la cola…"): sigue en Archivo. Si alguien lo mueve a Publicar, la nota reaparece. Mandarlo a la papelera o renombrarlo "PRUEBA – no publicar". Su fila en el Registro también sigue.
- **Cinco PDF de hilos en Entrevistas**: ya no rompen nada (Transcribe los salta con un aviso), pero conviene moverlos a su propia carpeta.

### Antes de anunciar el sitio con publicidad

- **Vercel Pro** (~$20/mes): el plan Hobby no permite uso comercial, y el sitio va a llevar AdSense. También sube el límite de subidas diarias que se agotó dos veces.
- **Aviso de cookies y política de privacidad del sitio.** `/privacidad` describe solo la herramienta interna (la exige Google para la app de OAuth). Con AdSense hará falta consentimiento, y los reproductores de Instagram y TikTok ya dejan cookies de Meta y TikTok cuando cargan.
- **AdSense**: registrar en Guatemala y a nombre de la organización. El país de una cuenta no se puede cambiar nunca, y la verificación de dirección llega por correo postal con un PIN al llegar a $10.
- **Monetización de YouTube**: falta el trámite (verificación en 2 pasos, funciones avanzadas, AdSense vinculado, postular en Studio). Por los temas del medio, es probable que varios videos queden con "anuncios limitados"; las membresías y Súper Gracias pueden rendir más.

### Técnicos

- **Migrar el flujo a la cuenta institucional (YoTomoLaPalabra)**: mover las cuatro carpetas, las plantillas y el Registro; re-compartir con la service account; **generar credenciales nuevas y revocar las actuales** (JSON de la service account y `GOOGLE_OAUTH_REFRESH_TOKEN`); actualizar IDs y secretos en `.env.local` y GitHub Secrets; recrear las plantillas con `npm run pipeline:create-template`; y actualizar los enlaces de la guía web. La cuenta institucional también es Gmail personal, así que la limitación de cuota de las service accounts sigue aplicando.
- **Canonical en portada, secciones y etiquetas**: las notas ya lo emiten; las demás páginas no. No urge porque los redirects 308 evitan duplicados.
- **Fuentes de marca reales**: Chantal y Dreamwalker no existen como archivos con licencia; el sitio usa sustitutos de Google Fonts. Pedirlas a Voice Agency, la agencia del brandbook.
- **Paginación de `/videos`**: muestra hasta 50 videos, el tope de una página de la API de YouTube.
- **Registro de correcciones**: republicar una nota agrega una fila nueva en el Registro en vez de marcar la original como editada.
- **Renovar el token `tomo-la-palabra-worker` antes del 2027-10-08**: es el que usa el reloj de Cloudflare. Si vence, el flujo vuelve a depender del `schedule` de GitHub, sin error visible. Al renovarlo: `cd cron && npx wrangler@4 secret put GITHUB_TOKEN`.
- **Auditoría con lector de pantalla**: la pasada de código está hecha; falta probar con VoiceOver o NVDA, idealmente con las personas del equipo que lo usan.

## Incidentes resueltos

- **2026-10-08, `Deploy` sin cuota otra vez y `Transcribe` fallando**: (1) Vercel cuenta cada archivo del build como una subida, y unos 7 deploys en un día pasaron las 5000; ahora `vercel deploy` sube un solo `.tgz`. El sitio no perdió nada: lo que no se desplegó eran cambios de documentación. (2) Cinco PDF de hilos en Entrevistas hacían fallar cada corrida en ffmpeg (sin gasto en Deepgram ni Claude); ahora se saltan con un aviso.
- **2026-10-07, notas sin fotos**: ver Historial. Causa técnica en `CLAUDE.md` ("fotos flotantes").
- **2026-09-23, `Transcribe` caído todo el día**: (1) videos renombrados sin `.mp4` rompían ffmpeg y el primero bloqueaba a los demás; ahora los temporales se nombran por ID de Drive y cada video falla por separado. (2) El refresh token de OAuth había vencido porque la app estaba en modo Testing; se pasó a producción con la página `/privacidad`. Se recuperaron 6 borradores.
- **2026-08-09, `Deploy` sin cuota**: el cron de Publish disparaba un deploy real cada 15 minutos aunque no hubiera cambios, y agotó la cuota gratuita de Vercel. `deploy.yml` ahora omite el deploy si el commit ya está en producción.

## Convenciones de trabajo con Moncho

- Cuando algo requiere un secreto, nunca pedírselo en el chat: darle el comando exacto para que lo corra y lo guarde en `.env.local` o GitHub Secrets. Ha habido traspiés de copiado (keys truncadas, `$` de más, `.env.local` sin salto de línea final); verificar longitud y formato sin leer el valor.
- **Nunca cargar `.env.local` con `source` o `.`**: tiene el JSON de la service account con saltos de línea reales, y zsh vuelca los secretos en los mensajes de error. Para usar una variable, extraer solo esa línea (`grep -m1 '^NOMBRE=' .env.local | sed 's/^NOMBRE=//'`) sin imprimirla.
- Moncho prefiere que se implemente directamente cuando el pedido ya es concreto. Las decisiones editoriales (secciones, reclasificar notas, quitar contenido publicado) se le consultan antes.
- Este repo es público: lo que se documente aquí o se comitee queda visible. Mantener fuera la información sensible de terceros y del equipo de TLP.
- Los textos para el equipo (manual, guía, plantillas) van en español con voseo, como habla el equipo.
