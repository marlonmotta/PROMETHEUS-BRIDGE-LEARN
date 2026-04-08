/**
 * @module useGenerate
 * @description Hook para gerenciar a geração de conteúdo adaptado por IA.
 *
 * Encapsula:
 * - Construção do payload de prompt
 * - Chamada ao backend Tauri (invoke_ai)
 * - Timeout automático de 60s
 * - Cancelamento de gerações anteriores via AbortController
 * - Modo manual (retorna o prompt para copiar)
 */

import { useCallback, useRef } from "react";
import { invoke } from "../lib/tauri";
import type { Persona, Settings } from "@pbl/shared/constants";
import type { AppAction } from "@pbl/shared/appReducer";
import { buildPromptPayload } from "@pbl/shared/promptBuilder";
import { useI18n } from "@pbl/shared/i18n";

const AI_TIMEOUT_MS = 60_000;

interface UseGenerateParams {
  selectedPersona: Persona | null;
  content: string;
  subject: string;
  difficulty: string;
  settings: Settings;
  dispatch: React.Dispatch<AppAction>;
}

export function useGenerate({
  selectedPersona,
  content,
  subject,
  difficulty,
  settings,
  dispatch,
}: UseGenerateParams) {
  const abortRef = useRef<AbortController | null>(null);
  const { t } = useI18n();

  const handleGenerate = useCallback(async () => {
    if (!selectedPersona || !content) return;

    // Cancela geração anterior se ainda em andamento
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    dispatch({ type: "SET_GENERATING", generating: true });

    const payload = buildPromptPayload(
      selectedPersona,
      content,
      subject,
      difficulty,
      settings,
    );

    if (settings.mode === "manual") {
      dispatch({
        type: "GENERATION_COMPLETE",
        result: payload.rewriteInstruction,
        fullPrompt: payload.rewriteInstruction,
      });
      return;
    }

    try {
      const aiPromise = invoke<string>("invoke_ai", {
        mode: settings.mode,
        provider: payload.provider,
        apiKey: settings.apiKey || "",
        model: payload.model,
        systemPrompt: payload.systemPrompt,
        userContent: payload.rewriteInstruction,
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(t("errors.aiTimeout"))),
          AI_TIMEOUT_MS,
        ),
      );
      const res = await Promise.race([aiPromise, timeoutPromise]);
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
        result: `${t("errors.aiError")}: ${e}\n\n${t("errors.manualFallback")}\n\n${payload.rewriteInstruction}`,
        fullPrompt: payload.rewriteInstruction,
      });
    }
  }, [selectedPersona, content, subject, difficulty, settings, dispatch, t]);

  return { handleGenerate };
}
