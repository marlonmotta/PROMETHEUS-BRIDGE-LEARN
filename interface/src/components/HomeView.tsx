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

import { type HistoryItem, type Settings } from "../lib/constants";
import Icon from "./Icon";

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

export default function HomeView({
  personaCount,
  history,
  settings,
  onNewAdaptation,
  onLoadHistory,
  onDeleteHistory,
}: Props) {
  const aiMode = AI_MODE_LABELS[settings.mode] || settings.provider;

  /** Dados dos cards de estatísticas com IDs estáveis para keys */
  const stats = [
    { id: "personas", value: personaCount, label: "Personas disponíveis" },
    { id: "history", value: history.length, label: "Adaptações salvas" },
    { id: "ai-mode", value: aiMode, label: "Modo de IA ativo" },
  ];

  return (
    <section>
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-txt mb-1.5">Bem-vindo ao PBL</h1>
        <p className="text-sm text-txt-2">
          Adapte conteúdo pedagógico ao universo do seu aluno com IA
        </p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-3 gap-4 mb-8">
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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Nova Adaptação
      </button>

      {/* Histórico recente */}
      {history.length > 0 && (
        <>
          <div className="text-xs text-txt-3 uppercase tracking-wider mt-7 mb-3">
            Histórico recente
          </div>
          <div className="flex flex-col gap-2">
            {history.slice(0, 5).map((item, i) => (
              <div
                key={`${item.date}-${item.persona}-${i}`}
                className="bg-bg-2 border border-border rounded-sm px-4 py-3.5 flex items-center justify-between gap-3 hover:border-accent hover:bg-bg-3 transition-all"
              >
                <div className="cursor-pointer flex-1" onClick={() => onLoadHistory(item)}>
                  <div className="text-sm font-medium">{item.persona}</div>
                  <div className="text-xs text-txt-2 mt-0.5">
                    {item.subject} · {item.date}
                  </div>
                </div>
                <button
                  onClick={() => onDeleteHistory(i)}
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
          Nenhuma adaptação salva ainda. Comece clicando em <strong>Nova Adaptação</strong>!
        </div>
      )}
    </section>
  );
}
