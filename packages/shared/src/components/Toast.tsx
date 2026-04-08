/**
 * @module Toast
 * @description Sistema de notificações toast da aplicação PBL.
 *
 * Implementa um sistema global de toasts que pode ser invocado de qualquer
 * parte da aplicação (dentro ou fora de componentes React) via a função
 * exportada `toast()`.
 *
 * ## Arquitetura
 *
 * O pattern usado é "module-level singleton": uma referência global
 * (`addToastGlobal`) aponta para o método `addToast` do `ToastContainer`
 * montado no root da app. Isso permite chamar `toast()` de funções
 * puras, handlers assíncronos e módulos utilitários sem prop drilling.
 *
 * ## Limpeza automática
 *
 * Cada toast é removido automaticamente após 4 segundos. O timer é
 * implementado via `setTimeout` dentro do callback de `addToast`, e
 * como usamos IDs incrementais (via `useRef`), o cleanup é seguro
 * mesmo se múltiplos toasts forem exibidos simultaneamente.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "./Icon";
import { useI18n } from "@pbl/shared/i18n";

/** Tipos visuais de toast suportados */
type ToastType = "success" | "error" | "info";

/** Estrutura interna de um toast na fila */
interface ToastItem {
  /** ID incremental único para key e remoção */
  id: number;
  /** Mensagem exibida ao usuário */
  message: string;
  /** Tipo visual (define cor e ícone) */
  type: ToastType;
}

/** Mapa de tipo → nome do ícone */
const ICON_MAP: Record<ToastType, string> = {
  success: "check",
  error: "x",
  info: "info",
};

/** Mapa de tipo → classes CSS de cor */
const COLOR_MAP: Record<ToastType, string> = {
  success: "border-ok/30 bg-ok/10 text-ok",
  error: "border-danger/30 bg-danger/10 text-danger",
  info: "border-accent/30 bg-accent/10 text-accent",
};

/**
 * Referência global para o método `addToast` do `ToastContainer`.
 * Setada quando o componente monta e limpa quando desmonta.
 */
let addToastGlobal: ((message: string, type?: ToastType) => void) | null = null;

/**
 * Exibe uma notificação toast na interface.
 *
 * Pode ser chamada de qualquer contexto (componente, handler, utilitário).
 * Requer que o `ToastContainer` esteja montado no root da aplicação.
 *
 * @param message - Texto da notificação
 * @param type - Tipo visual: "success" (verde), "error" (vermelho), "info" (roxo)
 *
 * @example
 * ```ts
 * toast("Arquivo salvo com sucesso!", "success");
 * toast("Erro ao conectar", "error");
 * toast("Dica: use Ctrl+C para copiar", "info");
 * ```
 */
// eslint-disable-next-line react-refresh/only-export-components
export function toast(message: string, type: ToastType = "info") {
  if (addToastGlobal) {
    addToastGlobal(message, type);
  }
}

/**
 * Container de toasts que deve ser montado uma única vez no root da app.
 *
 * Renderiza os toasts no canto inferior direito da tela com animação
 * de slide-in. Cada toast pode ser fechado manualmente pelo botão X
 * ou será removido automaticamente após 4 segundos.
 */
export default function ToastContainer() {
  const { t } = useI18n();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++counterRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timersRef.current.delete(timer);
    }, 4000);
    timersRef.current.add(timer);
  }, []);

  // Registra/limpa a referência global quando o componente monta/desmonta
  useEffect(() => {
    addToastGlobal = addToast;
    return () => {
      addToastGlobal = null;
      timersRef.current.forEach(clearTimeout);
      timersRef.current.clear();
    };
  }, [addToast]);

  return (
    <div className="fixed bottom-4 right-4 z-60 flex flex-col gap-2 pointer-events-none">
      {toasts.map((item) => (
        <div
          key={item.id}
          role="alert"
          className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded border shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-sm text-[13px] font-medium animate-slide-in ${COLOR_MAP[item.type]}`}
        >
          <Icon name={ICON_MAP[item.type] as keyof typeof ICON_MAP} size={15} />
          <span>{item.message}</span>
          <button
            onClick={() =>
              setToasts((prev) => prev.filter((x) => x.id !== item.id))
            }
            className="ml-2 opacity-50 hover:opacity-100 transition-opacity"
            aria-label={t("a11y.closeNotification")}
          >
            <Icon name="x" size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
