/**
 * @module Sidebar (Web)
 * @description Barra lateral responsiva da versão web.
 *
 * No desktop é fixa, no mobile abre como overlay com botão hamburger.
 * Envolve o SidebarContent compartilhado e adiciona mobile UX
 * (hamburger, overlay, escape, scroll lock) + back link.
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { type View } from "@pbl/shared/constants";
import SidebarContent from "@pbl/shared/components/SidebarContent";
import { useI18n } from "@pbl/shared/i18n";

interface Props {
  view: View;
  setView: (v: View) => void;
  hasPersona: boolean;
  hasResult: boolean;
}

export default function Sidebar({
  view,
  setView,
  hasPersona: _hasPersona,
  hasResult: _hasResult,
}: Props) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  function navigate(v: View) {
    setView(v);
    setOpen(false);
  }

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-full bg-bg-2 border border-border text-txt flex items-center justify-center shadow-lg hover:bg-bg-3 transition-colors cursor-pointer"
        aria-label={t("a11y.openMenu")}
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
        >
          <path d="M3 12h18 M3 6h18 M3 18h18" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          bg-bg-2 border-r border-border flex flex-col p-5 px-3 gap-2 no-print
          fixed md:sticky z-50 md:z-auto
          top-0 left-0 h-screen
          w-64 md:w-56 md:min-w-56
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        role="navigation"
        aria-label={t("a11y.mainNavigation")}
      >
        <SidebarContent
          view={view}
          onNavigate={navigate}
          headerSlot={
            <>
              <Link
                to="/"
                className="w-7 h-7 flex items-center justify-center rounded-sm text-txt-2 hover:text-accent hover:bg-accent/10 transition-colors shrink-0"
                title={t("a11y.backToHome")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 12H5 M12 19l-7-7 7-7" />
                </svg>
              </Link>
              {/* Close button (mobile only) */}
              <button
                onClick={() => setOpen(false)}
                className="md:hidden ml-auto w-8 h-8 flex items-center justify-center rounded-sm text-txt-2 hover:text-txt hover:bg-bg-3 transition-colors cursor-pointer"
                aria-label={t("a11y.closeMenu")}
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
                >
                  <path d="M18 6L6 18 M6 6l12 12" />
                </svg>
              </button>
            </>
          }
          statusSlot={
            <div className="flex items-center gap-2 text-[11px] text-txt-3">
              <span
                className="w-2 h-2 rounded-full inline-block bg-ok shadow-[0_0_6px_#22c55e]"
                aria-hidden="true"
              />
              <span>Web</span>
            </div>
          }
        />
      </aside>
    </>
  );
}
