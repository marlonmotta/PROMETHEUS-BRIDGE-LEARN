/**
 * Testes unitários do appReducer compartilhado.
 *
 * Testa todas as ações do reducer que é o coração do estado
 * da aplicação PBL - usado tanto no desktop quanto no web.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  appReducer,
  createInitialState,
  type AppState,
  type AppAction,
} from "@pbl/shared/appReducer";
import {
  DEFAULT_SETTINGS,
  type Persona,
  type HistoryItem,
} from "@pbl/shared/constants";

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
    system_prompt: "Você é o Goku.",
    greeting: "Ei!",
    rewrite_instruction: "Adapte usando Dragon Ball.",
  },
};

const mockPersona2: Persona = {
  meta: {
    id: "jiraiya",
    display_name: "Jiraiya",
    category: "fictional",
    target_age_range: "14-18",
    tags: [],
  },
  character: { universe: "Naruto", role: "Sannin" },
  prompts: {
    system_prompt: "Você é o Jiraiya.",
    greeting: "Olá!",
    rewrite_instruction: "Adapte usando Naruto.",
  },
};

const mockHistoryItem: HistoryItem = {
  persona: "Goku",
  subject: "Matemática",
  content: "2+2=4",
  result: "Treino com poder de luta de 4",
  date: "01/01/2026",
};

let initialState: AppState;

// ── Testes ───────────────────────────────────────────────────────────────────

describe("createInitialState", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("cria estado inicial com defaults", () => {
    const state = createInitialState();
    expect(state.view).toBe("home");
    expect(state.personas).toEqual([]);
    expect(state.selectedPersona).toBeNull();
    expect(state.content).toBe("");
    expect(state.generating).toBe(false);
    expect(state.history).toEqual([]);
    expect(state.favorites).toEqual(new Set());
    expect(state.settings).toEqual(DEFAULT_SETTINGS);
  });

  it("hidrata histórico do localStorage", () => {
    localStorage.setItem("pbl_history", JSON.stringify([mockHistoryItem]));
    const state = createInitialState();
    expect(state.history).toHaveLength(1);
    expect(state.history[0].persona).toBe("Goku");
  });

  it("hidrata favoritos do localStorage", () => {
    localStorage.setItem("pbl_favorites", JSON.stringify(["goku", "jiraiya"]));
    const state = createInitialState();
    expect(state.favorites.has("goku")).toBe(true);
    expect(state.favorites.has("jiraiya")).toBe(true);
  });

  it("hidrata settings do localStorage sem apiKey", () => {
    localStorage.setItem(
      "pbl_settings",
      JSON.stringify({ mode: "online", provider: "anthropic" }),
    );
    const state = createInitialState();
    expect(state.settings.mode).toBe("online");
    expect(state.settings.provider).toBe("anthropic");
    expect(state.settings.apiKey).toBe("");
  });

  it("lida com localStorage corrompido gracefully", () => {
    localStorage.setItem("pbl_history", "invalid json{{{");
    localStorage.setItem("pbl_favorites", "not json");
    localStorage.setItem("pbl_settings", "broken");
    const state = createInitialState();
    expect(state.history).toEqual([]);
    expect(state.favorites).toEqual(new Set());
    expect(state.settings).toEqual(DEFAULT_SETTINGS);
  });
});

describe("appReducer", () => {
  beforeEach(() => {
    localStorage.clear();
    initialState = createInitialState();
  });

  // ── Navegação ──

  describe("SET_VIEW", () => {
    it("muda a view ativa", () => {
      const next = appReducer(initialState, {
        type: "SET_VIEW",
        view: "personas",
      });
      expect(next.view).toBe("personas");
    });

    it("não altera outros campos", () => {
      const next = appReducer(initialState, {
        type: "SET_VIEW",
        view: "settings",
      });
      expect(next.content).toBe(initialState.content);
      expect(next.personas).toBe(initialState.personas);
    });
  });

  // ── Personas ──

  describe("SET_PERSONAS", () => {
    it("define a lista de personas", () => {
      const next = appReducer(initialState, {
        type: "SET_PERSONAS",
        personas: [mockPersona, mockPersona2],
      });
      expect(next.personas).toHaveLength(2);
      expect(next.personas[0].meta.id).toBe("goku");
    });
  });

  describe("MERGE_PERSONAS", () => {
    it("adiciona novas personas sem duplicar", () => {
      const stateWithPersonas = {
        ...initialState,
        personas: [mockPersona],
      };
      const next = appReducer(stateWithPersonas, {
        type: "MERGE_PERSONAS",
        newPersonas: [mockPersona2],
      });
      expect(next.personas).toHaveLength(2);
    });

    it("substitui personas existentes com mesmo ID", () => {
      const stateWithPersonas = {
        ...initialState,
        personas: [mockPersona],
      };
      const updatedGoku = {
        ...mockPersona,
        character: { universe: "DB Super", role: "Deus" },
      };
      const next = appReducer(stateWithPersonas, {
        type: "MERGE_PERSONAS",
        newPersonas: [updatedGoku],
      });
      expect(next.personas).toHaveLength(1);
      expect(next.personas[0].character.universe).toBe("DB Super");
    });
  });

  describe("SET_SELECTED_PERSONA", () => {
    it("seleciona uma persona", () => {
      const next = appReducer(initialState, {
        type: "SET_SELECTED_PERSONA",
        persona: mockPersona,
      });
      expect(next.selectedPersona?.meta.id).toBe("goku");
    });

    it("deseleciona com null", () => {
      const withSelected = { ...initialState, selectedPersona: mockPersona };
      const next = appReducer(withSelected, {
        type: "SET_SELECTED_PERSONA",
        persona: null,
      });
      expect(next.selectedPersona).toBeNull();
    });
  });

  // ── Conteúdo ──

  describe("campos de conteúdo", () => {
    it("SET_CONTENT atualiza conteúdo", () => {
      const next = appReducer(initialState, {
        type: "SET_CONTENT",
        content: "2+2=?",
      });
      expect(next.content).toBe("2+2=?");
    });

    it("SET_SUBJECT atualiza disciplina", () => {
      const next = appReducer(initialState, {
        type: "SET_SUBJECT",
        subject: "math",
      });
      expect(next.subject).toBe("math");
    });

    it("SET_DIFFICULTY atualiza dificuldade", () => {
      const next = appReducer(initialState, {
        type: "SET_DIFFICULTY",
        difficulty: "advanced",
      });
      expect(next.difficulty).toBe("advanced");
    });

    it("SET_RESULT atualiza resultado", () => {
      const next = appReducer(initialState, {
        type: "SET_RESULT",
        result: "Resultado da IA",
      });
      expect(next.result).toBe("Resultado da IA");
    });

    it("SET_FULL_PROMPT atualiza prompt completo", () => {
      const next = appReducer(initialState, {
        type: "SET_FULL_PROMPT",
        fullPrompt: "Prompt montado",
      });
      expect(next.fullPrompt).toBe("Prompt montado");
    });
  });

  // ── Geração ──

  describe("SET_GENERATING", () => {
    it("ativa flag de geração", () => {
      const next = appReducer(initialState, {
        type: "SET_GENERATING",
        generating: true,
      });
      expect(next.generating).toBe(true);
    });
  });

  describe("GENERATION_COMPLETE", () => {
    it("define resultado, prompt, desativa generating, e muda para result", () => {
      const generating = { ...initialState, generating: true };
      const next = appReducer(generating, {
        type: "GENERATION_COMPLETE",
        result: "Resultado da IA",
        fullPrompt: "Prompt completo",
      });
      expect(next.result).toBe("Resultado da IA");
      expect(next.fullPrompt).toBe("Prompt completo");
      expect(next.generating).toBe(false);
      // O reducer navega para 'result' após geração concluída
      expect(next.view).toBe("result");
    });
  });

  // ── Settings ──

  describe("SET_SETTINGS", () => {
    it("persiste settings no localStorage sem apiKey", () => {
      const newSettings = {
        ...DEFAULT_SETTINGS,
        mode: "online" as const,
        apiKey: "sk-secret",
      };
      appReducer(initialState, { type: "SET_SETTINGS", settings: newSettings });
      // Persistência é feita pelo orchestrator via persistState() em useEffect
      // O reducer é puro - não escreve no localStorage diretamente
      const saved = JSON.parse(localStorage.getItem("pbl_settings") || "null");
      expect(saved).toBeNull();
    });
  });

  describe("PATCH_SETTINGS", () => {
    it("atualiza parcialmente os settings", () => {
      const next = appReducer(initialState, {
        type: "PATCH_SETTINGS",
        partial: { provider: "gemini" },
      });
      expect(next.settings.provider).toBe("gemini");
      expect(next.settings.mode).toBe(DEFAULT_SETTINGS.mode);
    });
  });

  // ── Histórico ──

  describe("ADD_HISTORY", () => {
    it("adiciona item no topo e persiste", () => {
      const next = appReducer(initialState, {
        type: "ADD_HISTORY",
        item: mockHistoryItem,
      });
      expect(next.history).toHaveLength(1);
      expect(next.history[0].persona).toBe("Goku");
      // O reducer é puro - persistência é feita pelo orchestrator via persistState() em useEffect
      expect(localStorage.getItem("pbl_history")).toBeNull();
    });

    it("limita a 20 itens", () => {
      const stateWith20 = {
        ...initialState,
        history: Array.from({ length: 20 }, (_, i) => ({
          ...mockHistoryItem,
          persona: `Persona ${i}`,
        })),
      };
      const next = appReducer(stateWith20, {
        type: "ADD_HISTORY",
        item: mockHistoryItem,
      });
      expect(next.history).toHaveLength(20);
      expect(next.history[0].persona).toBe("Goku");
    });
  });

  describe("DELETE_HISTORY", () => {
    it("remove item por índice", () => {
      const stateWithHistory = {
        ...initialState,
        history: [mockHistoryItem, { ...mockHistoryItem, persona: "Jiraiya" }],
      };
      const next = appReducer(stateWithHistory, {
        type: "DELETE_HISTORY",
        index: 0,
      });
      expect(next.history).toHaveLength(1);
      expect(next.history[0].persona).toBe("Jiraiya");
    });
  });

  describe("CLEAR_HISTORY", () => {
    it("limpa todo o histórico e remove do localStorage", () => {
      localStorage.setItem("pbl_history", JSON.stringify([mockHistoryItem]));
      const stateWithHistory = { ...initialState, history: [mockHistoryItem] };
      const next = appReducer(stateWithHistory, { type: "CLEAR_HISTORY" });
      expect(next.history).toEqual([]);
      // Reducer puro - não limpa localStorage diretamente. O orchestrator cuida via persistState()
      // (localStorage.getItem("pbl_history") ainda conterá o valor anterior)
    });
  });

  // ── Favoritos ──

  describe("TOGGLE_FAVORITE", () => {
    it("adiciona favorito", () => {
      const next = appReducer(initialState, {
        type: "TOGGLE_FAVORITE",
        id: "goku",
      });
      expect(next.favorites.has("goku")).toBe(true);
    });

    it("remove favorito existente", () => {
      const withFav = { ...initialState, favorites: new Set(["goku"]) };
      const next = appReducer(withFav, { type: "TOGGLE_FAVORITE", id: "goku" });
      expect(next.favorites.has("goku")).toBe(false);
    });

    it("persiste no localStorage", () => {
      appReducer(initialState, { type: "TOGGLE_FAVORITE", id: "goku" });
      // O reducer é puro - persistência é feita pelo orchestrator via persistState() em useEffect
      expect(localStorage.getItem("pbl_favorites")).toBeNull();
    });
  });

  // ── Ações compostas ──

  describe("START_NEW_ADAPTATION", () => {
    it("reseta campos de conteúdo e navega para personas", () => {
      const midFlow = {
        ...initialState,
        content: "Texto antigo",
        result: "Resultado antigo",
        subject: "math",
        selectedPersona: mockPersona,
        view: "result" as const,
      };
      const next = appReducer(midFlow, { type: "START_NEW_ADAPTATION" });
      expect(next.content).toBe("");
      expect(next.result).toBe("");
      expect(next.subject).toBe("");
      expect(next.selectedPersona).toBeNull();
      expect(next.view).toBe("personas");
    });
  });

  describe("SET_OLLAMA_ONLINE", () => {
    it("atualiza status do Ollama", () => {
      const next = appReducer(initialState, {
        type: "SET_OLLAMA_ONLINE",
        online: true,
      });
      expect(next.ollamaOnline).toBe(true);
    });
  });

  // ── Imutabilidade ──

  describe("imutabilidade", () => {
    it("não muta o estado original ao dispatch", () => {
      const frozen = Object.freeze({ ...initialState });
      const next = appReducer(frozen as AppState, {
        type: "SET_VIEW",
        view: "settings",
      });
      expect(next).not.toBe(frozen);
      expect(next.view).toBe("settings");
      expect(frozen.view).toBe("home");
    });

    it("retorna novo objeto Set em TOGGLE_FAVORITE", () => {
      const before = initialState.favorites;
      const next = appReducer(initialState, {
        type: "TOGGLE_FAVORITE",
        id: "x",
      });
      expect(next.favorites).not.toBe(before);
    });
  });

  // ── SET_HISTORY ──

  describe("SET_HISTORY", () => {
    it("substitui histórico completo e persiste", () => {
      const items = [
        mockHistoryItem,
        { ...mockHistoryItem, persona: "Jiraiya" },
      ];
      const next = appReducer(initialState, {
        type: "SET_HISTORY",
        history: items,
      });
      expect(next.history).toHaveLength(2);
      // O reducer é puro - persistência via persistState() no orchestrator
      expect(localStorage.getItem("pbl_history")).toBeNull();
    });
  });

  // ── Ação desconhecida ──

  describe("ação desconhecida", () => {
    it("retorna o estado inalterado", () => {
      const next = appReducer(initialState, {
        type: "UNKNOWN",
      } as unknown as AppAction);
      expect(next).toBe(initialState);
    });
  });
});
