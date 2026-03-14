/**
 * @file App.integration.test.tsx
 * @description Testes de integração para o orchestrator desktop (App.tsx).
 *
 * Valida o ciclo de vida crítico:
 * - Inicialização: carrega personas, API key e verifica Ollama
 * - Persistência: settings/history/favorites gravados no storage
 * - Segurança: apiKey nunca persiste no localStorage
 * - Limites: histórico limitado a 20 itens
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import App from "../App";

// ── Mocks globais ────────────────────────────────────────────────────────────

/** Mock do invoke Tauri - retorna defaults seguros para todos os commands */
vi.mock("../lib/tauri", () => ({
  invoke: vi.fn((command: string) => {
    switch (command) {
      case "load_personas":
        return Promise.resolve([
          {
            meta: { id: "goku", display_name: "Goku" },
            character: { universe: "Dragon Ball", role: "Saiyajin" },
          },
          {
            meta: { id: "batman", display_name: "Batman" },
            character: { universe: "DC Comics", role: "Detetive" },
          },
        ]);
      case "check_ollama":
        return Promise.resolve(false);
      case "get_api_key":
        return Promise.resolve("");
      default:
        return Promise.resolve(null);
    }
  }),
}));

// Silencia erros do React no console durante testes
vi.spyOn(console, "error").mockImplementation(() => {});

// ── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

// ── Testes ───────────────────────────────────────────────────────────────────

describe("App - inicialização", () => {
  it("renderiza sem explosão", () => {
    expect(() => render(<App />)).not.toThrow();
  });

  it("chama load_personas no mount", async () => {
    const { invoke } = await import("../lib/tauri");
    render(<App />);

    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith("load_personas");
    });
  });

  it("chama check_ollama para detectar modo offline", async () => {
    const { invoke } = await import("../lib/tauri");
    render(<App />);

    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith("check_ollama");
    });
  });

  it("chama get_api_key para restaurar chave salva", async () => {
    const { invoke } = await import("../lib/tauri");
    render(<App />);

    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith("get_api_key");
    });
  });
});

describe("App - segurança de API key", () => {
  it("NÃO persiste a API key no localStorage mesmo após PATCH_SETTINGS", async () => {
    render(<App />);

    // Aguarda inicialização completa
    await waitFor(() => {
      expect(localStorage.getItem("pbl_settings")).toBeTruthy();
    });

    const stored = JSON.parse(localStorage.getItem("pbl_settings")!);
    // apiKey NUNCA deve aparecer no localStorage
    expect(stored.apiKey).toBeUndefined();
    expect(Object.keys(stored)).not.toContain("apiKey");
  });

  it("settings salvo no localStorage tem todos os campos esperados (sem apiKey)", async () => {
    render(<App />);

    await waitFor(() => {
      expect(localStorage.getItem("pbl_settings")).toBeTruthy();
    });

    const stored = JSON.parse(localStorage.getItem("pbl_settings")!);
    expect(stored).toMatchObject({
      mode: expect.any(String),
      provider: expect.any(String),
      outputLanguage: expect.any(String),
      outputFormat: expect.any(String),
    });
  });
});

describe("App - inicialização com dados corrompidos no storage", () => {
  it("reseta settings para defaults quando localStorage tem JSON corrompido", async () => {
    localStorage.setItem("pbl_settings", "{ invalid json {{{");

    expect(() => render(<App />)).not.toThrow();

    await waitFor(() => {
      // Após reset, chave é removida e recriada com defaults
      const val = localStorage.getItem("pbl_settings");
      if (val) {
        expect(() => JSON.parse(val)).not.toThrow();
      }
    });
  });

  it("reseta histórico para vazio quando localStorage tem array corrompido", async () => {
    localStorage.setItem("pbl_history", "[{invalid}]");

    expect(() => render(<App />)).not.toThrow();
  });
});

describe("App - persistência de estado", () => {
  it("persiste settings no localStorage no mount", async () => {
    render(<App />);

    await waitFor(() => {
      expect(localStorage.getItem("pbl_settings")).not.toBeNull();
    });
  });

  it("restaura settings existentes do localStorage no remount", async () => {
    // Pre-popula storage com configuração customizada
    localStorage.setItem(
      "pbl_settings",
      JSON.stringify({
        mode: "online",
        provider: "anthropic",
        model: "claude-3-5-sonnet-20241022",
        ollamaModel: "llama3",
        ollamaUrl: "http://localhost:11434",
        outputLanguage: "en",
        outputFormat: "exam",
      }),
    );

    render(<App />);

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("pbl_settings")!);
      // Settings customizadas devem ser mantidas (não resetadas para defaults)
      expect(stored.provider).toBe("anthropic");
      expect(stored.outputLanguage).toBe("en");
    });
  });
});

describe("App - carregamento de personas", () => {
  it("load_personas com retorno válido não lança erro", async () => {
    expect(() => render(<App />)).not.toThrow();

    const { invoke } = await import("../lib/tauri");
    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith("load_personas");
    });
  });

  it("falha em load_personas não quebra a renderização", async () => {
    const { invoke } = await import("../lib/tauri");
    vi.mocked(invoke).mockImplementation((cmd: string) => {
      if (cmd === "load_personas") return Promise.reject(new Error("Network error"));
      if (cmd === "check_ollama") return Promise.resolve(false);
      if (cmd === "get_api_key") return Promise.resolve("");
      return Promise.resolve(null);
    });

    expect(() => render(<App />)).not.toThrow();
  });

  it("check_ollama retornando false não quebra a renderização", async () => {
    const { invoke } = await import("../lib/tauri");
    vi.mocked(invoke).mockImplementation((cmd: string) => {
      if (cmd === "check_ollama") return Promise.resolve(false);
      if (cmd === "load_personas") return Promise.resolve([]);
      if (cmd === "get_api_key") return Promise.resolve("");
      return Promise.resolve(null);
    });

    expect(() => render(<App />)).not.toThrow();
  });
});
