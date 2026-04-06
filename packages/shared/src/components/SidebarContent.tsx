/**
 * @module SidebarContent
 * @description Conteúdo interno da sidebar compartilhado entre web e desktop.
 *
 * Renderiza: logo, itens de navegação, slot de status e versão.
 * Cada plataforma envolve este componente no seu próprio <aside> com
 * layout e comportamento móvel específicos.
 */

import { memo, type ReactNode } from "react";
import { type View } from "@pbl/shared/constants";
import { useI18n } from "@pbl/shared/i18n";

/** Configuração dos itens de navegação */
const NAV_ITEMS: { id: View; labelKey: string; icon: string }[] = [
  {
    id: "home",
    labelKey: "nav.home",
    icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  },
  {
    id: "personas",
    labelKey: "nav.personas",
    icon: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 3a4 4 0 100 8 4 4 0 000-8z",
  },
  {
    id: "history",
    labelKey: "nav.history",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    id: "manager",
    labelKey: "nav.manager",
    icon: "M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z",
  },
  {
    id: "settings",
    labelKey: "nav.settings",
    icon: "M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z",
  },
];

interface Props {
  /** View ativa */
  view: View;
  /** Callback de navegação */
  onNavigate: (v: View) => void;
  /** Conteúdo extra no header do logo (ex: back link, close button) */
  headerSlot?: ReactNode;
  /** Conteúdo no rodapé (ex: Ollama indicator, "Web" badge) */
  statusSlot: ReactNode;
}

export default memo(function SidebarContent({
  view,
  onNavigate,
  headerSlot,
  statusSlot,
}: Props) {
  const { t } = useI18n();
  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2 px-1 pb-5 border-b border-border mb-2">
        {headerSlot}
        <img src="/app-icon.png" alt="PBL" className="w-9 h-9 rounded-full" />
        <div>
          <span className="block text-base font-bold bg-linear-to-r from-accent to-gold bg-clip-text text-transparent tracking-wider">
            PBL
          </span>
          <span className="block text-[8px] text-txt-3 tracking-wide">
            PROMETHEUS · BRIDGE · LEARN
          </span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            aria-current={view === item.id ? "page" : undefined}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-sm text-[13px] font-sans text-left transition-all cursor-pointer
              ${view === item.id ? "bg-accent/15 text-accent" : "text-txt-2 hover:bg-bg-3 hover:text-txt"}
            `}
          >
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
              aria-hidden="true"
            >
              <path d={item.icon} />
            </svg>
            {t(item.labelKey)}
          </button>
        ))}
      </nav>

      {/* Status + Version */}
      <div className="flex flex-col gap-1 pt-2.5 border-t border-border mt-auto">
        {statusSlot}
        <span className="text-[10px] text-txt-3/50 pl-4">
          v
          {(globalThis as unknown as Record<string, string>).__APP_VERSION__ ??
            "dev"}
        </span>
      </div>
    </>
  );
});
