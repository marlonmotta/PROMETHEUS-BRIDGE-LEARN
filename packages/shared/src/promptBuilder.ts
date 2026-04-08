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
  DIFFICULTIES,
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
  /** Modelo específico do provedor (ex: "gpt-5.4", "llama3") */
  model: string;
}

/**
 * Mapa de instruções de formato para o prompt da IA.
 *
 * Define como cada formato de saída deve ser estruturado. Esses
 * blocos são injetados no prompt apenas quando o formato não é "free".
 */
const FORMAT_INSTRUCTIONS: Record<string, string> = {
  exam: `FORMATO DE SAÍDA OBRIGATÓRIO - Formate o conteúdo adaptado como uma PROVA ESCOLAR seguindo esta estrutura:

[MATÉRIA EM MAIÚSCULO] - AVALIAÇÃO ADAPTADA

Nome: ______________________________
Professor(a): ______________________________ (deixar em branco para o professor preencher)
Turma: ____________  Data: ____/____/________
Valor: _____ pontos

[Introdução imersiva: 1-2 parágrafos curtos na voz da persona contextualizando a avaliação e motivando o aluno]

[Questões formatadas seguindo a MESMA ORDEM e ESTRUTURA do conteúdo original fornecido, adaptando apenas a linguagem ao universo da persona]

REGRAS:
- Siga a ordem e organização do conteúdo original (se tem seções, mantenha as seções; se tem numeração, mantenha)
- Adapte a linguagem ao universo da persona nos enunciados, mas o conteúdo acadêmico deve ser preciso
- Numere todas as questões sequencialmente
- Para questões de múltipla escolha, use a) b) c) d)
- Inclua espaço para respostas dissertativas (linhas em branco)
- Se o conteúdo original contiver gabarito, inclua-o ao final da prova adaptada`,

  summary: `FORMATO DE SAÍDA OBRIGATÓRIO - Formate o conteúdo adaptado como um RESUMO DIDÁTICO seguindo EXATAMENTE esta estrutura:

[MATÉRIA EM MAIÚSCULO] - RESUMO ADAPTADO

Nome: ______________________________
Professor(a): ______________________________ (deixar em branco para o professor preencher)
Turma: ____________  Data: ____/____/________

---

[Introdução imersiva: 1-2 parágrafos na voz da persona]

---

CONCEITOS-CHAVE
[Lista dos conceitos principais extraídos do conteúdo, com definição curta e destaque em negrito]

DESENVOLVIMENTO
[Conteúdo fornecido reorganizado em seções numeradas com títulos em negrito, explicado na voz da persona]

1. [Título do Tópico]
   [Explicação adaptada]

2. [Título do Tópico]
   [Explicação adaptada]

GLOSSÁRIO
[Termos técnicos do conteúdo explicados pela persona, 1 linha cada]

IMPORTANTE: Se o conteúdo original contiver gabarito ou respostas, inclua-os ao final.`,

  exercises: `FORMATO DE SAÍDA OBRIGATÓRIO - Formate o conteúdo adaptado como uma LISTA DE EXERCÍCIOS seguindo EXATAMENTE esta estrutura:

[MATÉRIA EM MAIÚSCULO] - LISTA DE EXERCÍCIOS ADAPTADA

Nome: ______________________________
Professor(a): ______________________________ (deixar em branco para o professor preencher)
Turma: ____________  Data: ____/____/________

---

[Introdução imersiva: 1-2 parágrafos na voz da persona explicando o objetivo dos exercícios]

---

NÍVEL 1 - AQUECIMENTO
[Exercícios simples de aplicação direta, numerados, com espaço para resposta]

NÍVEL 2 - DESENVOLVIMENTO
[Exercícios intermediários que combinam conceitos, numerados]

NÍVEL 3 - DESAFIO
[Exercícios avançados e abertos, numerados]

Use o conteúdo fornecido como base para criar os exercícios. Adapte a linguagem ao universo da persona nos enunciados.
IMPORTANTE: Se o conteúdo original contiver gabarito, inclua-o ao final da lista adaptada.`,

  lesson_plan: `FORMATO DE SAÍDA OBRIGATÓRIO - Formate o conteúdo adaptado como um PLANO DE AULA seguindo EXATAMENTE esta estrutura:

[MATÉRIA EM MAIÚSCULO] - PLANO DE AULA ADAPTADO

Professor(a): ______________________________ (deixar em branco para o professor preencher)
Turma: ____________  Data: ____/____/________
Duração: ____________

---

1. OBJETIVOS DE APRENDIZAGEM
   [3-5 objetivos claros e mensuráveis baseados no conteúdo fornecido]

2. RECURSOS NECESSÁRIOS
   [Lista de materiais e preparações]

3. DESENVOLVIMENTO DA AULA

   Momento 1 - Abertura (__ min)
   [Atividade de engajamento na voz da persona]

   Momento 2 - Desenvolvimento (__ min)
   [Explicação do conteúdo com a abordagem da persona]

   Momento 3 - Prática (__ min)
   [Atividade prática para os alunos]

   Momento 4 - Encerramento (__ min)
   [Revisão e fechamento na voz da persona]

4. AVALIAÇÃO
   [Como verificar se os objetivos foram alcançados]

5. OBSERVAÇÕES PARA O PROFESSOR
   [Dicas de adaptação e possíveis dificuldades]`,
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
  const subjectAdaptation =
    persona.pedagogy?.subject_adaptations?.[subject] || "";

  // Mapeia a dificuldade para o nível correspondente na persona
  const difficultyKey = difficulty in DIFFICULTIES ? difficulty : "simple";
  const difficultyInstruction =
    persona.pedagogy?.difficulty_levels?.[difficultyKey] || "";

  // Label legível da disciplina para inserção no prompt
  const subjectLabel = SUBJECTS[subject] || subject;

  // Instrução de formato de saída (apenas quando não é "free"/livre)
  const formatKey = settings.outputFormat || "free";
  const formatInstruction = FORMAT_INSTRUCTIONS[formatKey] || "";

  // Instrução de idioma (apenas quando não é o padrão pt-BR)
  const langKey = settings.outputLanguage || "pt-BR";
  const langLabel = OUTPUT_LANGUAGES[langKey] || langKey;
  const langInstruction =
    langKey !== "pt-BR" ? `\nResponda inteiramente em ${langLabel}.` : "";

  // Monta a instrução de reescrita com todos os blocos contextuais
  const rewriteInstruction = [
    persona.prompts?.rewrite_instruction || "",
    formatInstruction ? `\nFORMATO DE SAÍDA: ${formatInstruction}` : "",
    langInstruction,
    subjectAdaptation
      ? `\nAdaptação para ${subjectLabel}: ${subjectAdaptation}`
      : "",
    difficultyInstruction ? `\nNível: ${difficultyInstruction}` : "",
    `\n\n<CONTEUDO_ORIGINAL>\n${content || "[Nenhum conteúdo fornecido]"}\n</CONTEUDO_ORIGINAL>`,
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
