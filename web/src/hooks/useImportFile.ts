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

interface UseImportFileParams {
  settings: Settings;
  dispatch: React.Dispatch<AppAction>;
}

export function useImportFile({ settings, dispatch }: UseImportFileParams) {
  const handleImportFile = useCallback(async () => {
    try {
      const { openFilePicker, isImageFile, extractTextFromFile, extractTextFromImage } =
        await import("@pbl/shared/import");

      const file = await openFilePicker();
      if (!file) return;

      if (isImageFile(file.name)) {
        // Imagem → OCR via IA com vision
        dispatch({ type: "SET_CONTENT", content: "⏳ Extraindo texto da imagem via IA... Aguarde." });
        try {
          const text = await extractTextFromImage(
            file,
            settings.provider || "openai",
            settings.apiKey || "",
            settings.model || "",
          );
          dispatch({ type: "SET_CONTENT", content: text || "⚠️ Nenhum texto foi extraído da imagem." });
        } catch (err) {
          const msg = typeof err === "string" ? err : (err as Error)?.message || "Erro desconhecido";
          dispatch({
            type: "SET_CONTENT",
            content: `❌ Erro ao extrair texto da imagem:\n\n${msg}\n\nVerifique se a API key está configurada e o provedor suporta vision.`,
          });
        }
      } else {
        // Documento → extração direta
        try {
          const text = await extractTextFromFile(file);
          dispatch({ type: "SET_CONTENT", content: text });
        } catch (err) {
          const msg = typeof err === "string" ? err : (err as Error)?.message || "Erro desconhecido";
          dispatch({ type: "SET_CONTENT", content: `❌ Erro ao importar arquivo:\n\n${msg}` });
        }
      }
    } catch (err) {
      console.error("[PBL] Import error:", err);
    }
  }, [settings, dispatch]);

  return { handleImportFile };
}
