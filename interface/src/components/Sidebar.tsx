/**
 * @module Sidebar
 * @description Barra lateral de navegação fixa da aplicação PBL.
 *
 * Renderiza o logo, os itens de navegação e o indicador de status do Ollama.
 * Itens condicionais (Conteúdo e Resultado) são desabilitados até que suas
 * pré-condições sejam satisfeitas (persona selecionada e resultado gerado).
 *
 * A sidebar é ocultada na impressão via classe `no-print` do CSS.
 */

import { type View } from "../lib/constants";

/**
 * Configuração dos itens de navegação.
 * Cada item mapeia para uma view e possui um ícone SVG inline.
 */
const NAV_ITEMS: { id: View; label: string; icon: string }[] = [
  {
    id: "home",
    label: "Home",
    icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  },
  {
    id: "personas",
    label: "Personas",
    icon: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 3a4 4 0 100 8 4 4 0 000-8z",
  },
  {
    id: "content",
    label: "Conteúdo",
    icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8",
  },
  { id: "result", label: "Resultado", icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z" },
  {
    id: "manager",
    label: "Gerenciador",
    icon: "M20 7h-9 M14 17H5 M17 17a3 3 0 100-6 3 3 0 000 6z M7 7a3 3 0 100-6 3 3 0 000 6z",
  },
  {
    id: "settings",
    label: "Configurações",
    icon: "M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z",
  },
];

interface Props {
  /** View atualmente ativa */
  view: View;
  /** Callback para trocar de view */
  setView: (v: View) => void;
  /** Se o Ollama está acessível localmente */
  ollamaOnline: boolean;
  /** Se há uma persona selecionada (habilita "Conteúdo") */
  hasPersona: boolean;
  /** Se há resultado gerado (habilita "Resultado") */
  hasResult: boolean;
}

export default function Sidebar({ view, setView, ollamaOnline, hasPersona, hasResult }: Props) {
  return (
    <aside
      className="w-[220px] min-w-[220px] bg-bg-2 border-r border-border flex flex-col p-5 px-3 gap-2 no-print"
      role="navigation"
      aria-label="Navegação principal"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-1 pb-5 border-b border-border mb-2">
        <img src="/app-icon.png" alt="PBL" className="w-9 h-9 rounded-full" />
        <div>
          <span className="block text-base font-bold bg-gradient-to-r from-accent to-gold bg-clip-text text-transparent tracking-wider">
            PBL
          </span>
          <span className="block text-[8px] text-txt-3 tracking-wide">
            PROMETHEUS · BRIDGE · LEARN
          </span>
        </div>
      </div>

      {/* Itens de navegação */}
      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map((item) => {
          const disabled =
            (item.id === "content" && !hasPersona) || (item.id === "result" && !hasResult);
          return (
            <button
              key={item.id}
              disabled={disabled}
              onClick={() => setView(item.id)}
              aria-current={view === item.id ? "page" : undefined}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-sm text-[13px] font-sans text-left transition-all
                ${view === item.id ? "bg-accent/15 text-accent" : "text-txt-2 hover:bg-bg-3 hover:text-txt"}
                ${disabled ? "opacity-35 cursor-not-allowed" : "cursor-pointer"}
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
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Indicador de status do Ollama */}
      <div className="flex flex-col gap-1 pt-2.5 border-t border-border mt-auto">
        <div className="flex items-center gap-2 text-[11px] text-txt-3">
          <span
            className={`w-2 h-2 rounded-full inline-block ${ollamaOnline ? "bg-ok shadow-[0_0_6px_#22c55e]" : "bg-txt-3"}`}
            aria-hidden="true"
          />
          <span>{ollamaOnline ? "Ollama Online" : "Ollama Offline"}</span>
        </div>
        <span className="text-[10px] text-txt-3/50 pl-4">v0.1.0</span>
      </div>
    </aside>
  );
}
