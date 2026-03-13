/**
 * @integration Fluxo ponta-a-ponta: reducer + persistência + estado inicial.
 *
 * Estes testes cobrem o caminho mais crítico do PBL:
 * - O professor usa a app → gera conteúdo → resultado persiste entre sessões
 * - São testes de integração leves: testam o reducer + storage reais,
 *   sem mockar a lógica de negócio central.
 *
 * Diferença dos testes unitários do appReducer:
 * - Aqui testamos o CONTRATO entre reducer + persistState + createInitialState
 * - Lá testamos cada ação isolada
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  appReducer,
  createInitialState,
  persistState,
  type AppState,
  type AppAction,
} from "@pbl/shared/appReducer";
import { setStorage, BrowserStorage } from "@pbl/shared/storage";
import type { HistoryItem } from "@pbl/shared/constants";

// ── Helpers ───────────────────────────────────────────────────────────────────

function dispatch(state: AppState, action: AppAction): AppState {
  return appReducer(state, action);
}

function makeHistoryItem(overrides: Partial<HistoryItem> = {}): HistoryItem {
  return {
    persona: "Goku",
    subject: "Matemática",
    content: "Conteúdo original da aula",
    result: "Resultado adaptado pela IA",
    date: new Date().toLocaleDateString("pt-BR"),
    ...overrides,
  };
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
  setStorage(new BrowserStorage());
});

afterEach(() => {
  localStorage.clear();
});

// ─── Fluxo 1: Geração e persistência ─────────────────────────────────────────

describe("Fluxo: geração completa → persistência → restauração", () => {
  it("ADD_HISTORY + persistState → histórico recuperável em nova sessão", () => {
    // Arrange
    let state = createInitialState();
    expect(state.history).toHaveLength(0);

    // Act: simula o orchestrator após GENERATION_COMPLETE
    const item = makeHistoryItem({ result: "Resultado adaptado pela IA" });
    state = dispatch(state, { type: "ADD_HISTORY", item });
    persistState(state);

    // Assert: localStorage foi escrito corretamente
    const savedHistory = JSON.parse(localStorage.getItem("pbl_history")!);
    expect(savedHistory).toHaveLength(1);
    expect(savedHistory[0].persona).toBe("Goku");
    expect(savedHistory[0].result).toBe("Resultado adaptado pela IA");
  });

  it("createInitialState lê histórico persistido → nova sessão restaura dados anteriores", () => {
    // Arrange: simula sessão anterior
    const previousHistory: HistoryItem[] = [
      makeHistoryItem({ result: "Resultado da sessão anterior" }),
    ];
    localStorage.setItem("pbl_history", JSON.stringify(previousHistory));

    // Act: nova instância da app (como se o professor reabrisse o browser)
    const restoredState = createInitialState();

    // Assert
    expect(restoredState.history).toHaveLength(1);
    expect(restoredState.history[0].result).toBe("Resultado da sessão anterior");
  });

  it("histórico é limitado a 20 itens (proteção de tamanho do localStorage)", () => {
    let state = createInitialState();

    // Adiciona 25 itens
    for (let i = 0; i < 25; i++) {
      state = dispatch(state, {
        type: "ADD_HISTORY",
        item: makeHistoryItem({ result: `Resultado ${i}` }),
      });
    }

    // Assert: reducer mantém apenas os 20 mais recentes
    expect(state.history).toHaveLength(20);
    // O mais recente vem primeiro (slice after unshift)
    expect(state.history[0].result).toBe("Resultado 24");
    expect(state.history[19].result).toBe("Resultado 5");
  });

  it("DELETE_HISTORY remove item correto por índice e persiste", () => {
    let state = createInitialState();
    state = dispatch(state, { type: "ADD_HISTORY", item: makeHistoryItem({ result: "Item A" }) });
    state = dispatch(state, { type: "ADD_HISTORY", item: makeHistoryItem({ result: "Item B" }) });
    // Estado: [B, A] (mais recente primeiro)

    state = dispatch(state, { type: "DELETE_HISTORY", index: 0 }); // remove B
    persistState(state);

    const saved = JSON.parse(localStorage.getItem("pbl_history")!);
    expect(saved).toHaveLength(1);
    expect(saved[0].result).toBe("Item A");
  });

  it("CLEAR_HISTORY apaga tudo e persiste lista vazia", () => {
    let state = createInitialState();
    state = dispatch(state, { type: "ADD_HISTORY", item: makeHistoryItem() });
    state = dispatch(state, { type: "ADD_HISTORY", item: makeHistoryItem() });
    state = dispatch(state, { type: "CLEAR_HISTORY" });
    persistState(state);

    const saved = JSON.parse(localStorage.getItem("pbl_history")!);
    expect(saved).toHaveLength(0);
  });
});

// ─── Fluxo 2: Settings persistidas sem API key ────────────────────────────────

describe("Fluxo: settings → persistState → restauração sem API key", () => {
  it("persistState NUNCA grava apiKey no storage (regra de segurança crítica)", () => {
    let state = createInitialState();
    state = dispatch(state, {
      type: "SET_SETTINGS",
      settings: { ...state.settings, apiKey: "sk-super-secret-key-que-nao-deve-persistir" },
    });

    persistState(state);

    const savedSettings = JSON.parse(localStorage.getItem("pbl_settings")!);
    // Regra de segurança: apiKey é excluída antes da serialização em persistState()
    expect(savedSettings.apiKey).toBeUndefined();
    expect(savedSettings.mode).toBe("manual"); // resto persiste normalmente
  });

  it("settings customizadas sobrevivem a um reload da app", () => {
    let state = createInitialState();
    state = dispatch(state, {
      type: "PATCH_SETTINGS",
      partial: { outputFormat: "exam", outputLanguage: "en" },
    });

    persistState(state);

    // Simula reload: nova instância lê do storage
    const restored = createInitialState();
    expect(restored.settings.outputFormat).toBe("exam");
    expect(restored.settings.outputLanguage).toBe("en");
  });

  it("apiKey nunca é restaurada do storage (mesmo que corrompido a contenha)", () => {
    // Cenário: storage foi manipulado manualmente e contém apiKey
    const settingsWithKey = { mode: "manual", apiKey: "sk-leaked" };
    localStorage.setItem("pbl_settings", JSON.stringify(settingsWithKey));

    const state = createInitialState();
    // createInitialState faz merge com DEFAULT_SETTINGS e força apiKey: ""
    expect(state.settings.apiKey).toBe("");
  });
});

// ─── Fluxo 3: Favoritos ───────────────────────────────────────────────────────

describe("Fluxo: favoritos → persistState → restauração", () => {
  it("favorito marcado sobrevive à sessão", () => {
    let state = createInitialState();
    state = dispatch(state, { type: "TOGGLE_FAVORITE", id: "goku" });
    state = dispatch(state, { type: "TOGGLE_FAVORITE", id: "naruto" });

    persistState(state);

    const restored = createInitialState();
    expect(restored.favorites.has("goku")).toBe(true);
    expect(restored.favorites.has("naruto")).toBe(true);
    expect(restored.favorites.has("luffy")).toBe(false);
  });

  it("desfazer favorito (toggle duplo) remove da persistência", () => {
    let state = createInitialState();
    state = dispatch(state, { type: "TOGGLE_FAVORITE", id: "goku" });
    persistState(state);

    state = dispatch(state, { type: "TOGGLE_FAVORITE", id: "goku" }); // desfaz
    persistState(state);

    const restored = createInitialState();
    expect(restored.favorites.has("goku")).toBe(false);
  });
});

// ─── Fluxo 4: Recuperação graceful de storage corrompido ─────────────────────

describe("Fluxo: storage corrompido → graceful degradation", () => {
  it("JSON corrompido em pbl_history → app inicia com histórico vazio, sem crash", () => {
    localStorage.setItem("pbl_history", "{ invalid json [[[");

    // Não deve lançar exceção
    const state = createInitialState();
    expect(state.history).toHaveLength(0);
    // Storage corrompido é limpo para não bloquear sessões futuras
    expect(localStorage.getItem("pbl_history")).toBeNull();
  });

  it("JSON corrompido em pbl_settings → app inicia com DEFAULT_SETTINGS, sem crash", () => {
    localStorage.setItem("pbl_settings", "CORRUPTED_DATA_XYZ");

    const state = createInitialState();
    expect(state.settings.mode).toBe("manual");
    expect(state.settings.outputFormat).toBe("free");
    expect(localStorage.getItem("pbl_settings")).toBeNull();
  });

  it("JSON corrompido em pbl_favorites → app inicia com favoritos vazios, sem crash", () => {
    localStorage.setItem("pbl_favorites", "[invalid");

    const state = createInitialState();
    expect(state.favorites.size).toBe(0);
    expect(localStorage.getItem("pbl_favorites")).toBeNull();
  });
});
