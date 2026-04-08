/**
 * @module App
 * @description Componente raiz da aplicação PBL (PROMETHEUS · BRIDGE · LEARN).
 *
 * Usa `useReducer` com o `appReducer` compartilhado para gerenciar
 * todo o estado da aplicação via dispatch de ações tipadas.
 *
 * ## Arquitetura de Estado
 *
 * O estado é centralizado num único `useReducer`:
 * - **Navegação**: `view` - qual tela está ativa
 * - **Personas**: `personas`, `selectedPersona` - catálogo e seleção
 * - **Conteúdo**: `content`, `subject`, `difficulty` - input do professor
 * - **Resultado**: `result`, `fullPrompt`, `generating` - output da IA
 * - **Persistência**: `settings`, `history`, `favorites` - via localStorage
 * - **Conectividade**: `ollamaOnline` - status do servidor Ollama local
 *
 * ## Hooks Extraídos
 *
 * A lógica de negócio foi extraída para hooks dedicados:
 * - `useGenerate` - chamada IA + timeout + abort
 * - `useExport` - exportar conteúdo em diversos formatos
 * - `useImportFile` - importar documentos e imagens (OCR)
 */

import { useReducer, useEffect, useCallback, useRef } from "react";
import { invoke } from "./lib/tauri";
import { SUBJECTS, type Persona, type Settings, type HistoryItem } from "@pbl/shared/constants";
import { appReducer, createInitialState, persistState } from "@pbl/shared/appReducer";
import { useGenerate } from "./hooks/useGenerate";
import { useExport } from "./hooks/useExport";
import { useImportFile } from "./hooks/useImportFile";
import Sidebar from "./components/Sidebar";
import DashboardView from "@pbl/shared/components/views/DashboardView";
import HomeView from "@pbl/shared/components/views/HomeView";
import HistoryView from "@pbl/shared/components/views/HistoryView";
import ManagerView from "./components/DesktopManagerWrapper";
import SettingsView from "@pbl/shared/components/views/SettingsView";
import UpdateChecker from "./components/UpdateChecker";
import ToastContainer from "@pbl/shared/components/Toast";

export default function App() {
  const [state, dispatch] = useReducer(appReducer, undefined, createInitialState);

  const hasCheckedOnlineRef = useRef(false);

  // ── Hooks de lógica de negócio ──
  const { handleGenerate } = useGenerate({
    selectedPersona: state.selectedPersona,
    content: state.content,
    subject: state.subject,
    difficulty: state.difficulty,
    settings: state.settings,
    dispatch,
  });

  const { handleExport } = useExport();

  const { handleImportFile } = useImportFile({
    settings: state.settings,
    dispatch,
  });

  // ── Persistência de estado (settings, history, favorites) ──
  const { settings, history, favorites } = state;
  useEffect(() => {
    persistState({ settings, history, favorites });
  }, [settings, history, favorites]);

  // ── Inicialização ──
  useEffect(() => {
    invoke<Persona[]>("load_personas")
      .then((raw) => {
        if (raw && Array.isArray(raw)) {
          const personas = raw.map((p) => ({ ...p, _source: p._source || "embedded" }));
          dispatch({ type: "SET_PERSONAS", personas });
          // Auto-select first persona alphabetically
          const sorted = [...personas].sort((a, b) =>
            (a.meta?.display_name || "").localeCompare(b.meta?.display_name || ""),
          );
          if (sorted.length > 0) {
            dispatch({ type: "SET_SELECTED_PERSONA", persona: sorted[0] });
          }
        }
      })
      .catch((e) => console.error("[PBL] Falha ao carregar personas:", e));

    invoke<boolean>("check_ollama")
      .then((v) => {
        if (typeof v === "boolean") dispatch({ type: "SET_OLLAMA_ONLINE", online: v });
      })
      .catch(() => dispatch({ type: "SET_OLLAMA_ONLINE", online: false }));

    invoke<string>("get_api_key")
      .then((key) => {
        if (key) dispatch({ type: "PATCH_SETTINGS", partial: { apiKey: key } });
      })
      .catch((e) => console.error("[PBL] Falha ao carregar API key:", e));
  }, []);

  // ── Atualização online de personas (uma vez) ──
  useEffect(() => {
    if (state.personas.length === 0 || hasCheckedOnlineRef.current) return;
    hasCheckedOnlineRef.current = true;

    invoke<Persona[]>("update_personas_online")
      .then((novas) => {
        if (novas && novas.length > 0) {
          dispatch({ type: "MERGE_PERSONAS", newPersonas: novas });
        }
      })
      .catch((e) => console.error("[PBL] Falha ao atualizar personas:", e));
  }, [state.personas.length]);

  // ── Handlers ──

  const saveSettings = useCallback((s: Settings) => {
    dispatch({ type: "SET_SETTINGS", settings: s });
    if (s.apiKey !== undefined) {
      invoke("save_api_key", { apiKey: s.apiKey }).catch((e) =>
        console.error("[PBL] Falha ao salvar API key:", e),
      );
    }
    if (s.mode === "offline") {
      invoke<boolean>("check_ollama")
        .then((v) => dispatch({ type: "SET_OLLAMA_ONLINE", online: !!v }))
        .catch((e) => console.error("[PBL] Falha ao checar Ollama:", e));
    }
  }, []);

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

  return (
    <>
      <UpdateChecker />
      <ToastContainer />
      <Sidebar
        view={state.view}
        setView={(v) => dispatch({ type: "SET_VIEW", view: v })}
        ollamaOnline={state.ollamaOnline}
      />
      <main
        className={`flex-1 p-5 lg:p-10 bg-bg ${state.view === "personas" ? "xl:overflow-hidden overflow-y-auto" : "overflow-y-auto"}`}
      >
        <div className={state.view === "personas" ? "" : "max-w-[900px]"}>
          {state.view === "home" && (
            <HomeView
              personaCount={state.personas.length}
              history={state.history}
              settings={state.settings}
              onNewAdaptation={() => dispatch({ type: "SET_VIEW", view: "personas" })}
              onLoadHistory={(item) => {
                dispatch({ type: "SET_CONTENT", content: item.content });
                dispatch({ type: "SET_RESULT", result: item.result });
                dispatch({ type: "SET_VIEW", view: "personas" });
              }}
              onDeleteHistory={(i) => dispatch({ type: "DELETE_HISTORY", index: i })}
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
              avatarBase="/avatars"
              onSelectPersona={(p) => dispatch({ type: "SET_SELECTED_PERSONA", persona: p })}
              onToggleFavorite={(id) => dispatch({ type: "TOGGLE_FAVORITE", id })}
              onContentChange={(c) => dispatch({ type: "SET_CONTENT", content: c })}
              onSubjectChange={(s) => dispatch({ type: "SET_SUBJECT", subject: s })}
              onDifficultyChange={(d) => dispatch({ type: "SET_DIFFICULTY", difficulty: d })}
              onSettingsChange={(partial) => dispatch({ type: "PATCH_SETTINGS", partial })}
              onGenerate={handleGenerate}
              onSaveHistory={handleSaveHistory}
              resultSaved={!!state.result && state.history.some((h) => h.result === state.result)}
              onExport={(format) => handleExport(state.result, format)}
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
              onDeleteHistory={(i) => dispatch({ type: "DELETE_HISTORY", index: i })}
              onClearHistory={() => dispatch({ type: "CLEAR_HISTORY" })}
              onExport={handleExport}
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
                  persona: typeof p === "function" ? p(state.selectedPersona) : p,
                })
              }
            />
          )}
          {state.view === "settings" && (
            <SettingsView
              settings={state.settings}
              ollamaOnline={state.ollamaOnline}
              onSave={saveSettings}
              history={state.history}
              onDeleteHistory={(i) => dispatch({ type: "DELETE_HISTORY", index: i })}
              onClearHistory={() => dispatch({ type: "CLEAR_HISTORY" })}
              onDeleteApiKey={() => invoke("delete_api_key").catch((e) => console.error("[PBL] Falha ao limpar API key:", e))}
              onDownloadLogs={() => {
                invoke<string>("export_app_logs").then(content => {
                  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "PBL_Error_Log.txt";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }).catch(e => {
                  console.error("[PBL] Falha ao extrair log de erro:", e);
                  alert("Não foi possível gerar ou baixar o log. Detalhes:\n" + e);
                });
              }}
              /* TODO: Ativar este botão após configurar o Worker da Cloudflare
              onSendLogs={() => {
                invoke<string>("export_app_logs").then(async (logContent) => {
                  try {
                    const res = await fetch(LOG_REPORT_ENDPOINT, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        log: logContent,
                        appVersion: (globalThis as unknown as Record<string, string>).__APP_VERSION__ ?? "0.2.0",
                        platform: "Desktop",
                      }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      alert("✅ " + data.message);
                    } else {
                      alert("❌ Falha ao enviar: " + (data.error || "Erro desconhecido"));
                    }
                  } catch (err) {
                    console.error("[PBL] Falha ao enviar log:", err);
                    alert("❌ Não foi possível conectar ao servidor de suporte. Verifique sua internet e tente novamente.");
                  }
                }).catch(e => {
                  console.error("[PBL] Falha ao extrair log:", e);
                  alert("❌ Não foi possível extrair o log do aplicativo.");
                });
              }}
              */
              platform="Desktop"
            />
          )}
        </div>
      </main>
    </>
  );
}
