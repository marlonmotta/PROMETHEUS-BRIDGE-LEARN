/**
 * @module Sidebar (Desktop)
 * @description Barra lateral fixa do desktop.
 * Envolve o SidebarContent compartilhado e adiciona o indicador Ollama.
 */

import { type View } from "@pbl/shared/constants";
import SidebarContent from "@pbl/shared/components/SidebarContent";
import { useI18n } from "@pbl/shared/i18n";

interface Props {
  view: View;
  setView: (v: View) => void;
  ollamaOnline: boolean;
}

export default function Sidebar({
  view,
  setView,
  ollamaOnline,
}: Props) {
  const { t } = useI18n();

  return (
    <aside
      className="w-44 min-w-44 lg:w-56 lg:min-w-56 bg-bg-2 border-r border-border flex flex-col p-4 lg:p-5 px-2 lg:px-3 gap-2 no-print"
      role="navigation"
      aria-label={t("a11y.mainNavigation")}
    >
      <SidebarContent
        view={view}
        onNavigate={setView}
        statusSlot={
          <div className="flex items-center gap-2 text-[11px] text-txt-3">
            <span
              className={`w-2 h-2 rounded-full inline-block ${ollamaOnline ? "bg-ok shadow-[0_0_6px_#22c55e]" : "bg-txt-3"}`}
              aria-hidden="true"
            />
            <span>{ollamaOnline ? "Ollama Online" : "Ollama Offline"}</span>
          </div>
        }
      />
    </aside>
  );
}
