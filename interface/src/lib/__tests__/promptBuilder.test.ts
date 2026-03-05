/**
 * Testes unitários do módulo promptBuilder.
 *
 * Testa a função pura `buildPromptPayload()` que é o coração da
 * lógica de negócio do PBL - responsável por montar os prompts
 * enviados à IA com base na persona, conteúdo e configurações.
 */

import { describe, it, expect } from "vitest";
import { buildPromptPayload } from "../promptBuilder";
import type { Persona, Settings } from "../constants";

// ── Fixtures ────────────────────────────────────────────────────────────────

const mockPersona: Persona = {
  meta: {
    id: "goku",
    display_name: "Goku",
    category: "fictional",
    target_age_range: "11-14",
    tags: [],
  },
  character: { universe: "Dragon Ball", role: "Guerreiro Saiyajin" },
  prompts: {
    system_prompt: "Você é o Goku, um guerreiro Saiyajin.",
    greeting: "Ei, eu sou o Goku!",
    rewrite_instruction: "Adapte o conteúdo usando referências do universo Dragon Ball.",
  },
  pedagogy: {
    subject_adaptations: {
      math: "Use batalhas e power levels como exemplos numéricos",
      science: "Relate a conceitos de Ki e energia",
    },
    difficulty_levels: {
      simple: "Explique como se fosse para o Gohan criança",
      moderate: "Nível de treinamento na sala do tempo",
      advanced: "Complexidade de estratégia contra Jiren",
    },
  },
};

const defaultSettings: Settings = {
  mode: "manual",
  provider: "openai",
  model: "",
  ollamaModel: "llama3",
  ollamaUrl: "http://localhost:11434",
  apiKey: "",
  outputLanguage: "pt-BR",
  outputFormat: "free",
};

// ── Testes ───────────────────────────────────────────────────────────────────

describe("buildPromptPayload", () => {
  it("usa o system_prompt da persona", () => {
    const result = buildPromptPayload(
      mockPersona,
      "Conteúdo teste",
      "math",
      "simple",
      defaultSettings,
    );
    expect(result.systemPrompt).toBe("Você é o Goku, um guerreiro Saiyajin.");
  });

  it("inclui a instrução de reescrita da persona", () => {
    const result = buildPromptPayload(mockPersona, "2+2=4", "math", "simple", defaultSettings);
    expect(result.rewriteInstruction).toContain("Adapte o conteúdo usando referências");
  });

  it("inclui a adaptação da disciplina selecionada", () => {
    const result = buildPromptPayload(
      mockPersona,
      "Força = massa × aceleração",
      "math",
      "simple",
      defaultSettings,
    );
    expect(result.rewriteInstruction).toContain("Use batalhas e power levels");
  });

  it("inclui a instrução de dificuldade", () => {
    const result = buildPromptPayload(mockPersona, "Texto", "math", "advanced", defaultSettings);
    expect(result.rewriteInstruction).toContain("Complexidade de estratégia contra Jiren");
  });

  it("inclui o conteúdo original no prompt", () => {
    const content = "A mitocôndria é a organela responsável pela respiração celular.";
    const result = buildPromptPayload(mockPersona, content, "science", "simple", defaultSettings);
    expect(result.rewriteInstruction).toContain(content);
    expect(result.rewriteInstruction).toContain("CONTEÚDO ORIGINAL:");
  });

  it("usa Ollama como provider no modo offline", () => {
    const offlineSettings = { ...defaultSettings, mode: "offline" as const, ollamaModel: "phi3" };
    const result = buildPromptPayload(mockPersona, "Texto", "math", "simple", offlineSettings);
    expect(result.provider).toBe("ollama");
    expect(result.model).toBe("phi3");
  });

  it("usa o provider configurado no modo online", () => {
    const onlineSettings = {
      ...defaultSettings,
      mode: "online" as const,
      provider: "anthropic",
      model: "claude-3-opus",
    };
    const result = buildPromptPayload(mockPersona, "Texto", "math", "simple", onlineSettings);
    expect(result.provider).toBe("anthropic");
    expect(result.model).toBe("claude-3-opus");
  });

  it("usa modelo placeholder quando model é vazio", () => {
    const onlineSettings = {
      ...defaultSettings,
      mode: "online" as const,
      provider: "openai",
      model: "",
    };
    const result = buildPromptPayload(mockPersona, "Texto", "math", "simple", onlineSettings);
    expect(result.model).toBe("gpt-4o");
  });

  it("lida com persona sem pedagogy (campos opcionais)", () => {
    const barePersona: Persona = {
      meta: { id: "teste", display_name: "Teste" },
      character: { universe: "Test", role: "Tester" },
      prompts: { system_prompt: "Sys prompt", rewrite_instruction: "Rewrite" },
    };
    const result = buildPromptPayload(barePersona, "Conteúdo", "math", "simple", defaultSettings);
    expect(result.systemPrompt).toBe("Sys prompt");
    expect(result.rewriteInstruction).toContain("Rewrite");
    expect(result.rewriteInstruction).toContain("Conteúdo");
  });

  it("lida com disciplina não mapeada na persona", () => {
    const result = buildPromptPayload(mockPersona, "Texto", "art", "simple", defaultSettings);
    // Não deve conter "Adaptação para" se a disciplina não tem mapeamento
    expect(result.rewriteInstruction).not.toContain("Adaptação para");
  });
});
