/**
 * Testes unitários do módulo constants.
 *
 * Valida a integridade das constantes e tipos que formam a base do sistema.
 * Foco em: completude dos mapas, presença de valores default, e estrutura
 * dos tipos exportados.
 */

import { describe, it, expect } from "vitest";
import {
  SUBJECTS,
  DIFFICULTIES,
  MODEL_PLACEHOLDERS,
  OUTPUT_LANGUAGES,
  OUTPUT_FORMATS,
  DEFAULT_SETTINGS,
} from "../constants";

describe("SUBJECTS", () => {
  it("contém pelo menos 5 disciplinas", () => {
    expect(Object.keys(SUBJECTS).length).toBeGreaterThanOrEqual(5);
  });

  it("contém disciplinas essenciais", () => {
    expect(SUBJECTS).toHaveProperty("math");
    expect(SUBJECTS).toHaveProperty("science");
    expect(SUBJECTS).toHaveProperty("history");
    expect(SUBJECTS).toHaveProperty("portuguese");
  });

  it("valores são strings não vazias", () => {
    for (const [key, value] of Object.entries(SUBJECTS)) {
      expect(value, `Disciplina '${key}' está vazia`).toBeTruthy();
      expect(typeof value).toBe("string");
    }
  });
});

describe("DIFFICULTIES", () => {
  it("contém os 3 níveis esperados", () => {
    expect(DIFFICULTIES).toHaveProperty("simple");
    expect(DIFFICULTIES).toHaveProperty("moderate");
    expect(DIFFICULTIES).toHaveProperty("advanced");
  });
});

describe("MODEL_PLACEHOLDERS", () => {
  it("contém placeholders para todos os provedores", () => {
    expect(MODEL_PLACEHOLDERS).toHaveProperty("openai");
    expect(MODEL_PLACEHOLDERS).toHaveProperty("anthropic");
    expect(MODEL_PLACEHOLDERS).toHaveProperty("gemini");
    expect(MODEL_PLACEHOLDERS).toHaveProperty("openrouter");
    expect(MODEL_PLACEHOLDERS).toHaveProperty("groq");
  });
});

describe("OUTPUT_LANGUAGES", () => {
  it("contém português brasileiro como opção", () => {
    expect(Object.keys(OUTPUT_LANGUAGES)).toContain("pt-BR");
  });
});

describe("OUTPUT_FORMATS", () => {
  it("contém pelo menos 2 formatos", () => {
    expect(Object.keys(OUTPUT_FORMATS).length).toBeGreaterThanOrEqual(2);
  });
});

describe("DEFAULT_SETTINGS", () => {
  it("tem modo manual como padrão", () => {
    expect(DEFAULT_SETTINGS.mode).toBe("manual");
  });

  it("tem Ollama URL padrão", () => {
    expect(DEFAULT_SETTINGS.ollamaUrl).toBe("http://localhost:11434");
  });

  it("tem apiKey vazia por padrão", () => {
    expect(DEFAULT_SETTINGS.apiKey).toBe("");
  });

  it("tem outputLanguage pt-BR por padrão", () => {
    expect(DEFAULT_SETTINGS.outputLanguage).toBe("pt-BR");
  });
});
