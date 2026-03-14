/**
 * Testes unitários do appReducer compartilhado - rodando no desktop.
 *
 * Verifica que o reducer do @pbl/shared funciona corretamente
 * no contexto do projeto desktop (mesma lógica, diferente runtime).
 */

import { describe, it, expect, beforeEach } from "vitest";
import { appReducer, createInitialState, type AppState } from "@pbl/shared/appReducer";
import { DEFAULT_SETTINGS, type HistoryItem } from "@pbl/shared/constants";

const mockHistoryItem: HistoryItem = {
  persona: "Goku",
  subject: "Matemática",
  content: "2+2=4",
  result: "Power level = 4",
  date: "01/01/2026",
};

let state: AppState;

beforeEach(() => {
  localStorage.clear();
  state = createInitialState();
});

describe("appReducer - navegação", () => {
  it("SET_VIEW muda a view", () => {
    const next = appReducer(state, { type: "SET_VIEW", view: "settings" });
    expect(next.view).toBe("settings");
  });

  it("START_NEW_ADAPTATION reseta e navega para personas", () => {
    const mid = { ...state, content: "test", result: "res", view: "result" as const };
    const next = appReducer(mid, { type: "START_NEW_ADAPTATION" });
    expect(next.content).toBe("");
    expect(next.result).toBe("");
    expect(next.view).toBe("personas");
    expect(next.selectedPersona).toBeNull();
  });
});

describe("appReducer - geração", () => {
  it("SET_GENERATING ativa flag", () => {
    const next = appReducer(state, { type: "SET_GENERATING", generating: true });
    expect(next.generating).toBe(true);
  });

  it("GENERATION_COMPLETE define resultado e desativa generating", () => {
    const gen = { ...state, generating: true };
    const next = appReducer(gen, {
      type: "GENERATION_COMPLETE",
      result: "Resultado",
      fullPrompt: "Prompt",
    });
    expect(next.generating).toBe(false);
    expect(next.result).toBe("Resultado");
    expect(next.view).toBe("result");
  });
});

describe("appReducer - histórico", () => {
  it("ADD_HISTORY adiciona item ao histórico", () => {
    const next = appReducer(state, { type: "ADD_HISTORY", item: mockHistoryItem });
    expect(next.history).toHaveLength(1);
    expect(next.history[0]).toEqual(mockHistoryItem);
  });

  it("DELETE_HISTORY remove por índice", () => {
    const withHistory = { ...state, history: [mockHistoryItem] };
    const next = appReducer(withHistory, { type: "DELETE_HISTORY", index: 0 });
    expect(next.history).toHaveLength(0);
  });

  it("CLEAR_HISTORY limpa tudo", () => {
    const next = appReducer({ ...state, history: [mockHistoryItem] }, { type: "CLEAR_HISTORY" });
    expect(next.history).toEqual([]);
  });
});

describe("appReducer - favoritos", () => {
  it("TOGGLE_FAVORITE adiciona e remove", () => {
    const added = appReducer(state, { type: "TOGGLE_FAVORITE", id: "goku" });
    expect(added.favorites.has("goku")).toBe(true);

    const removed = appReducer(added, { type: "TOGGLE_FAVORITE", id: "goku" });
    expect(removed.favorites.has("goku")).toBe(false);
  });
});

describe("appReducer - settings", () => {
  it("SET_SETTINGS atualiza settings no estado", () => {
    const settings = { ...DEFAULT_SETTINGS, mode: "online" as const, apiKey: "secret" };
    const next = appReducer(state, { type: "SET_SETTINGS", settings });
    expect(next.settings.mode).toBe("online");
    expect(next.settings.apiKey).toBe("secret");
  });

  it("PATCH_SETTINGS atualiza parcialmente", () => {
    const next = appReducer(state, { type: "PATCH_SETTINGS", partial: { provider: "gemini" } });
    expect(next.settings.provider).toBe("gemini");
    expect(next.settings.mode).toBe("manual");
  });
});

describe("appReducer - Ollama", () => {
  it("SET_OLLAMA_ONLINE atualiza status", () => {
    const next = appReducer(state, { type: "SET_OLLAMA_ONLINE", online: true });
    expect(next.ollamaOnline).toBe(true);
  });
});

describe("createInitialState - dados corrompidos", () => {
  it("lida com localStorage corrompido", () => {
    localStorage.setItem("pbl_history", "broken");
    localStorage.setItem("pbl_favorites", "{invalid");
    localStorage.setItem("pbl_settings", "nope");
    const s = createInitialState();
    expect(s.history).toEqual([]);
    expect(s.favorites).toEqual(new Set());
    expect(s.settings).toEqual(DEFAULT_SETTINGS);
  });
});
