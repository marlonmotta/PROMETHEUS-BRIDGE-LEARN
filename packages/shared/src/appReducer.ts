/**
 * @module appReducer
 * @description Reducer centralizado para o estado global do PBL.
 *
 * Substitui os 15+ useState do God Component (App.tsx / WebApp.tsx)
 * por um único useReducer com ações tipadas. Isso:
 *
 * - Elimina re-renders cascata (dispatch é estável, não muda referência)
 * - Centraliza lógica de transição de estado
 * - Permite compartilhar entre desktop e web
 *
 * A persistência é gerenciada FORA do reducer, via `persistState()`,
 * mantendo o reducer como função pura (sem side-effects).
 *
 * Os orchestrators (App.tsx / WebApp.tsx) devem chamar `persistState()`
 * em useEffects que reagem a mudanças de `settings`, `history` e `favorites`.
 *
 * @architecture
 * O padrão é análogo ao Flux/Redux mas sem biblioteca externa:
 *
 * ```
 * UI Event → dispatch(action) → appReducer(state, action) → new state
 *                                                               ↓
 *                                              useEffect([settings, history, favorites])
 *                                                               ↓
 *                                                      persistState(state)
 *                                                               ↓
 *                                                    storage.set(key, value)
 * ```
 *
 * Por que persistState fica FORA do reducer?
 * - Torna o reducer testável sem setup de storage (função pura)
 * - Evita writes desnecessários em ações que não tocam dados persistidos
 *   (ex: SET_GENERATING, SET_OLLAMA_ONLINE não precisam escrever no disco)
 * - Compatível com React StrictMode (efeitos duplos não causam dupla escrita)
 *
 * Por que `createInitialState` usa `getStorage()` e não recebe storage como arg?
 * - O orchestrator chama `setStorage()` ANTES de montar o componente
 * - O singleton garante que o storage correto está disponível sem prop drilling
 */

import type { Persona, Settings, HistoryItem, View } from "./constants";
import { DEFAULT_SETTINGS, MAX_HISTORY_SIZE } from "./constants";
import { getStorage } from "./storage";

// ─── State ──────────────────────────────────────────────────────────────────

export interface AppState {
  view: View;
  personas: Persona[];
  selectedPersona: Persona | null;
  content: string;
  subject: string;
  difficulty: string;
  result: string;
  fullPrompt: string;
  generating: boolean;
  history: HistoryItem[];
  favorites: Set<string>;
  settings: Settings;
  /** Desktop-only: Ollama connectivity */
  ollamaOnline: boolean;
}

/** Cria o estado inicial com dados do storage configurado */
export function createInitialState(): AppState {
  const storage = getStorage();
  let history: HistoryItem[] = [];
  let favorites = new Set<string>();
  let settings: Settings = DEFAULT_SETTINGS;

  try {
    const raw = storage.get("pbl_history");
    if (raw) history = JSON.parse(raw);
  } catch {
    console.warn("[PBL] Histórico corrompido - resetando para vazio");
    storage.remove("pbl_history");
  }

  try {
    const raw = storage.get("pbl_favorites");
    if (raw) favorites = new Set(JSON.parse(raw));
  } catch {
    console.warn("[PBL] Favoritos corrompidos - resetando para vazio");
    storage.remove("pbl_favorites");
  }

  try {
    const raw = storage.get("pbl_settings");
    if (raw) settings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw), apiKey: "" };
  } catch {
    console.warn("[PBL] Configurações corrompidas - resetando para padrão");
    storage.remove("pbl_settings");
  }

  return {
    view: "home",
    personas: [],
    selectedPersona: null,
    content: "",
    subject: "",
    difficulty: "simple",
    result: "",
    fullPrompt: "",
    generating: false,
    history,
    favorites,
    settings,
    ollamaOnline: false,
  };
}

// ─── Actions ────────────────────────────────────────────────────────────────

export type AppAction =
  | { type: "SET_VIEW"; view: View }
  | { type: "SET_PERSONAS"; personas: Persona[] }
  | { type: "MERGE_PERSONAS"; newPersonas: Persona[] }
  | { type: "SET_SELECTED_PERSONA"; persona: Persona | null }
  | { type: "SET_CONTENT"; content: string }
  | { type: "SET_SUBJECT"; subject: string }
  | { type: "SET_DIFFICULTY"; difficulty: string }
  | { type: "SET_RESULT"; result: string }
  | { type: "SET_FULL_PROMPT"; fullPrompt: string }
  | { type: "SET_GENERATING"; generating: boolean }
  | { type: "SET_SETTINGS"; settings: Settings }
  | { type: "PATCH_SETTINGS"; partial: Partial<Settings> }
  | { type: "SET_HISTORY"; history: HistoryItem[] }
  | { type: "ADD_HISTORY"; item: HistoryItem }
  | { type: "DELETE_HISTORY"; index: number }
  | { type: "CLEAR_HISTORY" }
  | { type: "TOGGLE_FAVORITE"; id: string }
  | { type: "SET_OLLAMA_ONLINE"; online: boolean }
  | { type: "START_NEW_ADAPTATION" }
  | { type: "GENERATION_COMPLETE"; result: string; fullPrompt: string };

// ─── Reducer (PURO - sem side-effects) ──────────────────────────────────────

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_VIEW":
      return { ...state, view: action.view };

    case "SET_PERSONAS":
      return { ...state, personas: action.personas };

    case "MERGE_PERSONAS": {
      const ids = new Set(
        action.newPersonas
          .map((p) => p.meta?.id)
          .filter((id): id is string => id !== undefined),
      );
      return {
        ...state,
        personas: [
          ...state.personas.filter((p) => !ids.has(p.meta?.id)),
          ...action.newPersonas.map((p) => ({ ...p, _source: "local" })),
        ],
      };
    }

    case "SET_SELECTED_PERSONA":
      return { ...state, selectedPersona: action.persona };

    case "SET_CONTENT":
      return { ...state, content: action.content };

    case "SET_SUBJECT":
      return { ...state, subject: action.subject };

    case "SET_DIFFICULTY":
      return { ...state, difficulty: action.difficulty };

    case "SET_RESULT":
      return { ...state, result: action.result };

    case "SET_FULL_PROMPT":
      return { ...state, fullPrompt: action.fullPrompt };

    case "SET_GENERATING":
      return { ...state, generating: action.generating };

    case "SET_SETTINGS":
      return { ...state, settings: action.settings };

    case "PATCH_SETTINGS": {
      const merged = { ...state.settings, ...action.partial };
      return { ...state, settings: merged };
    }

    case "SET_HISTORY":
      return { ...state, history: action.history };

    case "ADD_HISTORY": {
      const updated = [action.item, ...state.history].slice(0, MAX_HISTORY_SIZE);
      return { ...state, history: updated };
    }

    case "DELETE_HISTORY": {
      const filtered = state.history.filter((_, i) => i !== action.index);
      return { ...state, history: filtered };
    }

    case "CLEAR_HISTORY":
      return { ...state, history: [] };

    case "TOGGLE_FAVORITE": {
      const next = new Set(state.favorites);
      if (next.has(action.id)) next.delete(action.id);
      else next.add(action.id);
      return { ...state, favorites: next };
    }

    case "SET_OLLAMA_ONLINE":
      return { ...state, ollamaOnline: action.online };

    case "START_NEW_ADAPTATION":
      return {
        ...state,
        result: "",
        content: "",
        subject: "",
        selectedPersona: null,
        view: "personas",
      };

    case "GENERATION_COMPLETE":
      return {
        ...state,
        result: action.result,
        fullPrompt: action.fullPrompt,
        generating: false,
        view: "result",
      };

    default:
      return state;
  }
}

// ─── Persistência (chamada via useEffect nos orchestrators) ─────────────────

/**
 * Persiste settings, history e favorites no storage configurado.
 *
 * Deve ser chamado em useEffects que reagem a mudanças desses campos.
 * Isso mantém o reducer puro e compatível com StrictMode.
 */
export function persistState(state: Pick<AppState, 'settings' | 'history' | 'favorites'>): void {
  const storage = getStorage();
  try {
    const { apiKey: _, ...withoutKey } = state.settings;
    storage.set("pbl_settings", JSON.stringify(withoutKey));
  } catch (e) {
    console.error("[PBL] Falha ao persistir settings:", e);
  }
  try {
    storage.set("pbl_history", JSON.stringify(state.history));
  } catch (e) {
    console.error("[PBL] Falha ao persistir history:", e);
  }
  try {
    storage.set("pbl_favorites", JSON.stringify([...state.favorites]));
  } catch (e) {
    console.error("[PBL] Falha ao persistir favorites:", e);
  }
}
