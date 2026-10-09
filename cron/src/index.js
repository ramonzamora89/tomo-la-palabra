// Reloj de Tomo la Palabra: el cron de GitHub Actions se atrasa horas (Publish
// "cada 15 min" corría cada 4-6 h en octubre de 2026). Este Worker lanza los
// mismos workflows con workflow_dispatch, que sí sale a tiempo. Mismo patrón que
// Escucha-Social/scheduler. Los workflows tienen `concurrency`, así que un
// disparo que llega mientras otro corre espera en vez de duplicar el trabajo.

async function dispatch(env, workflow) {
  const url = `https://api.github.com/repos/${env.GITHUB_REPO}/actions/workflows/${workflow}/dispatches`;
  const r = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "tomo-la-palabra-reloj",
    },
    body: JSON.stringify({ ref: "main" }),
  });
  // 204 = lanzado. Cualquier otra cosa se lanza como error para que salga en los registros de Cloudflare
  if (r.status !== 204) throw new Error(`${workflow}: GitHub respondió ${r.status} ${await r.text()}`);
  console.log(`${workflow} lanzado`);
}

export default {
  async scheduled(event, env) {
    // Publish cada 15 min; Transcribe cada 30 (los ticks de :04 y :34).
    const minute = new Date(event.scheduledTime).getUTCMinutes();
    const workflows = ["publish.yml"];
    if (minute % 30 === 4) workflows.push("transcribe.yml");
    const results = await Promise.allSettled(workflows.map((w) => dispatch(env, w)));
    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length) throw new Error(failed.map((r) => r.reason.message).join("; "));
  },
};
