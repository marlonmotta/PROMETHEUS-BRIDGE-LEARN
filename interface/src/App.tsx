/**
 * @module App
 * @description Componente raiz da aplicação PBL (PROMETHEUS · BRIDGE · LEARN).
 *
 * Orquestra o estado global da aplicação e a navegação entre views.
 * Cada view é renderizada condicionalmente com base no estado `view`.
 *
 * ## Arquitetura de Estado
 *
 * O estado é gerenciado via React hooks locais (sem Redux/Zustand) porque
 * a complexidade atual não justifica uma biblioteca externa de state management.
 * O estado se divide em:
 *
 * - **Navegação**: `view` - qual tela está ativa
 * - **Personas**: `personas`, `selectedPersona` - catálogo e seleção
 * - **Conteúdo**: `content`, `subject`, `difficulty` - input do professor
 * - **Resultado**: `result`, `fullPrompt`, `generating` - output da IA
 * - **Persistência**: `settings`, `history`, `favorites` - via localStorage
 * - **Conectividade**: `ollamaOnline` - status do servidor Ollama local
 *
 * ## Fluxo Principal
 *
 * 1. Home → 2. Selecionar Persona → 3. Inserir Conteúdo → 4. Gerar → 5. Resultado
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "./lib/tauri";
import {
  DEFAULT_SETTINGS,
  SUBJECTS,
  type Persona,
  type Settings,
  type HistoryItem,
  type View,
} from "./lib/constants";
import { buildPromptPayload } from "./lib/promptBuilder";
import Sidebar from "./components/Sidebar";
import HomeView from "./components/HomeView";
import PersonasView from "./components/PersonasView";
import ContentView from "./components/ContentView";
import ResultView from "./components/ResultView";
import ManagerView from "./components/ManagerView";
import SettingsView from "./components/SettingsView";
import UpdateChecker from "./components/UpdateChecker";
import ToastContainer from "./components/Toast";

export default function App() {
  // ── Estado de navegação ──
  const [view, setView] = useState<View>("home");

  // ── Estado de personas ──
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);

  // ── Estado de conteúdo e geração ──
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const [difficulty, setDifficulty] = useState("simple");
  const [result, setResult] = useState("");
  const [fullPrompt, setFullPrompt] = useState("");
  const [generating, setGenerating] = useState(false);

  // ── Estado de conectividade ──
  const [ollamaOnline, setOllamaOnline] = useState(false);

  // ── Estado persistido (localStorage) ──
  const [history, setHistory] = useState<HistoryItem[]>([]);

  /**
   * Favorites armazenadas como Set para lookup O(1).
   * Inicializadas a partir do localStorage com fallback para Set vazio.
   */
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem("pbl_favorites");
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  /**
   * Settings globais inicializadas com merge do localStorage + defaults.
   * O spread `{ ...DEFAULT_SETTINGS, ...parsed }` garante que novos campos
   * adicionados em atualizações sejam preenchidos com valores padrão.
   *
   * NOTA: A API key NÃO é carregada do localStorage - vem do secure store
   * do Tauri (ver useEffect de inicialização abaixo).
   */
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const raw = localStorage.getItem("pbl_settings");
      const parsed = raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
      return { ...parsed, apiKey: "" };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  /**
   * Flag para garantir que a atualização online de personas rode apenas uma vez.
   * Sem isso, o useEffect com `personas.length` como dependência poderia
   * entrar em loop quando novas personas são adicionadas pelo update.
   */
  const hasCheckedOnlineRef = useRef(false);

  // ── Inicialização (carrega personas, verifica Ollama, restaura histórico, API key) ──
  useEffect(() => {
    invoke<Persona[]>("load_personas")
      .then((raw) => {
        if (raw && Array.isArray(raw)) {
          setPersonas(raw.map((p) => ({ ...p, _source: p._source || "embedded" })));
        }
      })
      .catch(() => {});

    invoke<boolean>("check_ollama")
      .then((v) => {
        if (typeof v === "boolean") setOllamaOnline(v);
      })
      .catch(() => setOllamaOnline(false));

    // Carrega API key do armazenamento seguro do Tauri
    invoke<string>("get_api_key")
      .then((key) => {
        if (key) setSettings((prev) => ({ ...prev, apiKey: key }));
      })
      .catch(() => {});

    try {
      const raw = localStorage.getItem("pbl_history");
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      // Dados corrompidos no localStorage — reinicia do zero
    }
  }, []);

  /**
   * Atualização silenciosa de personas do GitHub.
   *
   * Roda uma única vez após o carregamento inicial das personas embutidas.
   * A flag `hasCheckedOnlineRef` previne re-execuções quando o estado
   * de personas muda (o que causaria loop infinito).
   */
  useEffect(() => {
    if (personas.length === 0 || hasCheckedOnlineRef.current) return;
    hasCheckedOnlineRef.current = true;

    invoke<Persona[]>("update_personas_online")
      .then((novas) => {
        if (novas && novas.length > 0) {
          const ids = new Set(novas.map((p) => p.meta?.id));
          setPersonas((prev) => [
            ...prev.filter((p) => !ids.has(p.meta?.id)),
            ...novas.map((p) => ({ ...p, _source: "local" })),
          ]);
        }
      })
      .catch(() => {
        // Falha silenciosa: atualização online é best-effort
      });
  }, [personas.length]);

  // ── Handlers de persistência ──

  /**
   * Salva settings no localStorage e API key no armazenamento seguro.
   *
   * A API key é separada do JSON de settings no localStorage para não
   * ficar exposta em plaintext. Ela é enviada ao backend Tauri que a
   * persiste via tauri-plugin-store (criptografado em disco).
   */
  const saveSettings = useCallback((s: Settings) => {
    setSettings(s);
    // Salva settings SEM a API key no localStorage
    const { apiKey: _, ...settingsWithoutKey } = s;
    localStorage.setItem("pbl_settings", JSON.stringify(settingsWithoutKey));
    // Salva API key no armazenamento seguro do Tauri
    if (s.apiKey !== undefined) {
      invoke("save_api_key", { apiKey: s.apiKey }).catch(() => {});
    }
    if (s.mode === "offline") {
      invoke<boolean>("check_ollama")
        .then(setOllamaOnline)
        .catch(() => {});
    }
  }, []);

  /** Salva o histórico de adaptações no localStorage */
  const saveHistory = useCallback((items: HistoryItem[]) => {
    setHistory(items);
    localStorage.setItem("pbl_history", JSON.stringify(items));
  }, []);

  /** Toggle de favoritos com persistência imediata */
  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem("pbl_favorites", JSON.stringify([...next]));
      return next;
    });
  }, []);

  /** Remove um item específico do histórico por índice */
  const deleteHistoryItem = useCallback((index: number) => {
    setHistory((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      localStorage.setItem("pbl_history", JSON.stringify(updated));
      return updated;
    });
  }, []);

  /** Limpa todo o histórico de adaptações */
  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem("pbl_history");
  }, []);

  /**
   * Handler de geração de conteúdo adaptado.
   *
   * Delega a construção do prompt para `promptBuilder.ts` (SoC).
   * Em modo manual, exibe o prompt para cópia. Nos demais modos,
   * invoca a IA via backend Tauri.
   */
  const handleGenerate = useCallback(async () => {
    if (!selectedPersona || !content) return;
    setGenerating(true);

    const payload = buildPromptPayload(selectedPersona, content, subject, difficulty, settings);

    setFullPrompt(payload.rewriteInstruction);

    // Modo manual: exibe o prompt para o professor copiar
    if (settings.mode === "manual") {
      setResult(payload.rewriteInstruction);
      setGenerating(false);
      setView("result");
      return;
    }

    // Modo online/offline: invoca a IA via backend
    try {
      const res = await invoke<string>("invoke_ai", {
        mode: settings.mode,
        provider: payload.provider,
        apiKey: settings.apiKey || "",
        model: payload.model,
        systemPrompt: payload.systemPrompt,
        userContent: payload.rewriteInstruction,
      });
      setResult(res);
    } catch (e) {
      setResult(
        `Erro ao chamar IA: ${e}\n\nUse o prompt abaixo manualmente:\n\n${payload.rewriteInstruction}`,
      );
    }
    setGenerating(false);
    setView("result");
  }, [selectedPersona, content, subject, difficulty, settings]);

  /** Reseta o fluxo para uma nova adaptação */
  const startNewAdaptation = useCallback(() => {
    setResult("");
    setContent("");
    setSubject("");
    setSelectedPersona(null);
    setView("personas");
  }, []);

  /** Salva a adaptação atual no histórico */
  const handleSaveHistory = useCallback(() => {
    const item: HistoryItem = {
      persona: selectedPersona?.meta?.display_name || "",
      subject: SUBJECTS[subject] || subject,
      content,
      result,
      date: new Date().toLocaleDateString("pt-BR"),
    };
    saveHistory([item, ...history].slice(0, 20));
  }, [selectedPersona, subject, content, result, history, saveHistory]);

  return (
    <>
      <UpdateChecker />
      <ToastContainer />
      <Sidebar
        view={view}
        setView={setView}
        ollamaOnline={ollamaOnline}
        hasPersona={!!selectedPersona}
        hasResult={!!result}
      />
      <main className="flex-1 overflow-y-auto p-10 bg-bg">
        <div className="max-w-[900px]">
          {view === "home" && (
            <HomeView
              personaCount={personas.length}
              history={history}
              settings={settings}
              onNewAdaptation={startNewAdaptation}
              onLoadHistory={(item) => {
                setContent(item.content);
                setResult(item.result);
                setView("result");
              }}
              onDeleteHistory={deleteHistoryItem}
            />
          )}
          {view === "personas" && (
            <PersonasView
              personas={personas}
              selectedPersona={selectedPersona}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onSelect={(p) => setSelectedPersona(p)}
              onUse={() => setView("content")}
            />
          )}
          {view === "content" && (
            <ContentView
              selectedPersona={selectedPersona}
              content={content}
              subject={subject}
              difficulty={difficulty}
              generating={generating}
              settings={settings}
              onContentChange={setContent}
              onSubjectChange={setSubject}
              onDifficultyChange={setDifficulty}
              onSettingsChange={(partial) => saveSettings({ ...settings, ...partial })}
              onChangePersona={() => setView("personas")}
              onGenerate={handleGenerate}
            />
          )}
          {view === "result" && (
            <ResultView
              result={result}
              fullPrompt={fullPrompt}
              selectedPersona={selectedPersona}
              settings={settings}
              subject={subject}
              difficulty={difficulty}
              onSaveHistory={handleSaveHistory}
              onNewAdaptation={startNewAdaptation}
            />
          )}
          {view === "manager" && (
            <ManagerView
              personas={personas}
              setPersonas={setPersonas}
              selectedPersona={selectedPersona}
              setSelectedPersona={setSelectedPersona}
            />
          )}
          {view === "settings" && (
            <SettingsView
              settings={settings}
              ollamaOnline={ollamaOnline}
              onSave={saveSettings}
              history={history}
              onDeleteHistory={deleteHistoryItem}
              onClearHistory={clearHistory}
            />
          )}
        </div>
      </main>
    </>
  );
}
