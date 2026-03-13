/**
 * @module sentry
 * @description Inicialização do Sentry para monitoramento de erros no PBL Web.
 *
 * O DSN é configurado via variável de ambiente `VITE_SENTRY_DSN`.
 * Se não estiver definido, o Sentry fica inativo (silencioso).
 *
 * ## Configuração
 *
 * 1. Crie um projeto no https://sentry.io (ou self-hosted)
 * 2. Copie o DSN
 * 3. Adicione ao `.env` ou `.env.production`:
 *    ```
 *    VITE_SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
 *    ```
 *
 * ## O que é capturado
 *
 * - Erros não tratados (window.onerror)
 * - Rejeições de Promise não tratadas
 * - Erros dentro de componentes React (ErrorBoundary)
 * - Breadcrumbs automáticos (cliques, navegação, console)
 */

import * as Sentry from "@sentry/react";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || "";

export function initSentry() {
  if (!SENTRY_DSN) {
    console.warn("[PBL] Sentry DSN não configurado - monitoramento inativo.");
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE, // "development" | "production"
    // Captura 100% dos erros por padrão (ajuste para produção com volume alto)
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
    // Não envia dados em development por padrão
    enabled: import.meta.env.PROD || !!import.meta.env.VITE_SENTRY_FORCE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Captura replays apenas em erros (não sessões completas)
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Rate de replay: 0% sessões normais, 100% sessões com erro
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    // Filtra erros de extensões do browser
    beforeSend(event) {
      if (event.exception?.values?.some((v) =>
        v.stacktrace?.frames?.some((f) =>
          f.filename?.includes("chrome-extension://") ||
          f.filename?.includes("moz-extension://")
        )
      )) {
        return null;
      }
      return event;
    },
  });
}

/** ErrorBoundary do Sentry para envolver componentes React */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/** Captura manual de exceções */
export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  } else {
    console.error("[PBL] Error (Sentry inactive):", error, context);
  }
}

/** Adiciona breadcrumb para contexto */
export function addBreadcrumb(message: string, category: string = "app") {
  Sentry.addBreadcrumb({ message, category, level: "info" });
}
