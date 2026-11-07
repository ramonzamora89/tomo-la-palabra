#!/usr/bin/env bash
# ¿Hace falta desplegar? Imprime "si" o "no" en la última línea de stdout (el
# resto es log). Lo usan Publish (para lanzar Deploy solo cuando hay algo
# nuevo) y Deploy (para no reconstruir un commit que ya está en producción).
#
# Hace falta si:
#   - el commit actual (HEAD) no es el del último deploy de producción, o
#   - se cumplió el embargo (publishAt) de una nota después de que empezó el
#     build de ese deploy: la nota ya viaja en el commit, pero el build la dejó
#     fuera de portada, secciones y sitemap.
#
# Necesita VERCEL_TOKEN y VERCEL_PROJECT_ID. Si la API de Vercel no responde
# o cambia su formato, falla abierto: dice "si".
set -uo pipefail

SHA="$(git rev-parse HEAD)"
LATEST=$(curl -sf -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v6/deployments?projectId=$VERCEL_PROJECT_ID&target=production&limit=1&state=READY" \
  || echo "{}")
LATEST_SHA=$(echo "$LATEST" | jq -r '.deployments[0].meta.githubCommitSha // empty' 2>/dev/null || echo "")
# Cuándo empezó el build de ese deploy (ms), anotado por deploy.yml; los
# deploys viejos no lo tienen.
LATEST_BUILD=$(echo "$LATEST" | jq -r '.deployments[0].meta.buildStartedAt // empty' 2>/dev/null || echo "")
echo "Commit actual: $SHA"
echo "Último deploy en producción: ${LATEST_SHA:-<no se pudo determinar>}"

NOW_MS=$(( $(date +%s) * 1000 ))
for T in $(grep -h '^publishAt:' content/notas/*.mdx 2>/dev/null \
             | sed -E "s/^publishAt:[[:space:]]*['\"]?([^'\"]+)['\"]?[[:space:]]*$/\1/" || true); do
  T_MS=$(( $(date -d "$T" +%s) * 1000 ))
  if [ "$T_MS" -le "$NOW_MS" ] && [ "$T_MS" -gt "${LATEST_BUILD:-$NOW_MS}" ]; then
    echo "Se cumplió el embargo de una nota ($T) después del último build."
    echo "si"; exit 0
  fi
done

if [ -n "$LATEST_SHA" ] && [ "$SHA" = "$LATEST_SHA" ]; then
  echo "Ya está desplegado."
  echo "no"
else
  echo "si"
fi
