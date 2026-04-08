/**
 * @module i18n
 * @description Sistema de internacionalização para o PBL.
 *
 * Estratégia: locale files JSON com chaves hierárquicas (dot notation).
 * O hook `useI18n` retorna uma função `t()` via React Context,
 * eliminando a necessidade de prop drilling do locale.
 *
 * ## Uso
 *
 * ```tsx
 * // No orchestrator (App.tsx / WebApp.tsx):
 * import { I18nProvider } from "@pbl/shared/i18n";
 *
 * <I18nProvider locale={state.settings.interfaceLanguage}>
 *   <App />
 * </I18nProvider>
 *
 * // Em qualquer componente:
 * import { useI18n } from "@pbl/shared/i18n";
 *
 * function MyComponent() {
 *   const { t } = useI18n();
 *   return <button>{t("dashboard.adaptButton")}</button>;
 * }
 * ```
 *
 * ## Adicionando um novo idioma
 *
 * 1. Copie `pt-BR.json` → `xx.json` (código do idioma)
 * 2. Traduza todas as strings
 * 3. Importe no `LOCALES` abaixo
 * 4. Adicione o label em `INTERFACE_LANGUAGES`
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";

import ptBR from "./pt-BR.json";
import en from "./en.json";
import es from "./es.json";
import fr from "./fr.json";
import { type TranslationKey } from "./types";

export type LocaleKey = string;
export type LocaleData = Record<string, unknown>;

/** Locales disponíveis */
const LOCALES: Record<string, LocaleData> = {
  "pt-BR": ptBR,
  en: en,
  es: es,
  fr: fr,
};

/** Locale padrão */
const DEFAULT_LOCALE = "pt-BR";

/**
 * Idiomas disponíveis para a interface do usuário.
 * Usado no seletor de idioma em SettingsView.
 * Os labels são mantidos no idioma nativo para fácil identificação.
 */
export const INTERFACE_LANGUAGES: Record<string, string> = {
  "pt-BR": "Português (BR)",
  en: "English",
  es: "Español",
  fr: "Français",
};

/** Resolve uma chave hierárquica ("a.b.c") no objeto de locale */
function resolve(obj: unknown, path: string): string {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return path;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : path;
}

/** Tipo da função de tradução */
type TFunction = (key: TranslationKey, params?: Record<string, string | number>) => string;

/** Tipo do contexto de i18n */
interface I18nContextValue {
  t: TFunction;
  locale: string;
}

/** Cria a função `t` para um locale específico */
function createTFunction(locale: string): TFunction {
  const data = LOCALES[locale] || LOCALES[DEFAULT_LOCALE];

  return function t(key: TranslationKey, params?: Record<string, string | number>): string {
    let text = resolve(data, key);

    // Fallback para o locale padrão se a chave não for encontrada
    if (text === key && locale !== DEFAULT_LOCALE) {
      const fallbackData = LOCALES[DEFAULT_LOCALE];
      const fallbackText = resolve(fallbackData, key);
      if (fallbackText !== key) text = fallbackText;
    }

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{{${k}}}`, String(v));
      }
    }
    return text;
  };
}

// ─── React Context ──────────────────────────────────────────────────────────

const I18nContext = createContext<I18nContextValue>({
  t: createTFunction(DEFAULT_LOCALE),
  locale: DEFAULT_LOCALE,
});

/**
 * Provider de internacionalização.
 *
 * Deve envolver a árvore de componentes no orchestrator.
 * Quando o `locale` muda, todos os componentes que usam `useI18n()`
 * são automaticamente re-renderizados com a nova função `t()`.
 */
export function I18nProvider({
  locale,
  children,
}: {
  locale: string;
  children: ReactNode;
}) {
  const value = useMemo<I18nContextValue>(
    () => ({
      t: createTFunction(locale),
      locale,
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Hook de tradução via Context.
 *
 * Retorna `{ t, locale }` onde `t(key, params?)` resolve a chave
 * no locale ativo. Se a chave não existir no locale atual,
 * faz fallback para pt-BR. Se ainda não existir, retorna a própria chave.
 */
export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}

// ─── API standalone (para código fora de React) ─────────────────────────────

/**
 * Hook legado de tradução (sem Context).
 *
 * @deprecated Use `useI18n()` via Context para reatividade automática.
 * Mantido para compatibilidade com código existente.
 */
export function useTranslation(locale: string = DEFAULT_LOCALE) {
  const data = LOCALES[locale] || LOCALES[DEFAULT_LOCALE];

  function t(key: TranslationKey, params?: Record<string, string | number>): string {
    let text = resolve(data, key);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{{${k}}}`, String(v));
      }
    }
    return text;
  }

  return { t, locale };
}

/** Acesso direto sem hook (para módulos não-React) */
export function t(
  key: TranslationKey,
  locale: string = DEFAULT_LOCALE,
  params?: Record<string, string | number>,
): string {
  const data = LOCALES[locale] || LOCALES[DEFAULT_LOCALE];
  let text = resolve(data, key);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{{${k}}}`, String(v));
    }
  }
  return text;
}

/** Lista de locales disponíveis */
export function getAvailableLocales(): string[] {
  return Object.keys(LOCALES);
}
