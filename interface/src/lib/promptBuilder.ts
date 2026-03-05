/**
 * @module promptBuilder
 * @description Construtor de prompts para a adaptação de conteúdo pedagógico.
 *
 * Centraliza a lógica de montagem dos prompts enviados à IA, extraindo essa
 * responsabilidade do componente `App.tsx`. Isso segue o princípio de Separação
 * de Responsabilidades (SoC) e torna a lógica de negócio isolada e testável.
 *
 * ## Por que este módulo existe?
 *
 * A construção do prompt envolve regras de negócio complexas:
 * - Seleção de adaptações por disciplina (`subject_adaptations`)
 * - Ajuste de nível de dificuldade (`difficulty_levels`)
 * - Composição ordenada do prompt final com contexto pedagógico
 *
 * Manter essa lógica inline no componente React viola SoC e dificulta
 * a escrita de testes unitários.
 */

import {
  SUBJECTS,
  MODEL_PLACEHOLDERS,
  OUTPUT_LANGUAGES,
  type Persona,
  type Settings,
} from "./constants";

/**
 * Resultado da construção do prompt, contendo todos os elementos necessários
 * para chamar o backend de IA.
 */
export interface PromptPayload {
  /** Prompt de sistema que define a identidade da persona */
  systemPrompt: string;
  /** Instrução completa contendo a adaptação e o conteúdo original */
  rewriteInstruction: string;
  /** Provedor de IA selecionado (ex: "ollama", "openai") */
  provider: string;
  /** Modelo específico do provedor (ex: "gpt-4o", "llama3") */
  model: string;
}

/**
 * Mapa de instruções de formato para o prompt da IA.
 *
 * Define como cada formato de saída deve ser estruturado. Esses
 * blocos são injetados no prompt apenas quando o formato não é "free".
 */
const FORMAT_INSTRUCTIONS: Record<string, string> = {
  exam: "Estruture a resposta como uma PROVA ESCOLAR formal, com questões numeradas, espaço para respostas e um gabarito ao final.",
  summary:
    "Estruture a resposta como um RESUMO DIDÁTICO organizado por tópicos, com destaque para conceitos-chave.",
  exercises:
    "Estruture a resposta como uma LISTA DE EXERCÍCIOS numerados, com espaço para resolução e gabarito ao final.",
  lesson_plan:
    "Estruture a resposta como um PLANO DE AULA com: objetivos, materiais, desenvolvimento da aula, atividades e avaliação.",
};

/**
 * Constrói o payload completo para invocação da IA.
 *
 * Combina a persona selecionada, o conteúdo do usuário e as configurações
 * de IA para gerar o prompt final. A ordem dos blocos no prompt é intencional:
 * instrução base → formato de saída → idioma → adaptação da disciplina →
 * nível de dificuldade → conteúdo original.
 *
 * @param persona - Persona selecionada com prompts e pedagogia
 * @param content - Conteúdo original do professor a ser adaptado
 * @param subject - Chave da disciplina (ex: "math", "history")
 * @param difficulty - Nível de dificuldade ("simple", "moderate", "advanced")
 * @param settings - Configurações globais de IA do usuário
 * @returns Payload pronto para ser enviado ao comando `invoke_ai` do Tauri
 */
export function buildPromptPayload(
  persona: Persona,
  content: string,
  subject: string,
  difficulty: string,
  settings: Settings,
): PromptPayload {
  // Busca a adaptação específica da disciplina configurada na persona
  const subjectAdaptation = persona.pedagogy?.subject_adaptations?.[subject] || "";

  // Mapeia a dificuldade para o nível correspondente na persona
  const difficultyKey =
    ({ simple: "simple", moderate: "moderate", advanced: "advanced" } as Record<string, string>)[
      difficulty
    ] || "simple";
  const difficultyInstruction = persona.pedagogy?.difficulty_levels?.[difficultyKey] || "";

  // Label legível da disciplina para inserção no prompt
  const subjectLabel = SUBJECTS[subject] || subject;

  // Instrução de formato de saída (apenas quando não é "free"/livre)
  const formatKey = settings.outputFormat || "free";
  const formatInstruction = FORMAT_INSTRUCTIONS[formatKey] || "";

  // Instrução de idioma (apenas quando não é o padrão pt-BR)
  const langKey = settings.outputLanguage || "pt-BR";
  const langLabel = OUTPUT_LANGUAGES[langKey] || langKey;
  const langInstruction = langKey !== "pt-BR" ? `\nResponda inteiramente em ${langLabel}.` : "";

  // Monta a instrução de reescrita com todos os blocos contextuais
  const rewriteInstruction = [
    persona.prompts?.rewrite_instruction || "",
    formatInstruction ? `\nFORMATO DE SAÍDA: ${formatInstruction}` : "",
    langInstruction,
    subjectAdaptation ? `\nAdaptação para ${subjectLabel}: ${subjectAdaptation}` : "",
    difficultyInstruction ? `\nNível: ${difficultyInstruction}` : "",
    `\n\nCONTEÚDO ORIGINAL:\n${content}`,
  ].join("");

  // Resolve o provedor e modelo com base no modo de IA configurado
  const provider = settings.mode === "offline" ? "ollama" : settings.provider;
  const model =
    settings.mode === "offline"
      ? settings.ollamaModel
      : settings.model || MODEL_PLACEHOLDERS[settings.provider] || "";

  return {
    systemPrompt: persona.prompts?.system_prompt || "",
    rewriteInstruction,
    provider,
    model,
  };
}
