/**
 * @module HomeView
 * @description Tela inicial (dashboard) da aplicação PBL.
 *
 * Exibe:
 * - Cards de estatísticas (personas disponíveis, adaptações salvas, modo de IA)
 * - Botão para iniciar nova adaptação
 * - Lista do histórico recente (últimas 5 adaptações)
 *
 * Esta view é o ponto de entrada do professor e deve passar rapidamente
 * as informações de contexto e oferecer acesso direto à ação principal.
 */

import { memo } from "react";
import { type HistoryItem, type Settings } from "@pbl/shared/constants";
import Icon from "@pbl/shared/components/Icon";
import { useI18n } from "@pbl/shared/i18n";

interface Props {
  /** Número total de personas disponíveis no catálogo */
  personaCount: number;
  /** Histórico completo de adaptações realizadas */
  history: HistoryItem[];
  /** Configurações globais (usada para exibir o modo de IA ativo) */
  settings: Settings;
  /** Callback para iniciar o fluxo de nova adaptação */
  onNewAdaptation: () => void;
  /** Callback para carregar uma adaptação do histórico */
  onLoadHistory: (item: HistoryItem) => void;
  /** Callback para excluir um item do histórico por índice */
  onDeleteHistory: (index: number) => void;
}

/** Labels legíveis para os modos de IA */
const AI_MODE_LABELS: Record<string, string> = {
  offline: "Ollama",
  manual: "manual",
};

export default memo(function HomeView({
  personaCount,
  history,
  settings,
  onNewAdaptation,
  onLoadHistory,
  onDeleteHistory,
}: Props) {
  const { t } = useI18n();
  const aiMode = AI_MODE_LABELS[settings.mode] || settings.provider;

  /** Dados dos cards de estatísticas com IDs estáveis para keys */
  const stats = [
    { id: "personas", value: personaCount, label: t("home.stats.personas") },
    { id: "history", value: history.length, label: t("home.stats.adaptations") },
    { id: "ai-mode", value: aiMode, label: t("home.stats.mode") },
  ];

  return (
    <section>
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-txt mb-1.5">
          {t("home.welcome")}
        </h1>
        <p className="text-sm text-txt-2">
          {t("home.subtitle")}
        </p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <div
            key={s.id}
            className="bg-bg-2 border border-border rounded p-6 flex flex-col items-center gap-2 hover:border-accent transition-colors"
          >
            <span className="text-[32px] font-bold text-accent">{s.value}</span>
            <span className="text-xs text-txt-2 text-center">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Botão de ação principal */}
      <button
        onClick={onNewAdaptation}
        className="inline-flex items-center gap-2 px-7 py-3.5 rounded-sm bg-accent text-white font-medium text-[15px] hover:bg-accent-2 transition-colors"
      >
        <Icon name="plus" size={20} />
        {t("home.newAdaptation")}
      </button>

      {/* Histórico recente */}
      {history.length > 0 && (
        <>
          <div className="text-xs text-txt-3 uppercase tracking-wider mt-7 mb-3">
            {t("home.recentHistory")}
          </div>
          <div className="flex flex-col gap-2">
            {history.slice(0, 5).map((item, i) => (
              <div
                key={`${item.date}-${item.persona}-${i}`}
                className="bg-bg-2 border border-border rounded-sm px-4 py-3.5 flex items-center justify-between gap-3 hover:border-accent hover:bg-bg-3 transition-all"
              >
                <div
                  className="cursor-pointer flex-1"
                  onClick={() => onLoadHistory(item)}
                >
                  <div className="text-sm font-medium">{item.persona}</div>
                  <div className="text-xs text-txt-2 mt-0.5">
                    {item.subject} · {item.date}
                  </div>
                </div>
                <button
                  onClick={() => onDeleteHistory(i)}
                  aria-label={`Excluir adaptação de ${item.persona}`}
                  className="text-[11px] text-danger/60 hover:text-danger transition-colors px-1.5 py-1"
                >
                  <Icon name="x" size={13} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
      {history.length === 0 && (
        <div className="mt-8 p-10 text-center text-txt-3 bg-bg-2 border border-dashed border-border rounded">
          {t("home.emptyHistory")}{" "}
          <strong>{t("home.newAdaptation")}</strong>!
        </div>
      )}
    </section>
  );
});
