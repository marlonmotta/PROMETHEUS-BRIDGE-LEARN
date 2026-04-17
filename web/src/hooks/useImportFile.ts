/**
 * @module useImportFile (Web)
 * @description Hook para importar arquivos (documentos e imagens) na versão web.
 *
 * Equivalente ao desktop `useImportFile` mas usando a Web File API
 * ao invés de diálogos Tauri. Encapsula:
 * - Seleção de arquivo via `openFilePicker` (shared)
 * - Extração de texto de documentos (PDF, DOCX, TXT, MD)
 * - OCR de imagens via IA Vision (OpenAI, Gemini, Anthropic)
 * - Feedback de loading/erro via dispatch
 */

import { useCallback } from "react";
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
      const { openFilePicker, isImageFile, extractTextFromFile, extractTextFromImage } =
        await import("@pbl/shared/import");

      const file = await openFilePicker();
      if (!file) return;

      if (isImageFile(file.name)) {
        // Imagem → OCR via IA com vision
        dispatch({ type: "SET_CONTENT", content: `⏳ ${t("errors.ocrLoading")}` });
        try {
          const text = await extractTextFromImage(
            file,
            settings.provider || "openai",
            settings.apiKey || "",
            settings.model || "",
          );
          dispatch({ type: "SET_CONTENT", content: text || `⚠️ ${t("errors.ocrNoText")}` });
        } catch (err) {
          const msg = typeof err === "string" ? err : (err as Error)?.message || t("errors.unknownError");
          dispatch({
            type: "SET_CONTENT",
            content: `❌ ${t("errors.ocrError")}:\n\n${msg}\n\n${t("errors.ocrApiHint")}`,
          });
        }
      } else {
        // Documento → extração direta
        try {
          const text = await extractTextFromFile(file);
          dispatch({ type: "SET_CONTENT", content: text });
        } catch (err) {
          const msg = typeof err === "string" ? err : (err as Error)?.message || t("errors.unknownError");
          dispatch({ type: "SET_CONTENT", content: `❌ ${t("errors.importError")}:\n\n${msg}` });
        }
      }
    } catch (err) {
      console.error("[PBL] Import error:", err);
    }
  }, [settings, dispatch, t]);

  return { handleImportFile };
}
