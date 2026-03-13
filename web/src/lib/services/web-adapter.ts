/**
 * @module WebAdapter
 * @description Implementação web do IAppService.
 *
 * Substitui as chamadas Tauri (invoke) por APIs nativas do browser:
 * - Personas: fetch do GitHub raw content
 * - IA: fetch direto para os provedores (modo BYOK)
 * - Storage: localStorage
 * - Export: Blob + download link
 */

import type { Persona } from "@pbl/shared/constants";
import type { IAppService, AIRequest } from "./types";
import { downloadBlob } from "./web-exporters";

const GITHUB_RAW_DIRECT =
  "https://raw.githubusercontent.com/marlonmotta/PROMETHEUS-BRIDGE-LEARN/main/personas";

/** Em dev, usa proxy do Vite para evitar bloqueio do Brave Shields */
const GITHUB_RAW = import.meta.env.DEV ? "/api/personas" : GITHUB_RAW_DIRECT;

const MANIFEST_URL = `${GITHUB_RAW}/manifest.json`;

/** Endpoints das APIs de IA por provedor */
const AI_ENDPOINTS: Record<string, string> = {
  openai: "https://api.openai.com/v1/chat/completions",
  anthropic: "https://api.anthropic.com/v1/messages",
  gemini: "https://generativelanguage.googleapis.com/v1beta/models/",
  openrouter: "https://openrouter.ai/api/v1/chat/completions",
  groq: "https://api.groq.com/openai/v1/chat/completions",
};

/** MIME types por formato de exportação */
const MIME_TYPES: Record<string, string> = {
  txt: "text/plain",
  md: "text/markdown",
  html: "text/html",
};

export class WebAdapter implements IAppService {
  // ── Personas ──────────────────────────────────────────────────────────

  /** TTL do cache de personas: 24 horas */
  private static readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000;

  /** Verifica se o cache de personas está dentro do TTL */
  private isCacheValid(): boolean {
    const ts = Number(localStorage.getItem("pbl_personas_cache_ts") || "0");
    return ts > 0 && Date.now() - ts < WebAdapter.CACHE_TTL_MS;
  }

  async loadPersonas(): Promise<Persona[]> {
    try {
      // Se cache é válido (< 24h), usa direto sem fetch
      if (this.isCacheValid()) {
        const cached = localStorage.getItem("pbl_personas_cache");
        if (cached) return JSON.parse(cached);
      }

      const resp = await fetch(MANIFEST_URL);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const manifest = await resp.json();

      // Parallel fetch: todas as personas ao mesmo tempo (vs serial N+1)
      const entries = manifest.personas || [];
      const results = await Promise.allSettled(
        entries.map(
          async (entry: string | { category: string; file: string }) => {
            const path =
              typeof entry === "string"
                ? entry
                : `${entry.category}/${entry.file}`;
            const r = await fetch(`${GITHUB_RAW}/${path}`);
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const p = await r.json();
            return { ...p, _source: "remote" } as Persona;
          },
        ),
      );
      const personas = results
        .filter(
          (r): r is PromiseFulfilledResult<Persona> => r.status === "fulfilled",
        )
        .map((r) => r.value);

      // Personas importadas via 'Adicionar persona' (source: 'local') vivem no cache
      // ao lado das remotas, mas NÃO são sobrescritas por atualizações do catálogo GitHub.
      // Estratégia additive: locais SÃO ADICIONADAS às remotas, nunca substituídas.
      // Isso garante que uma atualização do catálogo não apague silenciosamente
      // personas customizadas que o professor importou - que seria um bug crítico de UX.
      // O Set de IDs remotos é O(1) lookup vs O(n²) de comparação aninhada.
      try {
        const cached = localStorage.getItem("pbl_personas_cache");
        if (cached) {
          const local: Persona[] = JSON.parse(cached);
          const remoteIds = new Set(personas.map((p) => p.meta?.id));
          for (const lp of local) {
            if (!remoteIds.has(lp.meta?.id)) {
              personas.push(lp);
            }
          }
        }
      } catch (e) {
        console.warn("[PBL] Cache de personas corrompido:", e);
      }

      // Atualiza cache com timestamp
      localStorage.setItem("pbl_personas_cache", JSON.stringify(personas));
      localStorage.setItem("pbl_personas_cache_ts", String(Date.now()));
      return personas;
    } catch (e) {
      console.warn("[PBL] Falha ao carregar personas remotas, usando cache:", e);
      // Offline: tenta cache (mesmo expirado, como fallback)
      try {
        const cached = localStorage.getItem("pbl_personas_cache");
        return cached ? JSON.parse(cached) : [];
      } catch (e) {
        console.warn("[PBL] Falha ao ler cache offline:", e);
        return [];
      }
    }
  }

  async updatePersonasOnline(): Promise<Persona[]> {
    // Invalida cache para forçar re-fetch do GitHub (não usar cache stale)
    this.invalidatePersonasCache();
    return this.loadPersonas();
  }

  /**
   * Invalida o cache de personas, forçando um novo fetch do GitHub
   * na próxima chamada a loadPersonas().
   *
   * Usado pelo botão "Atualizar catálogo" na UI - resolve o problema
   * de o professor não conseguir baixar personas novas sem limpar
   * o localStorage manualmente (cache TTL fixo de 24h).
   */
  invalidatePersonasCache(): void {
    localStorage.removeItem("pbl_personas_cache_ts");
  }

  async deletePersona(id: string): Promise<void> {
    try {
      const cached = localStorage.getItem("pbl_personas_cache");
      if (cached) {
        const personas: Persona[] = JSON.parse(cached);
        const filtered = personas.filter((p) => p.meta?.id !== id);
        localStorage.setItem("pbl_personas_cache", JSON.stringify(filtered));
      }
    } catch (e) {
      console.warn("[PBL] Falha ao deletar persona do cache:", e);
    }
  }

  async addPersonaFromJson(jsonStr: string): Promise<Persona> {
    // Limite de tamanho: 100KB por persona para prevenir DoS (paridade com Rust backend)
    if (jsonStr.length > 100_000) {
      throw new Error("JSON da persona excede o limite de 100KB");
    }
    const persona: Persona = JSON.parse(jsonStr);
    if (!persona?.meta?.id || !persona?.meta?.display_name) {
      throw new Error(
        "Persona inválida: meta.id e meta.display_name são obrigatórios",
      );
    }
    try {
      const cached = localStorage.getItem("pbl_personas_cache");
      const personas: Persona[] = cached ? JSON.parse(cached) : [];
      personas.push({ ...persona, _source: "local" });
      localStorage.setItem("pbl_personas_cache", JSON.stringify(personas));
    } catch (e) {
      console.warn("[PBL] Falha ao salvar persona no cache:", e);
    }
    return persona;
  }

  // ── AI ─────────────────────────────────────────────────────────────────

  /** Chave no localStorage para rate limit cross-tab de IA */
  private static readonly RATE_LIMIT_KEY = "pbl_last_invoke_ts";
  /** Intervalo mínimo entre chamadas de IA (ms) */
  private static readonly MIN_INVOKE_INTERVAL = 3000;
  /** Timeout global para chamadas de IA (60 segundos) */
  private static readonly AI_TIMEOUT_MS = 60_000;

  async invokeAI(params: AIRequest): Promise<string> {
    // Rate limiting cross-tab: lê/escreve em localStorage para que
    // múltiplas abas abertas compartilhem a mesma janela de rate limit.
    // Isso espelha o comportamento do AtomicU64 no backend Rust.
    const now = Date.now();
    const lastStr = localStorage.getItem(WebAdapter.RATE_LIMIT_KEY);
    const last = lastStr ? Number(lastStr) : 0;
    const elapsed = now - last;
    if (elapsed < WebAdapter.MIN_INVOKE_INTERVAL) {
      throw new Error(
        `Aguarde ${Math.ceil((WebAdapter.MIN_INVOKE_INTERVAL - elapsed) / 1000)}s antes de gerar novamente.`,
      );
    }
    localStorage.setItem(WebAdapter.RATE_LIMIT_KEY, String(now));

    const { provider, apiKey, model, systemPrompt, userContent } = params;

    if (provider === "ollama") {
      throw new Error(
        "Ollama não é suportado na versão web. Use o modo online ou manual.",
      );
    }

    // Gemini tem API diferente
    if (provider === "gemini") {
      return this.callGemini(apiKey, model, systemPrompt, userContent);
    }

    // Anthropic tem API diferente
    if (provider === "anthropic") {
      return this.callAnthropic(apiKey, model, systemPrompt, userContent);
    }

    // OpenAI-compatible (OpenAI, OpenRouter, Groq)
    const endpoint = AI_ENDPOINTS[provider];
    if (!endpoint) throw new Error(`Provedor desconhecido: ${provider}`);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };

    // OpenRouter requer header extra
    if (provider === "openrouter") {
      headers["HTTP-Referer"] = window.location.origin;
    }

    const resp = await fetch(endpoint, {
      method: "POST",
      headers,
      signal: AbortSignal.timeout(WebAdapter.AI_TIMEOUT_MS),
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    }).catch((err) => {
      if (err instanceof DOMException && err.name === "TimeoutError") {
        throw new Error(
          `Timeout: o provedor ${provider} não respondeu em 60 segundos. Tente novamente.`,
        );
      }
      if (err instanceof TypeError) {
        throw new Error(
          `Não foi possível conectar ao provedor ${provider}. ` +
            `Isso pode ser causado por bloqueio de CORS no navegador. ` +
            `Tente usar o modo manual ou a versão desktop.`,
        );
      }
      throw err;
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`Erro ${resp.status}: ${err}`);
    }

    const data = await resp.json();
    return data.choices?.[0]?.message?.content || "";
  }

  private async callAnthropic(
    apiKey: string,
    model: string,
    systemPrompt: string,
    userContent: string,
  ): Promise<string> {
    const resp = await fetch(AI_ENDPOINTS.anthropic, {
      method: "POST",
      signal: AbortSignal.timeout(WebAdapter.AI_TIMEOUT_MS),
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
      }),
    });
    if (!resp.ok) {
      throw new Error(`Anthropic ${resp.status}: ${await resp.text()}`);
    }
    const data = await resp.json();
    return data.content?.[0]?.text || "";
  }

  private async callGemini(
    apiKey: string,
    model: string,
    systemPrompt: string,
    userContent: string,
  ): Promise<string> {
    const url = `${AI_ENDPOINTS.gemini}${model}:generateContent`;
    const resp = await fetch(url, {
      method: "POST",
      signal: AbortSignal.timeout(WebAdapter.AI_TIMEOUT_MS),
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userContent }] }],
      }),
    });
    if (!resp.ok) {
      throw new Error(`Gemini ${resp.status}: ${await resp.text()}`);
    }
    const data = await resp.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  async checkOllama(): Promise<boolean> {
    // Na web, Ollama não é suportado
    return false;
  }

  // ── Storage ────────────────────────────────────────────────────────────

  async getApiKey(): Promise<string> {
    return sessionStorage.getItem("pbl_api_key") || "";
  }

  async saveApiKey(apiKey: string): Promise<void> {
    sessionStorage.setItem("pbl_api_key", apiKey);
  }

  async deleteApiKey(): Promise<void> {
    sessionStorage.removeItem("pbl_api_key");
  }

  // ── Export ─────────────────────────────────────────────────────────────

  async exportFile(
    content: string,
    format: string,
    filename: string,
  ): Promise<void> {
    // DOCX e PDF usam bibliotecas especializadas
    if (format === "docx") {
      const { exportDocx } = await import("./web-exporters");
      return exportDocx(content, filename || "pbl-adaptacao.docx");
    }
    if (format === "pdf") {
      const { exportPdf } = await import("./web-exporters");
      return exportPdf(content, filename || "pbl-adaptacao.pdf");
    }

    // TXT, MD, HTML - download via Blob
    const mime = MIME_TYPES[format] || "text/plain";
    const blob = new Blob([content], { type: mime });
    downloadBlob(blob, filename || `pbl-adaptacao.${format}`);
  }
}
