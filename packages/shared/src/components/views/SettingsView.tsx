/**
 * @module SettingsView
 * @description Tela de configurações da aplicação PBL.
 *
 * Permite ao professor configurar:
 * - **Modo de IA**: Offline (Ollama), Online (API) ou Manual (copiar prompt)
 * - **Provedor e modelo**: OpenAI, Anthropic, Gemini, OpenRouter, Groq
 * - **Ollama**: modelo e URL do servidor local
 * - **Saída**: idioma e formato do conteúdo gerado
 * - **Histórico**: visualização, exclusão individual e limpeza total
 * - **Zona de perigo**: reset completo da aplicação
 *
 * ## Persistência
 *
 * As configurações são mantidas em um estado local (`local`) durante a edição.
 * Só são aplicadas e persistidas no localStorage quando o usuário clica em
 * "Salvar configurações". Isso previne salvamento acidental de configurações
 * parcialmente preenchidas.
 *
 * ## Segurança
 *
 * O campo de API Key usa `type="password"` para mascarar o valor na tela.
 * Em versões futuras, será migrado para armazenamento seguro (keychain nativo
 * via `tauri-plugin-store`).
 */

import { memo, useState, useEffect } from "react";
import {
  MODEL_PLACEHOLDERS,
  OUTPUT_LANGUAGES,
  getOutputFormats,
  AVAILABLE_MODELS,

  type Settings,
  type HistoryItem,
} from "@pbl/shared/constants";
import Icon from "@pbl/shared/components/Icon";
import { toast } from "@pbl/shared/components/Toast";
import { getStorage } from "@pbl/shared/storage";
import { useI18n, INTERFACE_LANGUAGES } from "@pbl/shared/i18n";

interface Props {
  /** Configurações globais atuais */
  settings: Settings;
  /** Desktop-only: status do Ollama (quando true, habilita modo offline) */
  ollamaOnline?: boolean;
  /** Callback para salvar novas configurações */
  onSave: (s: Settings) => void;
  /** Histórico de adaptações para gerenciamento */
  history: HistoryItem[];
  /** Callback para excluir item individual do histórico */
  onDeleteHistory: (index: number) => void;
  /** Callback para limpar todo o histórico */
  onClearHistory: () => void;
  /** Callback para remover a API key do keychain (desktop) ou sessionStorage (web) */
  onDeleteApiKey?: () => void;
  /** Callback executado para extrair e baixar e analisar logs da aplicação */
  onDownloadLogs?: () => void;
  /** Callback para enviar log anonimamente via Worker (TODO) */
  // onSendLogs?: () => void;
  /** Plataforma atual exibida na seção "Sobre". Default: "Web" */
  platform?: "Web" | "Desktop";
}

export default memo(function SettingsView({
  settings,
  ollamaOnline,
  onSave,
  history,
  onDeleteHistory,
  onClearHistory,
  onDeleteApiKey,
  onDownloadLogs,
  // onSendLogs,
  platform = "Web",
}: Props) {
  /** Estado local editável (não persiste até clicar "Salvar") */
  const [local, setLocal] = useState<Settings>({ ...settings });
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const { t } = useI18n();

  // Sincroniza estado local quando props mudam externamente
  useEffect(() => {
    setLocal((prev) => {
      // Preserva campos que o usuário está editando (apiKey)
      // mas sincroniza o resto
      const next = { ...settings };
      if (prev.apiKey !== settings.apiKey && prev.apiKey) {
        next.apiKey = prev.apiKey;
      }
      return next;
    });
  }, [settings]);

  /** Atualiza campos parciais do estado local */
  function update(partial: Partial<Settings>) {
    setLocal((s) => ({ ...s, ...partial }));
  }

  /** Persiste as configurações e exibe feedback visual */
  function save() {
    onSave(local);
    toast(t("settings.saved"), "success");
  }

  /** Definição dos modos de IA disponíveis com descrições */
  const modes: { value: Settings["mode"]; title: string; desc: string }[] = [
    {
      value: "offline",
      title: t("settings.offline"),
      desc:
        ollamaOnline !== undefined
          ? t("settings.offlineDesc")
          : t("settings.offlineDesktopOnly"),
    },
    {
      value: "online",
      title: t("settings.online"),
      desc: t("settings.onlineDesc"),
    },
    {
      value: "manual",
      title: t("settings.manual"),
      desc: t("settings.manualDesc"),
    },
  ];

  return (
    <section>
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-txt mb-1.5">{t("settings.title")}</h1>
        <p className="text-sm text-txt-2">
          {t("settings.subtitle")}
        </p>
      </div>

      {/* Seleção do idioma da interface */}
      <div className="bg-bg-2 border border-border rounded p-6 mb-5">
        <h2 className="text-sm font-semibold mb-4">{t("settings.interfaceLanguage")}</h2>
        <select
          value={local.interfaceLanguage}
          onChange={(e) => {
            const lang = e.target.value;
            update({ interfaceLanguage: lang });
            // Aplica imediatamente sem esperar "Salvar"
            onSave({ ...local, interfaceLanguage: lang });
          }}
          className="bg-bg border border-border rounded-sm text-txt text-[13px] px-3.5 py-2.5 outline-none focus:border-accent transition-colors"
        >
          {Object.entries(INTERFACE_LANGUAGES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {/* Seleção do modo de IA */}
      <div className="bg-bg-2 border border-border rounded p-6 mb-5">
        <h2 className="text-sm font-semibold mb-4">{t("settings.aiMode")}</h2>
        <div className="flex flex-col gap-2.5">
          {modes.map((m) => (
            <label
              key={m.value}
              className={`flex items-start gap-2.5 p-3.5 rounded-sm border transition-all
                ${m.value === "offline" && ollamaOnline === undefined ? "border-border opacity-40 cursor-not-allowed" : "cursor-pointer"}
                ${local.mode === m.value && (m.value !== "offline" || ollamaOnline !== undefined) ? "border-accent bg-accent/6" : "border-border hover:border-border"}`}
            >
              <input
                type="radio"
                name="mode"
                value={m.value}
                checked={local.mode === m.value}
                onChange={() => {
                  if (m.value !== "offline" || ollamaOnline !== undefined)
                    update({ mode: m.value });
                }}
                disabled={m.value === "offline" && ollamaOnline === undefined}
                className="mt-0.5 accent-accent"
              />
              <div>
                <strong className="text-[13px] block mb-0.5">
                  {m.title}
                  {m.value === "offline" && ollamaOnline === undefined && (
                      <span className="ml-2 text-[10px] text-gold font-normal px-1.5 py-0.5 rounded bg-gold/10 border border-gold/20">
                      {t("settings.desktopOnly")}
                    </span>
                  )}
                </strong>
                <small className="text-[11px] text-txt-3">{m.desc}</small>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Configurações do Ollama (modo offline, desktop-only) */}
      {local.mode === "offline" && ollamaOnline !== undefined && (
        <div className="bg-bg-2 border border-border rounded p-6 mb-5">
          <h2 className="text-sm font-semibold mb-4">{t("settings.ollama")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-txt-2 font-medium">{t("settings.ollamaModel")}</label>
              <input
                value={local.ollamaModel}
                onChange={(e) => update({ ollamaModel: e.target.value })}
                placeholder={t("settings.ollamaModelPlaceholder")}
                className="bg-bg border border-border rounded-sm text-txt text-[13px] px-3.5 py-2.5 outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-txt-2 font-medium">
                {t("settings.ollamaUrl")}
              </label>
              <input
                value={local.ollamaUrl}
                onChange={(e) => update({ ollamaUrl: e.target.value })}
                placeholder="http://localhost:11434"
                className="bg-bg border border-border rounded-sm text-txt text-[13px] px-3.5 py-2.5 outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-txt-2 mt-2.5">
            <span
              className={`w-2 h-2 rounded-full inline-block ${ollamaOnline ? "bg-ok shadow-[0_0_6px_#22c55e]" : "bg-danger"}`}
            />
            <span>
              {ollamaOnline
                ? t("settings.ollamaDetected", { url: local.ollamaUrl })
                : t("settings.ollamaNotDetected")}
            </span>
          </div>
        </div>
      )}

      {/* Configurações de provedor online */}
      {local.mode === "online" && (
        <div className="bg-bg-2 border border-border rounded p-6 mb-5">
          <h2 className="text-sm font-semibold mb-4">{t("settings.providerOnline")}</h2>
          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-xs text-txt-2 font-medium">{t("settings.provider")}</label>
            <select
              value={local.provider}
              onChange={(e) => update({ provider: e.target.value })}
              className="bg-bg border border-border rounded-sm text-txt text-[13px] px-3.5 py-2.5 outline-none focus:border-accent transition-colors"
            >
              <option value="openai">{t("settings.providerOpenAI")}</option>
              <option value="anthropic">{t("settings.providerAnthropic")}</option>
              <option value="openrouter">{t("settings.providerOpenRouter")}</option>
              <option value="groq">{t("settings.providerGroq")}</option>
              <option value="gemini">{t("settings.providerGemini")}</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-xs text-txt-2 font-medium">{t("settings.model")}</label>
            {AVAILABLE_MODELS[local.provider] ? (
              <div className="flex flex-col gap-2">
                <select
                  value={
                    AVAILABLE_MODELS[local.provider]?.some((m) => m.id === local.model) && local.model !== "custom_other"
                      ? local.model
                      : "custom_other"
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    update({ model: val === "custom_other" ? "" : val });
                  }}
                  className="bg-bg border border-border rounded-sm text-txt text-[13px] px-3.5 py-2.5 outline-none focus:border-accent transition-colors"
                >
                  <option value="" disabled>{t("settings.selectModel") || "Selecione um modelo..."}</option>
                  {AVAILABLE_MODELS[local.provider].map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                {(!AVAILABLE_MODELS[local.provider]?.some((m) => m.id === local.model) || local.model === "custom_other") && (
                  <input
                    value={local.model === "custom_other" ? "" : local.model}
                    onChange={(e) => update({ model: e.target.value })}
                    placeholder={MODEL_PLACEHOLDERS[local.provider] || t("settings.modelPlaceholder")}
                    className="bg-bg border border-border rounded-sm text-txt text-[13px] px-3.5 py-2.5 outline-none focus:border-accent transition-colors"
                  />
                )}
              </div>
            ) : (
              <input
                value={local.model}
                onChange={(e) => update({ model: e.target.value })}
                placeholder={MODEL_PLACEHOLDERS[local.provider] || t("settings.modelPlaceholder")}
                className="bg-bg border border-border rounded-sm text-txt text-[13px] px-3.5 py-2.5 outline-none focus:border-accent transition-colors"
              />
            )}

          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-txt-2 font-medium">{t("settings.apiKey")}</label>
            <input
              type="password"
              value={local.apiKey}
              onChange={(e) => update({ apiKey: e.target.value })}
              placeholder="sk-..."
              className="bg-bg border border-border rounded-sm text-txt text-[13px] px-3.5 py-2.5 outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>
      )}

      {/* Configurações de saída */}
      <div className="bg-bg-2 border border-border rounded p-6 mb-5">
        <h2 className="text-sm font-semibold mb-4">{t("settings.output")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-txt-2 font-medium">
              {t("settings.outputLanguage")}
            </label>
            <select
              value={local.outputLanguage}
              onChange={(e) => update({ outputLanguage: e.target.value })}
              className="bg-bg border border-border rounded-sm text-txt text-[13px] px-3.5 py-2.5 outline-none focus:border-accent transition-colors"
            >
              {Object.entries(OUTPUT_LANGUAGES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-txt-2 font-medium">
              {t("settings.outputFormat")}
            </label>
            <select
              value={local.outputFormat}
              onChange={(e) => update({ outputFormat: e.target.value })}
              className="bg-bg border border-border rounded-sm text-txt text-[13px] px-3.5 py-2.5 outline-none focus:border-accent transition-colors"
            >
              {Object.entries(getOutputFormats(t)).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Botão salvar */}
      <button
        onClick={save}
        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-sm bg-accent text-white text-[13px] font-medium hover:bg-accent-2 transition-colors"
      >
        <Icon name="save" size={15} /> {t("settings.save")}
      </button>

      {/* Gerenciamento do histórico */}
      <div className="bg-bg-2 border border-border rounded p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">
            {t("settings.historyTitle")} ({history.length})
          </h2>
          {history.length > 0 && (
            <button
              onClick={() => setConfirmClear(true)}
              className="inline-flex items-center gap-1.5 text-[12px] text-danger border border-danger/20 bg-danger/10 rounded-sm px-3 py-1.5 hover:bg-danger/20 transition-colors"
            >
              <Icon name="trash" size={13} /> {t("settings.clearHistory")}
            </button>
          )}
        </div>

        {history.length === 0 && (
          <div className="text-sm text-txt-3 text-center py-6">
            {t("settings.emptyHistory")}
          </div>
        )}

        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
          {history.map((item, i) => (
            <div
              key={`${item.date}-${item.persona}-${i}`}
              className="flex items-center justify-between gap-3 bg-bg border border-border rounded-sm px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {item.persona}
                </div>
                <div className="text-[11px] text-txt-2 mt-0.5">
                  {item.subject} · {item.date}
                </div>
              </div>
              <button
                onClick={() => onDeleteHistory(i)}
                className="text-[12px] text-danger/60 hover:text-danger transition-colors px-2 py-1 shrink-0"
              >
                <Icon name="x" size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Seção Sobre */}
      <div className="bg-bg-2 border border-border rounded p-6 mt-6">
        <h2 className="text-sm font-semibold mb-4">{t("settings.about")}</h2>
        <div className="flex flex-col gap-2.5 text-[13px]">
          <div className="flex justify-between">
            <span className="text-txt-2">{t("settings.version")}</span>
            <span className="text-txt font-medium">v{(globalThis as unknown as Record<string, string>).__APP_VERSION__ ?? "0.2.0"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-txt-2">{t("settings.repository")}</span>
            <a
              href="https://github.com/marlonmotta/PROMETHEUS-BRIDGE-LEARN"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              GitHub
            </a>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-txt-2">{t("settings.platform")}</span>
            <span className="text-txt font-medium">{platform}</span>
          </div>
          <div className="border-t border-border pt-2.5 mt-1">
            <span className="text-[11px] text-txt-3">
              {t("settings.aboutDescription")}
            </span>
          </div>
        </div>
      </div>

      {/* Suporte e Problemas */}
      <div className="bg-bg-2 border border-border rounded p-6 mt-6">
        <h2 className="text-sm font-semibold mb-2">{t("settings.supportTitle")}</h2>
        <p
          className="text-[12px] text-txt-2 mb-4"
          dangerouslySetInnerHTML={{ __html: t("settings.supportDesc") }}
        />
        <div className="flex flex-wrap gap-3">
          {/* // TODO: Ativar este botão após configurar o Worker da Cloudflare
          <button
            onClick={() => onSendLogs?.()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-sm bg-accent text-white text-[12px] font-medium hover:bg-accent/80 transition-colors"
          >
            <Icon name="send" size={15} /> {t("settings.sendLogAnonymously")}
          </button>
          */}
          <button
            onClick={() => onDownloadLogs?.()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-sm bg-bg border border-border text-txt text-[12px] font-medium hover:bg-bg-3 transition-colors"
          >
            <Icon name="download" size={15} /> {t("settings.downloadLog")}
          </button>
        </div>
      </div>

      {/* Zona de perigo */}
      <div className="bg-danger/4 border border-danger/20 rounded p-6 mt-6">
        <h2 className="text-sm font-semibold text-danger mb-2">
          {t("settings.dangerZone")}
        </h2>
        <p className="text-[12px] text-txt-3 mb-4">
          {t("settings.dangerZoneDesc")}
        </p>
        <button
          onClick={() => setConfirmReset(true)}
          className="inline-flex items-center gap-1.5 text-[12px] text-danger border border-danger/20 bg-danger/10 rounded-sm px-3 py-1.5 hover:bg-danger/20 transition-colors"
        >
          <Icon name="trash" size={13} /> {t("settings.resetAll")}
        </button>
      </div>

      {/* Modal: confirmar limpeza do histórico */}
      {confirmClear && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setConfirmClear(false)}
        >
          <div
            className="bg-bg-2 border border-border rounded p-7 max-w-sm w-[90%]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold mb-2.5">{t("settings.clearHistoryConfirm")}</h3>
            <p className="text-txt-2 text-sm mb-5">
              {t("settings.clearHistoryWarning", { count: String(history.length) })}
            </p>
            <div className="flex gap-2.5 justify-end">
              <button
                onClick={() => setConfirmClear(false)}
                className="text-[13px] text-txt-2 border border-border rounded-sm px-4 py-2 hover:bg-bg-3 transition-colors"
              >
                {t("settings.cancel")}
              </button>
              <button
                onClick={() => {
                  onClearHistory();
                  setConfirmClear(false);
                  toast(t("settings.clearHistorySuccess"), "success");
                }}
                className="text-[13px] text-danger border border-danger/20 bg-danger/10 rounded-sm px-4 py-2 hover:bg-danger/20 transition-colors"
              >
                {t("settings.clearHistory")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: confirmar reset total */}
      {confirmReset && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setConfirmReset(false)}
        >
          <div
            className="bg-bg-2 border border-border rounded p-7 max-w-sm w-[90%]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold mb-2.5 text-danger">{t("settings.resetConfirm")}</h3>
            <p className="text-txt-2 text-sm mb-5">
              {t("settings.resetWarning")}
            </p>
            <div className="flex gap-2.5 justify-end">
              <button
                onClick={() => setConfirmReset(false)}
                className="text-[13px] text-txt-2 border border-border rounded-sm px-4 py-2 hover:bg-bg-3 transition-colors"
              >
                {t("settings.cancel")}
              </button>
              <button
                onClick={() => {
                  const storage = getStorage();
                  storage.remove("pbl_settings");
                  storage.remove("pbl_history");
                  storage.remove("pbl_favorites");
                  storage.remove("pbl_api_key");
                  storage.remove("pbl_personas_cache");
                  // Limpa API key do keychain nativo (desktop) ou sessionStorage (web)
                  onDeleteApiKey?.();
                  setConfirmReset(false);
                  window.location.reload();
                }}
                className="text-[13px] text-white bg-danger rounded-sm px-4 py-2 hover:bg-red-600 transition-colors"
              >
                {t("settings.resetAll")}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
});
