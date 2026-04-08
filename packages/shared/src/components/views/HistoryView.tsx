/**
 * @module HistoryView
 * @description Exibe o histórico de todas as adaptações geradas pela IA.
 */

import { memo, useState } from "react";
import { type HistoryItem } from "@pbl/shared/constants";
import Icon from "@pbl/shared/components/Icon";
import { useI18n } from "@pbl/shared/i18n";

interface Props {
  history: HistoryItem[];
  onLoadHistory: (item: HistoryItem) => void;
  onDeleteHistory: (index: number) => void;
  onClearHistory: () => void;
  onExport?: (content: string, format: string) => void;
}

export default memo(function HistoryView({
  history,
  onLoadHistory,
  onDeleteHistory,
  onClearHistory,
  onExport,
}: Props) {
  const { t } = useI18n();
  const [confirmClear, setConfirmClear] = useState(false);

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-bg-2 border border-border flex items-center justify-center mb-4">
          <Icon name="clock" size={28} />
        </div>
        <h2 className="text-lg font-semibold text-txt mb-2">
          {t("history.empty")}
        </h2>
        <p className="text-[13px] text-txt-3 max-w-sm">
          {t("history.emptyHint")}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-txt">{t("history.title")}</h1>
        {confirmClear ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-danger">
              {t("history.clearConfirm")}
            </span>
            <button
              onClick={() => setConfirmClear(false)}
              className="text-[11px] text-txt-2 border border-border rounded px-3 py-1.5 hover:bg-bg-3 transition-colors"
            >
              {t("history.cancel")}
            </button>
            <button
              onClick={() => {
                onClearHistory();
                setConfirmClear(false);
              }}
              className="text-[11px] text-white bg-danger rounded px-3 py-1.5 hover:bg-danger/80 transition-colors"
            >
              {t("history.confirm")}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmClear(true)}
            className="text-[11px] text-danger border border-danger/30 rounded px-3 py-1.5 hover:bg-danger/10 transition-colors"
          >
            {t("history.clearAll")}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {history.map((item, i) => (
          <div
            key={`${item.date}-${i}`}
            className="bg-bg-2 border border-border rounded-lg p-5 hover:border-accent/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[14px] font-semibold text-txt">
                    {item.persona}
                  </span>
                  <span className="text-[10px] text-txt-3 bg-bg-3 px-2 py-0.5 rounded">
                    {item.subject}
                  </span>
                </div>
                <div className="text-[11px] text-txt-3">{item.date}</div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {onExport && (
                  <>
                    {["docx", "html", "md", "pdf"].map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() =>
                          onExport(item.result || item.content, fmt)
                        }
                        className="text-[9px] text-txt-3 border border-border rounded px-1.5 py-0.5 hover:border-accent hover:text-accent transition-colors uppercase"
                      >
                        {fmt}
                      </button>
                    ))}
                    <span className="w-px h-4 bg-border" />
                  </>
                )}
                <button
                  onClick={() => onLoadHistory(item)}
                  className="text-[11px] text-accent border border-accent/30 rounded px-2.5 py-1 hover:bg-accent/10 transition-colors"
                >
                  {t("history.load")}
                </button>
                <button
                  onClick={() => onDeleteHistory(i)}
                  className="text-txt-3 hover:text-danger transition-colors p-1"
                >
                  <Icon name="trash" size={14} />
                </button>
              </div>
            </div>

            <div className="text-[12px] text-txt-2 leading-relaxed bg-bg rounded border border-border px-4 py-3 min-h-[80px] max-h-[200px] overflow-y-auto whitespace-pre-wrap">
              {item.result || item.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
