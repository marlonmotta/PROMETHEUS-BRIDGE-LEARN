/**
 * @module ContentView
 * @description Tela de inserção de conteúdo pedagógico para adaptação.
 *
 * O professor cola aqui o conteúdo original (prova, tarefa, texto) que
 * será recontextualizado pela IA no universo da persona selecionada.
 *
 * Campos obrigatórios para geração:
 * - Disciplina (subject)
 * - Conteúdo original (textarea)
 */

import {
  MODEL_PLACEHOLDERS,
  SUBJECTS,
  DIFFICULTIES,
  OUTPUT_FORMATS,
  OUTPUT_LANGUAGES,
  type Persona,
  type Settings,
} from "../lib/constants";

interface Props {
  /** Persona selecionada na etapa anterior */
  selectedPersona: Persona | null;
  /** Conteúdo original digitado pelo professor */
  content: string;
  /** Disciplina selecionada (slug) */
  subject: string;
  /** Nível de dificuldade selecionado */
  difficulty: string;
  /** Se a IA está processando */
  generating: boolean;
  /** Configurações globais de IA */
  settings: Settings;
  /** Callback para atualizar o conteúdo */
  onContentChange: (v: string) => void;
  /** Callback para atualizar a disciplina */
  onSubjectChange: (v: string) => void;
  /** Callback para atualizar a dificuldade */
  onDifficultyChange: (v: string) => void;
  /** Callback para atualizar configurações de saída (formato, idioma) */
  onSettingsChange: (partial: Partial<Settings>) => void;
  /** Callback para voltar à tela de seleção de persona */
  onChangePersona: () => void;
  /** Callback para iniciar a geração */
  onGenerate: () => void;
}

export default function ContentView({
  selectedPersona,
  content,
  subject,
  difficulty,
  generating,
  settings,
  onContentChange,
  onSubjectChange,
  onDifficultyChange,
  onSettingsChange,
  onChangePersona,
  onGenerate,
}: Props) {
  /** Label descritivo do modo de IA ativo para exibição ao usuário */
  const aiLabel =
    settings.mode === "offline"
      ? `Ollama (${settings.ollamaModel})`
      : settings.mode === "online"
        ? `${settings.provider} / ${settings.model || MODEL_PLACEHOLDERS[settings.provider] || ""}`
        : "Modo manual - prompt copiável";

  return (
    <section>
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-txt mb-1.5">Conteúdo para Adaptar</h1>
        <p className="text-sm text-txt-2">Cole a prova, tarefa ou material do aluno</p>
      </div>

      {/* Indicador da persona selecionada */}
      {selectedPersona && (
        <div className="flex items-center gap-2 text-[13px] text-txt-2 px-4 py-2.5 bg-accent/[0.08] border border-accent/20 rounded-sm mb-5">
          <span>Persona:</span>
          <strong className="text-txt">{selectedPersona.meta.display_name}</strong>
          <button
            onClick={onChangePersona}
            className="text-accent text-[13px] ml-1 hover:underline"
          >
            Trocar
          </button>
        </div>
      )}

      {/* Seletores de disciplina e dificuldade */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="flex flex-col gap-1.5 mb-4">
          <label className="text-xs text-txt-2 font-medium">Disciplina</label>
          <select
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            className="bg-bg-2 border border-border rounded-sm text-txt text-[13px] px-3.5 py-2.5 outline-none focus:border-accent transition-colors"
          >
            <option value="">Selecionar...</option>
            {Object.entries(SUBJECTS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5 mb-4">
          <label className="text-xs text-txt-2 font-medium">Nível de dificuldade</label>
          <select
            value={difficulty}
            onChange={(e) => onDifficultyChange(e.target.value)}
            className="bg-bg-2 border border-border rounded-sm text-txt text-[13px] px-3.5 py-2.5 outline-none focus:border-accent transition-colors"
          >
            {Object.entries(DIFFICULTIES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Seletores de formato e idioma de saída */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-txt-2 font-medium">Formato de saída</label>
          <select
            value={settings.outputFormat}
            onChange={(e) => onSettingsChange({ outputFormat: e.target.value })}
            className="bg-bg-2 border border-border rounded-sm text-txt text-[13px] px-3.5 py-2.5 outline-none focus:border-accent transition-colors"
          >
            {Object.entries(OUTPUT_FORMATS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-txt-2 font-medium">Idioma da resposta</label>
          <select
            value={settings.outputLanguage}
            onChange={(e) => onSettingsChange({ outputLanguage: e.target.value })}
            className="bg-bg-2 border border-border rounded-sm text-txt text-[13px] px-3.5 py-2.5 outline-none focus:border-accent transition-colors"
          >
            {Object.entries(OUTPUT_LANGUAGES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Área de texto para o conteúdo original */}
      <div className="flex flex-col gap-1.5 mb-5">
        <label className="text-xs text-txt-2 font-medium">Conteúdo original</label>
        <textarea
          rows={12}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Cole aqui a prova, tarefa ou conteúdo que deseja adaptar..."
          className="bg-bg-2 border border-border rounded-sm text-txt text-sm px-3.5 py-3.5 outline-none focus:border-accent transition-colors resize-y leading-relaxed"
        />
      </div>

      {/* Botão de geração */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={onGenerate}
          disabled={!content || !subject || generating}
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-sm bg-accent text-white font-medium text-[15px] hover:bg-accent-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {!generating ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Gerar Adaptação
            </>
          ) : (
            <span className="opacity-60">Gerando com IA...</span>
          )}
        </button>
        <span className="text-xs text-txt-3">Via: {aiLabel}</span>
      </div>
    </section>
  );
}
