/**
 * @module useImportFile
 * @description Hook para importar arquivos (documentos e imagens) no desktop.
 *
 * Encapsula:
 * - Diálogo de abertura de arquivo (PDF, DOCX, TXT, MD, imagens)
 * - Extração de texto de documentos (import_file)
 * - OCR de imagens via IA (extract_image_text)
 * - Feedback de loading/erro via dispatch
 */

import { useCallback } from "react";
import { invoke } from "../lib/tauri";
import type { Settings } from "@pbl/shared/constants";
import type { AppAction } from "@pbl/shared/appReducer";
import { useI18n } from "@pbl/shared/i18n";

interface UseImportFileParams {
  settings: Settings;
  dispatch: React.Dispatch<AppAction>;
}

export function useImportFile({ settings, dispatch }: UseImportFileParams) {
  const { t } = useI18n();
  const handleImportFile = useCallback(async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        filters: [
          { name: t("content.importAllSupported"), extensions: ["pdf", "docx", "txt", "md", "jpg", "jpeg", "png", "webp", "gif"] },
          { name: t("content.importDocuments"), extensions: ["pdf", "docx", "txt", "md"] },
          { name: t("content.importImages"), extensions: ["jpg", "jpeg", "png", "webp", "gif"] },
        ],
        multiple: false,
      });
      if (!selected) return;

      // Tauri 2: open() retorna string | string[] | null
      const filePath = typeof selected === "string" ? selected : String(selected);
      const ext = filePath.split(".").pop()?.toLowerCase() || "";
      const imageExts = ["jpg", "jpeg", "png", "webp", "gif"];

      if (imageExts.includes(ext)) {
        // Imagem → OCR via IA com vision
        dispatch({ type: "SET_CONTENT", content: `⏳ ${t("errors.ocrLoading")}` });
        try {
          const text = await invoke<string>("extract_image_text", {
            path: filePath,
            provider: settings.provider || "openai",
            apiKey: settings.apiKey || "",
            model: settings.mode === "offline" ? (settings.ollamaModel || "llava") : (settings.model || ""),
            mode: settings.mode || "online",
          });
          if (text) {
            dispatch({ type: "SET_CONTENT", content: text });
          } else {
            dispatch({ type: "SET_CONTENT", content: `⚠️ ${t("errors.ocrNoText")}` });
          }
        } catch (err) {
          const msg = typeof err === "string" ? err : (err as Error)?.message || t("errors.unknownError");
          dispatch({ type: "SET_CONTENT", content: `❌ ${t("errors.ocrError")}:\n\n${msg}\n\n${t("errors.ocrApiHint")}` });
          console.error("[PBL] OCR error:", err);
        }
      } else {
        // Documento → extração direta
        try {
          const text = await invoke<string>("import_file", { path: filePath });
          if (text) {
            dispatch({ type: "SET_CONTENT", content: text });
          }
        } catch (err) {
          const msg = typeof err === "string" ? err : (err as Error)?.message || t("errors.unknownError");
          dispatch({ type: "SET_CONTENT", content: `❌ ${t("errors.importError")}:\n\n${msg}` });
          console.error("[PBL] Import error:", err);
        }
      }
    } catch (err) {
      console.error("[PBL] Import dialog error:", err);
    }
  }, [settings, dispatch, t]);

  return { handleImportFile };
}
