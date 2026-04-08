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

import { memo } from "react";
import {
  MODEL_PLACEHOLDERS,
  OUTPUT_LANGUAGES,
  getSubjects,
  getDifficulties,
  getOutputFormats,
  type Persona,
  type Settings,
} from "@pbl/shared/constants";
import Icon from "@pbl/shared/components/Icon";
import { useI18n } from "@pbl/shared/i18n";

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
  /** Callback para importar arquivo (PDF, DOCX, TXT, MD) */
  onImportFile?: () => void;
}

export default memo(function ContentView({
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
  onImportFile,
}: Props) {
  const { t } = useI18n();
  /** Label descritivo do modo de IA ativo para exibição ao usuário */
  const aiLabel =
    settings.mode === "offline"
      ? `Ollama (${settings.ollamaModel})`
      : settings.mode === "online"
        ? `${settings.provider} / ${settings.model || MODEL_PLACEHOLDERS[settings.provider] || ""}`
        : t("content.manualMode");

  return (
    <section>
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-txt mb-1.5">
          {t("content.title")}
        </h1>
        <p className="text-sm text-txt-2">
          {t("content.subtitle")}
        </p>
      </div>

      {/* Indicador da persona selecionada */}
      {selectedPersona && (
        <div className="flex items-center gap-2 text-[13px] text-txt-2 px-4 py-2.5 bg-accent/8 border border-accent/20 rounded-sm mb-5">
          <span>{t("content.persona")}:</span>
          <strong className="text-txt">
            {selectedPersona.meta.display_name}
          </strong>
          <button
            onClick={onChangePersona}
            className="text-accent text-[13px] ml-1 hover:underline"
          >
            {t("content.changePersona")}
          </button>
        </div>
      )}

      {/* Seletores de disciplina e dificuldade */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div className="flex flex-col gap-1.5 mb-4">
          <label className="text-xs text-txt-2 font-medium">{t("content.subject")}</label>
          <select
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            className="bg-bg-2 border border-border rounded-sm text-txt text-[13px] px-3.5 py-2.5 outline-none focus:border-accent transition-colors"
          >
            <option value="">{t("content.selectSubject")}</option>
            {Object.entries(getSubjects(t)).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5 mb-4">
          <label className="text-xs text-txt-2 font-medium">
            {t("content.difficulty")}
          </label>
          <select
            value={difficulty}
            onChange={(e) => onDifficultyChange(e.target.value)}
            className="bg-bg-2 border border-border rounded-sm text-txt text-[13px] px-3.5 py-2.5 outline-none focus:border-accent transition-colors"
          >
            {Object.entries(getDifficulties(t)).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Seletores de formato e idioma de saída */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-txt-2 font-medium">
            {t("content.outputFormat")}
          </label>
          <select
            value={settings.outputFormat}
            onChange={(e) => onSettingsChange({ outputFormat: e.target.value })}
            className="bg-bg-2 border border-border rounded-sm text-txt text-[13px] px-3.5 py-2.5 outline-none focus:border-accent transition-colors"
          >
            {Object.entries(getOutputFormats(t)).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-txt-2 font-medium">
            {t("content.outputLanguage")}
          </label>
          <select
            value={settings.outputLanguage}
            onChange={(e) =>
              onSettingsChange({ outputLanguage: e.target.value })
            }
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
        <label className="text-xs text-txt-2 font-medium flex items-center gap-2">
          {t("content.originalContent")}
          {onImportFile && (
            <button
              type="button"
              onClick={onImportFile}
              className="inline-flex items-center gap-1 text-[11px] text-accent hover:text-accent-2 transition-colors font-medium"
              title={t("content.importFileTooltip")}
            >
              <Icon name="upload" size={13} />
              {t("content.importFile")}
            </button>
          )}
        </label>
        <textarea
          rows={12}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder={t("content.placeholder")}
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
              <Icon name="bolt" size={18} />
              {t("content.generateButton")}
            </>
          ) : (
            <span className="opacity-60">{t("content.generating")}</span>
          )}
        </button>
        <span className="text-xs text-txt-3">{t("content.via")}: {aiLabel}</span>
      </div>
    </section>
  );
})
