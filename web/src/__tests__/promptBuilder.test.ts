/**
 * Testes unitários do módulo promptBuilder.
 * Portado do desktop com os mesmos cenários de teste.
 */

import { describe, it, expect } from "vitest";
import { buildPromptPayload } from "@pbl/shared/promptBuilder";
import type { Persona, Settings } from "@pbl/shared/constants";

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
    rewrite_instruction:
      "Adapte o conteúdo usando referências do universo Dragon Ball.",
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
  interfaceLanguage: "pt-BR",
};

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
    const result = buildPromptPayload(
      mockPersona,
      "2+2=4",
      "math",
      "simple",
      defaultSettings,
    );
    expect(result.rewriteInstruction).toContain(
      "Adapte o conteúdo usando referências",
    );
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
    const result = buildPromptPayload(
      mockPersona,
      "Texto",
      "math",
      "advanced",
      defaultSettings,
    );
    expect(result.rewriteInstruction).toContain(
      "Complexidade de estratégia contra Jiren",
    );
  });

  it("inclui o conteúdo original no prompt", () => {
    const content =
      "A mitocôndria é a organela responsável pela respiração celular.";
    const result = buildPromptPayload(
      mockPersona,
      content,
      "science",
      "simple",
      defaultSettings,
    );
    expect(result.rewriteInstruction).toContain(content);
    expect(result.rewriteInstruction).toContain("<CONTEUDO_ORIGINAL>");
  });

  it("usa Ollama como provider no modo offline", () => {
    const offlineSettings = {
      ...defaultSettings,
      mode: "offline" as const,
      ollamaModel: "phi3",
    };
    const result = buildPromptPayload(
      mockPersona,
      "Texto",
      "math",
      "simple",
      offlineSettings,
    );
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
    const result = buildPromptPayload(
      mockPersona,
      "Texto",
      "math",
      "simple",
      onlineSettings,
    );
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
    const result = buildPromptPayload(
      mockPersona,
      "Texto",
      "math",
      "simple",
      onlineSettings,
    );
    expect(result.model).toBe("gpt-4o");
  });

  it("lida com persona sem pedagogy (campos opcionais)", () => {
    const barePersona: Persona = {
      meta: { id: "teste", display_name: "Teste" },
      character: { universe: "Test", role: "Tester" },
      prompts: { system_prompt: "Sys prompt", rewrite_instruction: "Rewrite" },
    };
    const result = buildPromptPayload(
      barePersona,
      "Conteúdo",
      "math",
      "simple",
      defaultSettings,
    );
    expect(result.systemPrompt).toBe("Sys prompt");
    expect(result.rewriteInstruction).toContain("Rewrite");
    expect(result.rewriteInstruction).toContain("Conteúdo");
  });

  it("lida com disciplina não mapeada na persona", () => {
    const result = buildPromptPayload(
      mockPersona,
      "Texto",
      "art",
      "simple",
      defaultSettings,
    );
    expect(result.rewriteInstruction).not.toContain("Adaptação para");
  });

  // ── outputFormat ─────────────────────────────────────────────────────────────
  // Esta é a regra de negócio mais ignorada nos testes - o FORMAT_INSTRUCTIONS
  // muda completamente o que a IA vai produzir (prova, resumo, etc.)

  it("injeta instrução PROVA ESCOLAR quando outputFormat é 'exam'", () => {
    const settings: Settings = { ...defaultSettings, outputFormat: "exam" };
    const result = buildPromptPayload(mockPersona, "Conteúdo", "math", "simple", settings);

    // A regra de negócio: formato injetado como bloco específico no prompt
    expect(result.rewriteInstruction).toContain("FORMATO DE SAÍDA OBRIGATÓRIO");
    expect(result.rewriteInstruction).toContain("PROVA ESCOLAR");
  });

  it("injeta instrução RESUMO DIDÁTICO quando outputFormat é 'summary'", () => {
    const settings: Settings = { ...defaultSettings, outputFormat: "summary" };
    const result = buildPromptPayload(mockPersona, "Conteúdo", "math", "simple", settings);

    expect(result.rewriteInstruction).toContain("RESUMO DIDÁTICO");
  });

  it("injeta instrução LISTA DE EXERCÍCIOS quando outputFormat é 'exercises'", () => {
    const settings: Settings = { ...defaultSettings, outputFormat: "exercises" };
    const result = buildPromptPayload(mockPersona, "Conteúdo", "math", "simple", settings);

    expect(result.rewriteInstruction).toContain("LISTA DE EXERCÍCIOS");
  });

  it("NÃO injeta bloco de formato quando outputFormat é 'free'", () => {
    // Regra negativa crítica: 'free' não deve poluir o prompt com instruções rígidas
    const settings: Settings = { ...defaultSettings, outputFormat: "free" };
    const result = buildPromptPayload(mockPersona, "Conteúdo", "math", "simple", settings);

    expect(result.rewriteInstruction).not.toContain("FORMATO DE SAÍDA OBRIGATÓRIO");
  });

  // ── outputLanguage ────────────────────────────────────────────────────────────

  it("injeta instrução de idioma quando outputLanguage não é 'pt-BR'", () => {
    const settings: Settings = { ...defaultSettings, outputLanguage: "en" };
    const result = buildPromptPayload(mockPersona, "Content", "math", "simple", settings);

    expect(result.rewriteInstruction).toContain("Responda inteiramente em");
    // OUTPUT_LANGUAGES["en"] retorna "English" (nome nativo / autonymous)
    expect(result.rewriteInstruction).toContain("English");
  });

  it("NÃO injeta instrução de idioma quando outputLanguage é 'pt-BR' (padrão)", () => {
    // pt-BR é o default - instrução de idioma seria ruído desnecessário no prompt
    const result = buildPromptPayload(mockPersona, "Conteúdo", "math", "simple", defaultSettings);

    expect(result.rewriteInstruction).not.toContain("Responda inteiramente em");
  });

  it("combina formato E idioma corretamente no mesmo prompt", () => {
    const settings: Settings = {
      ...defaultSettings,
      outputFormat: "exam",
      outputLanguage: "es",
    };
    const result = buildPromptPayload(mockPersona, "Conteúdo", "math", "simple", settings);

    // Ambos os blocos devem estar presentes - testa a composição do prompt
    expect(result.rewriteInstruction).toContain("PROVA ESCOLAR");
    expect(result.rewriteInstruction).toContain("Responda inteiramente em");
  });

  // ── Difficulty fallback ────────────────────────────────────────────────────

  it("usa nível 'simple' como fallback para difficulty inválida", () => {
    const result = buildPromptPayload(
      mockPersona,
      "Texto",
      "math",
      "ultra-hard-invalid", // valor inválido não mapeado
      defaultSettings,
    );
    // Deve incluir a instrução do nível 'simple', não lançar erro
    expect(result.rewriteInstruction).toContain("Explique como se fosse para o Gohan criança");
  });
});
