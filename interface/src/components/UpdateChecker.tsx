/**
 * @module UpdateChecker
 * @description Componente de verificação e instalação de atualizações do PBL.
 *
 * Utiliza o `tauri-plugin-updater` para verificar se há novas versões
 * disponíveis no GitHub Releases. O fluxo é:
 *
 * 1. **Mount**: Verifica automaticamente se há update disponível
 * 2. **Disponível**: Exibe banner com botão "Atualizar agora"
 * 3. **Downloading**: Mostra barra de progresso
 * 4. **Pronto**: Oferece botão para reiniciar e aplicar
 *
 * ## Tratamento de Erros
 *
 * Falhas na verificação são silenciosas (não interrompem o uso).
 * Falhas no download exibem mensagem de erro temporária (5s).
 */

import { useState, useEffect, useRef } from "react";
import Icon from "@pbl/shared/components/Icon";
import { useI18n } from "@pbl/shared/i18n";

/** Estados possíveis do fluxo de atualização */
type UpdateStatus = "idle" | "checking" | "available" | "downloading" | "ready" | "error";

export default function UpdateChecker() {
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [version, setVersion] = useState("");
  const [progress, setProgress] = useState(0);
  const { t } = useI18n();
  /** Tamanho total do download (bytes) para cálculo de progresso real */
  const contentLengthRef = useRef(0);
  /** Armazena o objeto de update para reutilização no download */
  const updateRef = useRef<{
    version: string;
    downloadAndInstall: (
      onEvent?: (event: { event: string; data?: Record<string, number> }) => void,
    ) => Promise<void>;
  } | null>(null);

  /**
   * Verifica se há atualizações disponíveis no GitHub Releases.
   * Importa o plugin dinamicamente para não quebrar em ambientes não-Tauri.
   */
  async function checkForUpdate() {
    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      setStatus("checking");

      const update = await check();
      if (!update) {
        setStatus("idle");
        return;
      }

      updateRef.current = update;
      setVersion(update.version);
      setStatus("available");
    } catch (e) {
      console.warn("[PBL] Falha ao verificar atualizações:", e);
      setStatus("idle");
    }
  }

  /**
   * Baixa e instala a atualização disponível.
   *
   * O callback de progresso acumula os bytes recebidos para calcular
   * a porcentagem real (baseada no `contentLength` do evento `Started`).
   */
  async function downloadAndInstall() {
    try {
      const update = updateRef.current;
      if (!update) return;

      setStatus("downloading");
      setProgress(0);
      contentLengthRef.current = 0;

      await update.downloadAndInstall((event) => {
        if (event.event === "Started" && event.data?.contentLength) {
          contentLengthRef.current = event.data.contentLength;
          setProgress(0);
        } else if (event.event === "Progress") {
          setProgress((prev) => prev + (event.data?.chunkLength || 0));
        } else if (event.event === "Finished") {
          setStatus("ready");
        }
      });

      setStatus("ready");
    } catch (e) {
      console.error("[PBL] Falha na atualização:", e);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 5000);
    }
  }

  /**
   * Reinicia a aplicação para aplicar a atualização.
   * Usa o plugin `process` do Tauri com fallback para reload do browser.
   */
  async function relaunch() {
    try {
      const { relaunch } = await import("@tauri-apps/plugin-process");
      await relaunch();
    } catch (e) {
      console.warn("[PBL] Falha ao reiniciar:", e);
      window.location.reload();
    }
  }

  // Verificação automática ao montar o componente
  useEffect(() => {
    checkForUpdate();
  }, []);

  // Não renderiza nada nos estados invisíveis
  if (status === "idle" || status === "checking") return null;

  /** Calcula porcentagem real de progresso baseada no contentLength */
  const progressPercent =
    contentLengthRef.current > 0 ? Math.min((progress / contentLengthRef.current) * 100, 100) : 0;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-bg-2 border border-border rounded p-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)] max-w-xs">
      {status === "available" && (
        <div>
          <div className="text-sm font-semibold mb-1.5 flex items-center gap-1.5">
            <Icon name="download" size={15} className="text-accent" /> {t("update.newVersion")}
          </div>
          <p className="text-[12px] text-txt-2 mb-3">
            {t("update.versionAvailable", { version })}
          </p>
          <div className="flex gap-2">
            <button
              onClick={downloadAndInstall}
              className="text-[12px] px-3 py-1.5 rounded-sm bg-accent text-white font-medium hover:bg-accent-2 transition-colors"
            >
              {t("update.updateNow")}
            </button>
            <button
              onClick={() => setStatus("idle")}
              className="text-[12px] px-3 py-1.5 rounded-sm border border-border text-txt-2 hover:bg-bg-3 transition-colors"
            >
              {t("update.later")}
            </button>
          </div>
        </div>
      )}

      {status === "downloading" && (
        <div>
          <div className="text-sm font-semibold mb-2 flex items-center gap-1.5">
            <Icon name="refresh" size={15} className="text-accent animate-spin" /> {t("update.downloading")}
          </div>
          <div className="w-full h-1.5 bg-bg rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {status === "ready" && (
        <div>
          <div className="text-sm font-semibold mb-1.5 flex items-center gap-1.5">
            <Icon name="check" size={15} className="text-ok" /> {t("update.ready")}
          </div>
          <p className="text-[12px] text-txt-2 mb-3">{t("update.restartHint")}</p>
          <button
            onClick={relaunch}
            className="text-[12px] px-3 py-1.5 rounded-sm bg-ok text-white font-medium hover:opacity-90 transition-colors"
          >
            {t("update.restartNow")}
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="text-[12px] text-danger flex items-center gap-1.5">
          <Icon name="x" size={14} /> {t("update.error")}
        </div>
      )}
    </div>
  );
}
