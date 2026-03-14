/**
 * Testes unitários do módulo shared/import.
 *
 * Testa a lógica de importação de arquivos (documentos e imagens)
 * que é compartilhada entre web e desktop.
 *
 * Princípios:
 * - Testa funções puras sem mock (isImageFile)
 * - Testa extração de texto com File mockado
 * - Testa routing de OCR por provider com fetch mockado
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isImageFile,
  extractTextFromFile,
  imageToBase64,
  extractTextFromImage,
} from "@pbl/shared/import";

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── isImageFile ──────────────────────────────────────────────────────────────

describe("isImageFile", () => {
  it("reconhece extensões de imagem válidas", () => {
    expect(isImageFile("foto.jpg")).toBe(true);
    expect(isImageFile("foto.jpeg")).toBe(true);
    expect(isImageFile("imagem.png")).toBe(true);
    expect(isImageFile("avatar.webp")).toBe(true);
    expect(isImageFile("animacao.gif")).toBe(true);
  });

  it("rejeita extensões de documento", () => {
    expect(isImageFile("aula.txt")).toBe(false);
    expect(isImageFile("plano.docx")).toBe(false);
    expect(isImageFile("resumo.pdf")).toBe(false);
    expect(isImageFile("planilha.md")).toBe(false);
  });

  it("lida com nomes sem extensão", () => {
    expect(isImageFile("semextensao")).toBe(false);
  });

  it("é case-insensitive na extensão (lowercase)", () => {
    // A implementação converte para lowercase
    expect(isImageFile("FOTO.JPG")).toBe(true);
    expect(isImageFile("Imagem.PNG")).toBe(true);
  });
});

// ─── extractTextFromFile ──────────────────────────────────────────────────────

describe("extractTextFromFile", () => {
  /** Helper: cria um File mockado com conteúdo texto */
  function mockTextFile(name: string, content: string): File {
    return new File([content], name, { type: "text/plain" });
  }

  it("extrai texto de arquivo .txt", async () => {
    const file = mockTextFile("aula.txt", "Conteúdo da aula de matemática");
    const text = await extractTextFromFile(file);
    expect(text).toBe("Conteúdo da aula de matemática");
  });

  it("extrai texto de arquivo .md", async () => {
    const file = mockTextFile("plano.md", "# Plano de Aula\n\nConteúdo...");
    const text = await extractTextFromFile(file);
    expect(text).toBe("# Plano de Aula\n\nConteúdo...");
  });

  it("rejeita formato não suportado com mensagem clara", async () => {
    const file = mockTextFile("planilha.xlsx", "dados");
    await expect(extractTextFromFile(file)).rejects.toThrow(/não suportado/i);
  });

  it("preserva encoding UTF-8 (acentos, emojis)", async () => {
    const content = "Matemática: integração ∫ e derivação ∂. Nota: 📝";
    const file = mockTextFile("aula.txt", content);
    const text = await extractTextFromFile(file);
    expect(text).toBe(content);
  });
});

// ─── imageToBase64 ───────────────────────────────────────────────────────────

describe("imageToBase64", () => {
  it("converte arquivo de imagem para data URL base64", async () => {
    const imageContent = new Uint8Array([0x89, 0x50, 0x4e, 0x47]); // PNG header
    const file = new File([imageContent], "test.png", { type: "image/png" });

    const result = await imageToBase64(file);
    expect(result).toMatch(/^data:image\/png;base64,/);
  });
});

// ─── extractTextFromImage ───────────────────────────────────────────────────

describe("extractTextFromImage", () => {
  const fakeImage = new File([new Uint8Array([0xff, 0xd8])], "prova.jpg", {
    type: "image/jpeg",
  });

  it("roteia para OpenAI Vision por padrão", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "Texto extraído da prova" } }],
      }),
    } as Response);

    const result = await extractTextFromImage(fakeImage, "openai", "sk-test", "gpt-4o");
    expect(result).toBe("Texto extraído da prova");

    // Verifica que foi para o endpoint OpenAI
    expect(fetchSpy.mock.calls[0][0]).toContain("openai.com");
  });

  it("roteia para Gemini Vision quando provider é gemini", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: "Texto via Gemini" }] } }],
      }),
    } as Response);

    const result = await extractTextFromImage(fakeImage, "gemini", "AIza-test", "gemini-2.0-flash");
    expect(result).toBe("Texto via Gemini");
    expect(fetchSpy.mock.calls[0][0]).toContain("googleapis.com");
  });

  it("roteia para Anthropic Vision quando provider é anthropic", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ text: "Texto via Claude" }],
      }),
    } as Response);

    const result = await extractTextFromImage(fakeImage, "anthropic", "sk-ant", "claude-3-5-sonnet-20241022");
    expect(result).toBe("Texto via Claude");
    expect(fetchSpy.mock.calls[0][0]).toContain("anthropic.com");
  });

  it("usa OpenRouter endpoint quando provider é openrouter", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "via OpenRouter" } }],
      }),
    } as Response);

    await extractTextFromImage(fakeImage, "openrouter", "sk-or", "gpt-4o");
    expect(fetchSpy.mock.calls[0][0]).toContain("openrouter.ai");
  });

  it("lança erro quando API retorna status não-OK", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    } as Response);

    await expect(
      extractTextFromImage(fakeImage, "openai", "bad-key", "gpt-4o"),
    ).rejects.toThrow("401");
  });

  it("lança erro quando resposta é vazia (sem texto extraído)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "" } }] }),
    } as Response);

    await expect(
      extractTextFromImage(fakeImage, "openai", "sk-test", "gpt-4o"),
    ).rejects.toThrow(/vazia/i);
  });
});
