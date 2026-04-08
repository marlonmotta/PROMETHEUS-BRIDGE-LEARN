/**
 * @module constants
 * @description Constantes globais e definições de tipos do PBL.
 *
 * Este módulo serve como **fonte única de verdade** para todas as constantes
 * de configuração e tipos TypeScript compartilhados pela aplicação.
 *
 * ## Convenção
 * - Constantes em `UPPER_SNAKE_CASE`
 * - Tipos/Interfaces em `PascalCase`
 * - Chaves de objetos em `camelCase` ou slugs (`kebab-case` para IDs)
 * - Labels exibidos ao usuário são resolvidos via i18n
 */
import { type TranslationKey } from "./i18n/types";

/** Tipo da função de tradução (evita dependência circular com i18n) */
export type TFunction = (key: TranslationKey, params?: Record<string, string | number>) => string;

/**
 * Slugs das disciplinas disponíveis no sistema.
 * Novas disciplinas devem ser adicionadas aqui E nos arquivos i18n.
 */
export const SUBJECT_KEYS = [
  "math",
  "portuguese",
  "science",
  "physics",
  "chemistry",
  "biology",
  "history",
  "geography",
] as const;

/**
 * Retorna o mapa de disciplinas com labels traduzidos.
 * @param t - Função de tradução do i18n
 */
export function getSubjects(t: TFunction): Record<string, string> {
  const map: Record<string, string> = {};
  for (const key of SUBJECT_KEYS) {
    map[key] = t(`constants.subjects.${key}` as TranslationKey);
  }
  return map;
}

/**
 * Mapa estático de disciplinas (fallback PT-BR para uso fora de React).
 * @deprecated Use `getSubjects(t)` para labels traduzidos.
 */
export const SUBJECTS: Record<string, string> = {
  math: "Matemática",
  portuguese: "Português",
  science: "Ciências",
  physics: "Física",
  chemistry: "Química",
  biology: "Biologia",
  history: "História",
  geography: "Geografia",
};

/**
 * Slugs de dificuldade para adaptação do conteúdo.
 */
export const DIFFICULTY_KEYS = ["simple", "moderate", "advanced"] as const;

/**
 * Retorna o mapa de dificuldades com labels traduzidos.
 */
export function getDifficulties(t: TFunction): Record<string, string> {
  const map: Record<string, string> = {};
  for (const key of DIFFICULTY_KEYS) {
    map[key] = t(`constants.difficulties.${key}` as TranslationKey);
  }
  return map;
}

/**
 * Mapa estático de dificuldades (fallback PT-BR).
 * @deprecated Use `getDifficulties(t)` para labels traduzidos.
 */
export const DIFFICULTIES: Record<string, string> = {
  simple: "Rank D - Simples",
  moderate: "Rank B - Moderado",
  advanced: "Rank S - Avançado",
};

/**
 * Modelos padrão por provedor de IA.
 *
 * Usados como placeholder nos campos de configuração e como fallback
 * quando o usuário não especifica um modelo. Atualize esta lista quando
 * novos modelos forem lançados pelos provedores.
 */
export const MODEL_PLACEHOLDERS: Record<string, string> = {
  openai: "gpt-4o",
  anthropic: "claude-3-5-sonnet-20241022",
  openrouter: "openai/gpt-4o",
  groq: "llama-3.3-70b-versatile",
  gemini: "gemini-2.0-flash",
};

/**
 * Idiomas disponíveis para a resposta gerada pela IA.
 * Utilizado na tela de configurações para definir o idioma de saída.
 */
export const OUTPUT_LANGUAGES: Record<string, string> = {
  "pt-BR": "Português (BR)",
  en: "Inglês",
  es: "Espanhol",
};

/**
 * Slugs dos formatos de saída.
 */
export const FORMAT_KEYS = ["free", "exam", "summary", "exercises", "lesson_plan"] as const;

/**
 * Retorna o mapa de formatos com labels traduzidos.
 */
export function getOutputFormats(t: TFunction): Record<string, string> {
  const map: Record<string, string> = {};
  for (const key of FORMAT_KEYS) {
    map[key] = t(`constants.outputFormats.${key}` as TranslationKey);
  }
  return map;
}

/**
 * Mapa estático de formatos (fallback PT-BR).
 * @deprecated Use `getOutputFormats(t)` para labels traduzidos.
 */
export const OUTPUT_FORMATS: Record<string, string> = {
  free: "Livre (padrão)",
  exam: "Prova formatada",
  summary: "Resumo",
  exercises: "Lista de exercícios",
  lesson_plan: "Plano de aula",
};

// ─── Tipos ──────────────────────────────────────────────────────────────────

/** Identificadores das views/telas disponíveis no SPA */
export type View =
  | "home"
  | "personas"
  | "content"
  | "result"
  | "history"
  | "manager"
  | "settings";

/**
 * Estrutura de uma Persona no sistema PBL.
 *
 * Representa a identidade fictícia ou real que a IA assume para adaptar
 * o conteúdo pedagógico. Cada persona define voz, pedagogia e prompts
 * específicos para a recontextualização do material.
 */
export interface Persona {
  /** Metadados de identificação e categorização */
  meta: {
    /** Identificador único (slug, ex: "jiraiya-sensei") */
    id: string;
    /** Nome exibido na interface (ex: "Jiraiya Sensei") */
    display_name: string;
    /** Categoria: "fictional" ou "real" */
    category?: string;
    /** Faixa etária alvo (ex: "11-14") */
    target_age_range?: string;
    /** Tags para filtragem e busca (ex: ["naruto", "ninja"]) */
    tags?: string[];
  };
  /** Dados do personagem/universo */
  character: {
    /** Universo de origem (ex: "Naruto", "DC Comics") */
    universe: string;
    /** Papel/função no universo (ex: "Mestre Ninja Lendário") */
    role: string;
  };
  /** Configurações pedagógicas opcionais */
  pedagogy?: {
    /** Adaptações específicas por disciplina */
    subject_adaptations?: Record<string, string>;
    /** Instruções por nível de dificuldade */
    difficulty_levels?: Record<string, string>;
  };
  /** Prompts de IA da persona */
  prompts?: {
    /** Prompt de sistema que define a identidade da IA */
    system_prompt?: string;
    /** Saudação inicial exibida na preview */
    greeting?: string;
    /** Instrução base de reescrita do conteúdo */
    rewrite_instruction?: string;
  };
  /** Origem da persona: "embedded" (binário) ou "local" (baixada/importada) */
  _source?: string;
}

/**
 * Configurações globais da aplicação.
 *
 * Persistidas no localStorage (sem dados sensíveis) e sincronizadas
 * com o backend Tauri. A API key é mantida apenas em memória nesta
 * interface - a persistência em disco é feita via `tauri-plugin-store`
 * no módulo `secure_store.rs`, separada do localStorage.
 */
export interface Settings {
  /** Modo de operação da IA */
  mode: "offline" | "online" | "manual";
  /** Provedor de IA cloud (ex: "openai", "anthropic") */
  provider: string;
  /** Modelo específico do provedor */
  model: string;
  /** Modelo Ollama para modo offline */
  ollamaModel: string;
  /** URL do servidor Ollama */
  ollamaUrl: string;
  /** Chave de API do provedor cloud */
  apiKey: string;
  /** Idioma da resposta da IA */
  outputLanguage: string;
  /** Formato de saída do conteúdo */
  outputFormat: string;
  /** Idioma da interface do usuário (ex: "pt-BR", "en", "es") */
  interfaceLanguage: string;
}

/**
 * Item do histórico de adaptações realizadas.
 * Armazena uma snapshot do resultado para consulta posterior.
 */
export interface HistoryItem {
  /** Nome da persona utilizada */
  persona: string;
  /** Disciplina selecionada (label em PT-BR) */
  subject: string;
  /** Conteúdo original do professor */
  content: string;
  /** Resultado gerado pela IA */
  result: string;
  /** Data da geração (formato pt-BR) */
  date: string;
}

/** Número máximo de adaptações mantidas no histórico */
export const MAX_HISTORY_SIZE = 20;

/** Configurações padrão da aplicação (estado inicial / reset) */
export const DEFAULT_SETTINGS: Settings = {
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
