/**
 * @module ErrorBoundary
 * @description Componente de captura global de erros React.
 *
 * Error Boundaries em React requerem componentes class-based porque
 * os hooks `componentDidCatch` e `getDerivedStateFromError` não possuem
 * equivalentes em hooks funcionais (limitação do React até v18).
 *
 * ## Comportamento
 *
 * - Qualquer exceção não capturada nos filhos é interceptada aqui
 * - O erro é logado no console com stack trace completo
 * - A UI de fallback exibe uma mensagem amigável com botão de reload
 * - Ao clicar "Recarregar", a página inteira é recarregada (hard refresh)
 *
 * ## Posicionamento
 *
 * Deve envolver o `<App />` no `main.tsx` para capturar erros em
 * qualquer parte da árvore de componentes.
 */

import { Component, type ErrorInfo, type ReactNode } from "react";
import { t, getLocale } from "@pbl/shared/i18n";

interface Props {
  /** Componentes filhos a serem protegidos */
  children: ReactNode;
}

interface State {
  /** Se um erro foi capturado */
  hasError: boolean;
  /** Mensagem de erro para exibição (opcional) */
  errorMessage: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || t("errorBoundary.defaultError", getLocale()),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[PBL] Erro capturado pelo ErrorBoundary:", error);
    console.error("[PBL] Component stack:", errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-bg-2 border border-border rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-txt mb-2">{t("errorBoundary.title", getLocale())}</h1>
            <p className="text-sm text-txt-2 mb-4 leading-relaxed">
              {t("errorBoundary.description", getLocale())}
            </p>
            {this.state.errorMessage && (
              <pre className="text-xs text-danger/70 bg-bg border border-border rounded p-3 mb-4 text-left overflow-x-auto">
                {this.state.errorMessage}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-sm bg-accent text-white font-medium text-sm hover:bg-accent-2 transition-colors"
            >
              {t("errorBoundary.reload", getLocale())}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
