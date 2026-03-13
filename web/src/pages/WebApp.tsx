/**
 * @module WebApp
 * @description Orchestrator do PBL Web App (/app).
 *
 * Usa `useReducer` com o `appReducer` compartilhado para gerenciar
 * todo o estado da aplicação via dispatch de ações tipadas.
 * Isso elimina os 15+ useState individuais que causavam re-renders cascata.
 *
 * O `AbortController` é usado para cancelar chamadas de IA pendentes
 * quando o componente é desmontado ou quando uma nova geração é iniciada.
 *
 * @architecture
 * WebApp existe como componente separado de `interface/src/App.tsx` (desktop)
 * porque as duas plataformas compartilham toda a lógica de estado (`appReducer`,
 * `persistState`) e os componentes de UI (`ManagerView`, `SettingsView`, etc.),
 * mas diferem em **como acessam o backend**:
 *
 * - Web: `WebAdapter` - fetch direto para APIs de IA, localStorage, download via Blob
 * - Desktop: `invoke()` do Tauri - commands Rust, sistema de arquivos nativo, keytar
 *
 * O contrato entre as plataformas é a interface `IAppService` em `lib/services/types.ts`.
 * Qualquer nova feature que tocar o backend precisa implementar os dois lados.
 *
 * Ciclo de vida crítico:
 * 1. `useReducer(appReducer, createInitialState)` - monta com dados do localStorage
 * 2. `useEffect([settings, history, favorites])` → `persistState()` - persiste mudanças
 * 3. `dispatch(action)` no handler → reducer retorna novo estado → useEffect dispara
 * NUNCA chamar persistState() dentro do reducer (quebraria a pureza da função).
 */

import {
  useReducer,
  useEffect,
  useCallback,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useService } from "@/providers/useService";
import { SUBJECTS, type HistoryItem } from "@pbl/shared/constants";
import { buildPromptPayload } from "@pbl/shared/promptBuilder";
import {
  appReducer,
  createInitialState,
  persistState,
} from "@pbl/shared/appReducer";
import Sidebar from "@/components/app/Sidebar";
import HomeView from "@pbl/shared/components/views/HomeView";
import DashboardView from "@pbl/shared/components/views/DashboardView";
import HistoryView from "@pbl/shared/components/views/HistoryView";
import ManagerView from "@/components/app/WebManagerWrapper";
import SettingsView from "@pbl/shared/components/views/SettingsView";
import ToastContainer from "@pbl/shared/components/Toast";
import { useImportFile } from "@/hooks/useImportFile";

export default function WebApp() {
  const service = useService();
  const [state, dispatch] = useReducer(
    appReducer,
    undefined,
    createInitialState,
  );

  const hasCheckedOnlineRef = useRef(false);
  const mainRef = useRef<HTMLElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── Persistência de estado (settings, history, favorites) ──
  const { settings, history, favorites } = state;
  useEffect(() => {
    persistState({ settings, history, favorites } as Parameters<
      typeof persistState
    >[0]);
  }, [settings, history, favorites]);

  // ── Inicialização ──
  useEffect(() => {
    service
      .loadPersonas()
      .then((raw) => {
        if (raw && Array.isArray(raw)) {
          const personas = raw.map((p) => ({
            ...p,
            _source: p._source || "remote",
          }));
          dispatch({ type: "SET_PERSONAS", personas });
          // Auto-select first persona alphabetically (desktop parity)
          const sorted = [...personas].sort((a, b) =>
            (a.meta?.display_name || "").localeCompare(
              b.meta?.display_name || "",
            ),
          );
          if (sorted.length > 0) {
            dispatch({ type: "SET_SELECTED_PERSONA", persona: sorted[0] });
          }
        }
      })
      .catch((e) => console.warn("[PBL] Falha ao carregar personas:", e));

    service
      .getApiKey()
      .then((key) => {
        if (key) dispatch({ type: "PATCH_SETTINGS", partial: { apiKey: key } });
      })
      .catch((e) => console.warn("[PBL] Falha ao carregar API key:", e));
  }, [service]);

  // ── Atualização online de personas (uma vez) ──
  useEffect(() => {
    if (state.personas.length === 0 || hasCheckedOnlineRef.current) return;
    hasCheckedOnlineRef.current = true;
    // Na web, loadPersonas já busca do GitHub. Não precisa refazer.
  }, [state.personas.length]);

  // ── Cleanup: aborta fetch pendente ao desmontar ──
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // ── Handlers ──

  const saveSettings = useCallback(
    (s: typeof state.settings) => {
      dispatch({ type: "SET_SETTINGS", settings: s });
      if (s.apiKey !== undefined) {
        service
          .saveApiKey(s.apiKey)
          .catch((e) => console.warn("[PBL] Falha ao salvar API key:", e));
      }
    },
    [service, state],
  );

  const handleGenerate = useCallback(async () => {
    if (!state.selectedPersona || !state.content) return;

    // Cancela geração anterior se ainda estiver em andamento
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    dispatch({ type: "SET_GENERATING", generating: true });

    const payload = buildPromptPayload(
      state.selectedPersona,
      state.content,
      state.subject,
      state.difficulty,
      state.settings,
    );

    // Modo manual
    if (state.settings.mode === "manual") {
      dispatch({
        type: "GENERATION_COMPLETE",
        result: payload.rewriteInstruction,
        fullPrompt: payload.rewriteInstruction,
      });
      return;
    }

    // Modo online: chama a IA via WebAdapter
    try {
      const res = await service.invokeAI({
        mode: state.settings.mode,
        provider: payload.provider,
        apiKey: state.settings.apiKey || "",
        model: payload.model,
        systemPrompt: payload.systemPrompt,
        userContent: payload.rewriteInstruction,
      });

      // Verifica se a geração foi cancelada enquanto aguardava
      if (controller.signal.aborted) return;

      dispatch({
        type: "GENERATION_COMPLETE",
        result: res,
        fullPrompt: payload.rewriteInstruction,
      });
    } catch (e) {
      if (controller.signal.aborted) return;
      dispatch({
        type: "GENERATION_COMPLETE",
        result: `Erro ao chamar IA: ${e}\n\nUse o prompt abaixo manualmente:\n\n${payload.rewriteInstruction}`,
        fullPrompt: payload.rewriteInstruction,
      });
    }
  }, [
    state.selectedPersona,
    state.content,
    state.subject,
    state.difficulty,
    state.settings,
    service,
  ]);

  const handleSaveHistory = useCallback(() => {
    const now = new Date();
    const item: HistoryItem = {
      persona: state.selectedPersona?.meta?.display_name || "",
      subject: SUBJECTS[state.subject] || state.subject,
      content: state.content,
      result: state.result,
      date:
        now.toLocaleDateString("pt-BR") +
        " às " +
        now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };
    dispatch({ type: "ADD_HISTORY", item });
  }, [state.selectedPersona, state.subject, state.content, state.result]);

  const { handleImportFile } = useImportFile({ settings: state.settings, dispatch });

  return (
    <>
      <ToastContainer />
      <Sidebar
        view={state.view}
        setView={(v) => dispatch({ type: "SET_VIEW", view: v })}
        hasPersona={!!state.selectedPersona}
        hasResult={!!state.result}
      />
      <main
        ref={mainRef}
        className={`flex-1 p-5 lg:p-10 bg-bg ${
          state.view === "manager"
            ? "overflow-hidden"
            : state.view === "personas"
              ? "overflow-y-auto xl:overflow-hidden"
              : "overflow-y-auto"
        }`}
      >
        <div className={state.view === "personas" ? "" : "max-w-[900px]"}>
          {state.view === "home" && (
            <HomeView
              personaCount={state.personas.length}
              history={state.history}
              settings={state.settings}
              onNewAdaptation={() =>
                dispatch({ type: "SET_VIEW", view: "personas" })
              }
              onLoadHistory={(item) => {
                dispatch({ type: "SET_CONTENT", content: item.content });
                dispatch({ type: "SET_RESULT", result: item.result });
                dispatch({ type: "SET_VIEW", view: "personas" });
              }}
              onDeleteHistory={(i) =>
                dispatch({ type: "DELETE_HISTORY", index: i })
              }
            />
          )}
          {state.view === "personas" && (
            <DashboardView
              personas={state.personas}
              selectedPersona={state.selectedPersona}
              favorites={state.favorites}
              content={state.content}
              subject={state.subject}
              difficulty={state.difficulty}
              result={state.result}
              generating={state.generating}
              settings={state.settings}
              onSelectPersona={(p) =>
                dispatch({ type: "SET_SELECTED_PERSONA", persona: p })
              }
              onToggleFavorite={(id) =>
                dispatch({ type: "TOGGLE_FAVORITE", id })
              }
              onContentChange={(c) =>
                dispatch({ type: "SET_CONTENT", content: c })
              }
              onSubjectChange={(s) =>
                dispatch({ type: "SET_SUBJECT", subject: s })
              }
              onDifficultyChange={(d) =>
                dispatch({ type: "SET_DIFFICULTY", difficulty: d })
              }
              onGenerate={handleGenerate}
              onSaveHistory={handleSaveHistory}
              resultSaved={
                !!state.result &&
                state.history.some((h) => h.result === state.result)
              }
              onExport={async (format) => {
                try {
                  await service.exportFile(
                    state.result,
                    format,
                    `adaptacao.${format}`,
                  );
                } catch (err) {
                  console.error("[PBL] Export error:", err);
                }
              }}
              onImportFile={handleImportFile}
            />
          )}
          {state.view === "history" && (
            <HistoryView
              history={state.history}
              onLoadHistory={(item) => {
                dispatch({ type: "SET_CONTENT", content: item.content });
                dispatch({ type: "SET_RESULT", result: item.result });
                dispatch({ type: "SET_VIEW", view: "personas" });
              }}
              onDeleteHistory={(i) =>
                dispatch({ type: "DELETE_HISTORY", index: i })
              }
              onClearHistory={() => dispatch({ type: "CLEAR_HISTORY" })}
              onExport={async (content, format) => {
                try {
                  await service.exportFile(
                    content,
                    format,
                    `adaptacao.${format}`,
                  );
                } catch (err) {
                  console.error("[PBL] Export error:", err);
                }
              }}
            />
          )}
          {state.view === "manager" && (
            <ManagerView
              personas={state.personas}
              setPersonas={(p) =>
                dispatch({
                  type: "SET_PERSONAS",
                  personas: typeof p === "function" ? p(state.personas) : p,
                })
              }
              selectedPersona={state.selectedPersona}
              setSelectedPersona={(p) =>
                dispatch({
                  type: "SET_SELECTED_PERSONA",
                  persona:
                    typeof p === "function" ? p(state.selectedPersona) : p,
                })
              }
            />
          )}
          {state.view === "settings" && (
            <SettingsView
              settings={state.settings}
              onSave={saveSettings}
              history={state.history}
              onDeleteHistory={(i) =>
                dispatch({ type: "DELETE_HISTORY", index: i })
              }
              onClearHistory={() => dispatch({ type: "CLEAR_HISTORY" })}
              onDeleteApiKey={() => service.deleteApiKey?.().catch((e: unknown) => console.warn("[PBL] Falha ao limpar API key:", e))}
            />
          )}
        </div>
        <ScrollToTopButton parentRef={mainRef} />
      </main>
    </>
  );
}

function ScrollToTopButton({
  parentRef,
}: {
  parentRef: RefObject<HTMLElement | null>;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = parentRef.current;
    function onScroll() {
      const mainScroll = el ? el.scrollTop : 0;
      const winScroll = window.scrollY || document.documentElement.scrollTop;
      setVisible(mainScroll > 300 || winScroll > 300);
    }
    if (el) el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (el) el.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onScroll);
    };
  }, [parentRef]);

  function scrollToTop() {
    const el = parentRef.current;
    if (el && el.scrollTop > 0) {
      el.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <button
      onClick={scrollToTop}
      aria-label="Voltar ao topo"
      className={`fixed bottom-6 right-6 z-40 w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center shadow-lg hover:bg-accent-2 transition-all duration-300 cursor-pointer ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
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
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  );
}
