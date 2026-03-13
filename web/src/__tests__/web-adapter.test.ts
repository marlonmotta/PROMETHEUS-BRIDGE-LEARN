/**
 * Testes unitários do WebAdapter.
 *
 * Testa a implementação web do IAppService que substitui
 * as chamadas Tauri por APIs nativas do browser.
 *
 * Princípios aplicados:
 * - Testa comportamento (entradas/saídas), não implementação interna
 * - Mocks mínimos: apenas network (fetch) e side-effects de download
 * - Cobre o caminho feliz, erros e edge cases por grupo
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WebAdapter } from "@/lib/services/web-adapter";

let adapter: WebAdapter;

beforeEach(() => {
  adapter = new WebAdapter();
  sessionStorage.clear();
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

// ─── API Key Storage ─────────────────────────────────────────────────────────

describe("API Key Storage (sessionStorage)", () => {
  it("salva e recupera API key do sessionStorage", async () => {
    await adapter.saveApiKey("sk-test-key-123");
    const key = await adapter.getApiKey();
    expect(key).toBe("sk-test-key-123");
  });

  it("retorna string vazia quando não há key", async () => {
    const key = await adapter.getApiKey();
    expect(key).toBe("");
  });

  it("deleta a API key", async () => {
    await adapter.saveApiKey("sk-test");
    await adapter.deleteApiKey();
    const key = await adapter.getApiKey();
    expect(key).toBe("");
  });

  it("NUNCA armazena no localStorage - isolamento de segurança", async () => {
    await adapter.saveApiKey("sk-secret");
    // Regra de segurança crítica: key NÃO deve vazar para localStorage
    expect(localStorage.getItem("pbl_api_key")).toBeNull();
    expect(sessionStorage.getItem("pbl_api_key")).toBe("sk-secret");
  });

  it("mantém API key ao mudar visibilidade do documento (sessionStorage já isola por aba)", async () => {
    await adapter.saveApiKey("sk-persist-test");
    expect(sessionStorage.getItem("pbl_api_key")).toBe("sk-persist-test");

    // Simula tab indo para background
    Object.defineProperty(document, "visibilityState", {
      value: "hidden",
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));

    // Key DEVE persistir (sessionStorage já morre com a aba)
    expect(sessionStorage.getItem("pbl_api_key")).toBe("sk-persist-test");
  });
});

// ─── Personas Cache ───────────────────────────────────────────────────────────

describe("Personas Cache (localStorage)", () => {
  it("deletePersona remove apenas a persona alvo do cache", async () => {
    const personas = [
      { meta: { id: "goku" }, character: {}, prompts: {} },
      { meta: { id: "naruto" }, character: {}, prompts: {} },
    ];
    localStorage.setItem("pbl_personas_cache", JSON.stringify(personas));

    await adapter.deletePersona("goku");

    const remaining = JSON.parse(localStorage.getItem("pbl_personas_cache")!);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].meta.id).toBe("naruto"); // naruto permanece
  });

  it("deletePersona não lança erro quando cache não existe", async () => {
    await expect(adapter.deletePersona("nonexistent")).resolves.toBeUndefined();
  });

  it("addPersonaFromJson adiciona ao cache com _source='local'", async () => {
    const persona = {
      meta: { id: "custom", display_name: "Custom" },
      character: { universe: "Test", role: "Tester" },
      prompts: { system_prompt: "test" },
    };

    const result = await adapter.addPersonaFromJson(JSON.stringify(persona));

    expect(result.meta.id).toBe("custom");
    const cached = JSON.parse(localStorage.getItem("pbl_personas_cache")!);
    expect(cached[0]._source).toBe("local"); // tag de origem para UX diferenciada
  });

  it("addPersonaFromJson rejeita JSON malformado", async () => {
    await expect(adapter.addPersonaFromJson("not json{{")).rejects.toThrow();
  });

  it("addPersonaFromJson rejeita persona sem meta.id (campo obrigatório)", async () => {
    const invalid = JSON.stringify({ meta: { display_name: "Sem ID" } });
    await expect(adapter.addPersonaFromJson(invalid)).rejects.toThrow(
      /obrigatório|id/i,
    );
  });

  it("addPersonaFromJson rejeita payload acima de 100KB (proteção DoS)", async () => {
    const bigJson = JSON.stringify({
      meta: { id: "x", display_name: "X" },
      data: "a".repeat(100_001),
    });
    // Payload > 100KB deve ser rejeitado antes de qualquer parse
    await expect(adapter.addPersonaFromJson(bigJson)).rejects.toThrow(/100KB/i);
  });
});

// ─── invokeAI ─────────────────────────────────────────────────────────────────

describe("invokeAI", () => {
  const baseParams = {
    mode: "online" as const,
    provider: "openai",
    apiKey: "sk-test",
    model: "gpt-4o",
    systemPrompt: "Você é um professor.",
    userContent: "Adapte esse conteúdo.",
  };

  it("rejeita Ollama na versão web", async () => {
    await expect(
      adapter.invokeAI({ ...baseParams, mode: "offline", provider: "ollama" }),
    ).rejects.toThrow("Ollama não é suportado na versão web");
  });

  it("rejeita provedor desconhecido", async () => {
    await expect(
      adapter.invokeAI({ ...baseParams, provider: "unknown_provider" }),
    ).rejects.toThrow("Provedor desconhecido");
  });

  it("retorna resultado correto para resposta OpenAI-compatible", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "Conteúdo adaptado pela IA" } }],
      }),
    } as Response);

    const result = await adapter.invokeAI(baseParams);
    expect(result).toBe("Conteúdo adaptado pela IA");
  });

  it("lança erro útil com status HTTP quando API retorna 401", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    } as Response);

    await expect(adapter.invokeAI(baseParams)).rejects.toThrow("401");
  });

  it("detecta erro CORS e lança mensagem explicativa", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new TypeError("Failed to fetch"),
    );

    await expect(adapter.invokeAI(baseParams)).rejects.toThrow("CORS");
  });

  // ── Rate Limiting ──────────────────────────────────────────────────────────
  // Esta é a maior proteção de quota do BYOK - deve ser rigorosamente testada

  it("bloqueia segunda chamada imediata com mensagem de espera", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "ok" } }] }),
    } as Response);

    // Primeira chamada - bem sucedida
    await adapter.invokeAI(baseParams);

    // Segunda chamada imediata (0ms depois) - deve ser bloqueada
    await expect(adapter.invokeAI(baseParams)).rejects.toThrow(
      /aguarde \d+s/i,
    );
  });

  it("permite segunda chamada após cooldown de 3 segundos", async () => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "ok" } }] }),
    } as Response);

    // Primeira chamada
    const p1 = adapter.invokeAI(baseParams);
    await vi.runAllTimersAsync();
    await p1;

    // Avança 3 segundos
    vi.advanceTimersByTime(3001);

    // Segunda chamada - deve funcionar
    const p2 = adapter.invokeAI(baseParams);
    await vi.runAllTimersAsync();
    await expect(p2).resolves.toBe("ok");
  });

  it("rate limit é cross-tab - nova instância herda cooldown do localStorage", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "ok" } }] }),
    } as Response);

    // Instância 1 - consome o cooldown e grava timestamp no localStorage
    await adapter.invokeAI(baseParams);

    // Instância 2 - DEVE respeitar o cooldown do localStorage (cross-tab behavior)
    const adapter2 = new WebAdapter();
    await expect(adapter2.invokeAI(baseParams)).rejects.toThrow(/aguarde \d+s/i);
  });
});

// ─── checkOllama ──────────────────────────────────────────────────────────────

describe("checkOllama", () => {
  it("retorna false na versão web (sem suporte a Ollama local)", async () => {
    const result = await adapter.checkOllama();
    expect(result).toBe(false);
  });
});

// ─── exportFile ───────────────────────────────────────────────────────────────
// Mock mínimo: intercepta apenas o Blob para inspecionar conteúdo e MIME type
// O comportamento real de criação do Blob e chamada ao download é preservado

describe("exportFile", () => {
  let capturedBlob: Blob | undefined;

  beforeEach(() => {
    capturedBlob = undefined;
    vi.spyOn(URL, "createObjectURL").mockImplementation((blob) => {
      capturedBlob = blob as Blob;
      return "blob:fake-url";
    });
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    // Evita navegação de página sem remover o comportamento real de click
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  it("blob contém o conteúdo exato fornecido", async () => {
    const content = "# Aula de Matemática\n\nTexto do professor";
    await adapter.exportFile(content, "txt", "aula.txt");

    expect(capturedBlob).toBeDefined();
    const text = await capturedBlob!.text();
    expect(text).toBe(content);
  });

  it("usa MIME type correto para TXT", async () => {
    await adapter.exportFile("conteúdo", "txt", "arquivo.txt");
    expect(capturedBlob?.type).toContain("text/plain");
  });

  it("usa MIME type correto para Markdown", async () => {
    await adapter.exportFile("# Título", "md", "arquivo.md");
    expect(capturedBlob?.type).toContain("text/markdown");
  });

  it("usa MIME type correto para HTML", async () => {
    await adapter.exportFile("<h1>ok</h1>", "html", "arquivo.html");
    expect(capturedBlob?.type).toContain("text/html");
  });

  it("formato desconhecido usa text/plain como fallback seguro", async () => {
    await adapter.exportFile("conteúdo", "xyz", "arquivo.xyz");
    // Não deve lançar erro - fallback para text/plain
    expect(capturedBlob?.type).toContain("text/plain");
  });
});
