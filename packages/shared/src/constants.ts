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
 * - Labels exibidos ao usuário em Português do Brasil
 */

/**
 * Endpoint do Cloudflare Worker para envio anônimo de logs de erro.
 * O professor clica "Enviar" e o log vira uma Issue no GitHub automaticamente.
 *
 * ⚠️ Substituir pela URL real após deploy do Worker (workers/log-reporter/).
 */
export const LOG_REPORT_ENDPOINT = "https://pbl-log-reporter.YOUR_SUBDOMAIN.workers.dev/report";

/**
 * Mapa de disciplinas disponíveis no sistema.
 * Chave = slug interno | Valor = label exibido na interface.
 *
 * Novas disciplinas devem ser adicionadas **somente aqui** -
 * todos os componentes referenciam este mapa.
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
 * Níveis de dificuldade para adaptação do conteúdo.
 * Utiliza a nomenclatura "Rank" para gamificação da experiência do aluno.
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
  openai: "gpt-5.4",
  anthropic: "claude-sonnet-4.6",
  openrouter: "anthropic/claude-sonnet-4.6",
  groq: "llama-3.3-70b-versatile",
  gemini: "gemini-2.5-flash",
};

/**
 * Modelos disponíveis agrupados por provedor.
 * Utilizado para preencher o <select> de seleção na tela de configurações.
 *
 * ⚠️ ATUALIZADO EM: 06/04/2026
 * Fonte: Documentação oficial de cada provedor + pesquisa web.
 * GPT-4o, Claude 3.5, Gemini 2.0 foram DEPRECIADOS/RETIRADOS das APIs.
 */
export const AVAILABLE_MODELS: Record<string, { id: string; name: string }[]> = {
  openai: [
    { id: "gpt-5.4", name: "GPT-5.4 (Flagship — Recomendado)" },
    { id: "gpt-5.4-mini", name: "GPT-5.4 Mini (Rápido/Barato)" },
    { id: "gpt-5.4-nano", name: "GPT-5.4 Nano (Ultra-Barato)" },
    { id: "custom_other", name: "Outro (Digitar manualmente)" },
  ],
  anthropic: [
    { id: "claude-opus-4.6", name: "Claude Opus 4.6 (Flagship — Raciocínio Forte)" },
    { id: "claude-sonnet-4.6", name: "Claude Sonnet 4.6 (Recomendado — Equilibrado)" },
    { id: "claude-haiku-4.5", name: "Claude Haiku 4.5 (Rápido/Barato)" },
    { id: "custom_other", name: "Outro (Digitar manualmente)" },
  ],
  openrouter: [
    { id: "anthropic/claude-sonnet-4.6", name: "Claude Sonnet 4.6 (Anthropic)" },
    { id: "openai/gpt-5.4", name: "GPT-5.4 (OpenAI)" },
    { id: "google/gemini-3.1-pro", name: "Gemini 3.1 Pro (Google)" },
    { id: "deepseek/deepseek-v3.2", name: "DeepSeek V3.2" },
    { id: "qwen/qwen-3.6-plus", name: "Qwen 3.6 Plus (Alibaba)" },
    { id: "custom_other", name: "Outro (Digitar manualmente)" },
  ],
  groq: [
    { id: "llama-3.3-70b-versatile", name: "LLaMA 3.3 70B Versatile (Recomendado)" },
    { id: "llama-3.1-8b-instant", name: "LLaMA 3.1 8B Instant (Ultra-Rápido)" },
    { id: "openai/gpt-oss-120b", name: "GPT-OSS 120B (Open-Weight)" },
    { id: "openai/gpt-oss-20b", name: "GPT-OSS 20B (Open-Weight/Leve)" },
    { id: "custom_other", name: "Outro (Digitar manualmente)" },
  ],
  gemini: [
    { id: "gemini-3.1-pro", name: "Gemini 3.1 Pro (Flagship — Raciocínio)" },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro (Robusto/Estável)" },
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash (Recomendado — Rápido)" },
    { id: "custom_other", name: "Outro (Digitar manualmente)" },
  ],
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
 * Formatos de saída disponíveis para o conteúdo adaptado.
 * Define a estrutura do texto gerado pela IA (prova, resumo, etc.).
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
};
