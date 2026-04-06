/**
 * PBL Log Reporter — Cloudflare Worker
 *
 * Recebe logs de erro do app PBL e cria Issues anônimas no GitHub.
 * O professor NÃO precisa ter conta no GitHub.
 *
 * Deploy:
 *   1. Criar conta grátis em https://dash.cloudflare.com
 *   2. npx wrangler init pbl-log-reporter
 *   3. Copiar este arquivo para src/index.js
 *   4. npx wrangler secret put GITHUB_TOKEN  (colar um PAT com scope "repo")
 *   5. npx wrangler deploy
 *
 * Secrets necessários (configurar via Wrangler):
 *   - GITHUB_TOKEN: Personal Access Token com permissão "repo" (issues:write)
 *
 * Endpoint:
 *   POST /report
 *   Body: { "log": "conteúdo do log", "appVersion": "0.2.0", "platform": "Desktop" }
 */

const GITHUB_REPO = "marlonmotta/PROMETHEUS-BRIDGE-LEARN";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Método não permitido" }, 405);
    }

    try {
      const body = await request.json();
      const { log, appVersion, platform } = body;

      if (!log || typeof log !== "string" || log.trim().length === 0) {
        return jsonResponse({ error: "Log vazio ou inválido" }, 400);
      }

      // Limitar tamanho do log (GitHub Issues tem limite de ~65K chars no body)
      const truncatedLog = log.length > 50000
        ? log.slice(-50000) + "\n\n[...truncado — mostrando últimos 50K chars]"
        : log;

      const now = new Date().toISOString();
      const issueTitle = `[Auto-Report] Log de erro — ${now.split("T")[0]}`;
      const issueBody = [
        "## 🐛 Relatório Automático de Erro (Anônimo)",
        "",
        `**Data:** ${now}`,
        `**Versão:** ${appVersion || "desconhecida"}`,
        `**Plataforma:** ${platform || "desconhecida"}`,
        "",
        "---",
        "",
        "### Log de Erro",
        "",
        "```",
        truncatedLog,
        "```",
        "",
        "---",
        "*Este relatório foi enviado anonimamente pelo botão de suporte do PBL.*",
      ].join("\n");

      // Criar Issue via GitHub API
      const ghResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/issues`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.GITHUB_TOKEN}`,
            "Content-Type": "application/json",
            "User-Agent": "PBL-Log-Reporter/1.0",
            Accept: "application/vnd.github.v3+json",
          },
          body: JSON.stringify({
            title: issueTitle,
            body: issueBody,
            labels: ["bug", "auto-report"],
          }),
        }
      );

      if (!ghResponse.ok) {
        const ghError = await ghResponse.text();
        console.error("[PBL Worker] GitHub API error:", ghError);
        return jsonResponse({ error: "Falha ao criar relatório no GitHub" }, 502);
      }

      const issue = await ghResponse.json();

      return jsonResponse({
        success: true,
        message: "Relatório enviado com sucesso! Obrigado por ajudar a melhorar o PBL.",
        issueNumber: issue.number,
      });
    } catch (err) {
      console.error("[PBL Worker] Error:", err);
      return jsonResponse({ error: "Erro interno do servidor" }, 500);
    }
  },
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}
