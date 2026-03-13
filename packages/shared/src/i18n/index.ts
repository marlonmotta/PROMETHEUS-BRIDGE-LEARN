/**
 * @module i18n
 * @description Sistema básico de internacionalização para o PBL.
 *
 * Estratégia: locale files JSON com chaves hierárquicas (dot notation).
 * O hook `useTranslation` retorna uma função `t()` que resolve chaves
 * como "dashboard.adaptButton" para o texto traduzido.
 *
 * ## Uso
 *
 * ```tsx
 * import { useTranslation } from "@pbl/shared/i18n";
 *
 * function MyComponent() {
 *   const { t } = useTranslation();
 *   return <button>{t("dashboard.adaptButton")}</button>;
 * }
 * ```
 *
 * ## Adicionando um novo idioma
 *
 * 1. Copie `pt-BR.json` → `en.json` (ou outro idioma)
 * 2. Traduza todas as strings
 * 3. Importe no `LOCALES` abaixo
 * 4. O usuário seleciona o idioma via Settings
 */

import ptBR from "./pt-BR.json";

export type LocaleKey = string;
export type LocaleData = Record<string, unknown>;

/** Locales disponíveis */
const LOCALES: Record<string, LocaleData> = {
  "pt-BR": ptBR,
};

/** Locale padrão */
const DEFAULT_LOCALE = "pt-BR";

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

/**
 * Hook de tradução.
 *
 * Retorna uma função `t(key)` que resolve a chave no locale ativo.
 * Se a chave não existir, retorna a própria chave como fallback.
 *
 * @param locale - Locale a usar (default: "pt-BR")
 */
export function useTranslation(locale: string = DEFAULT_LOCALE) {
  const data = LOCALES[locale] || LOCALES[DEFAULT_LOCALE];

  function t(key: string, params?: Record<string, string | number>): string {
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
export function t(key: string, locale: string = DEFAULT_LOCALE): string {
  const data = LOCALES[locale] || LOCALES[DEFAULT_LOCALE];
  return resolve(data, key);
}

/** Lista de locales disponíveis */
export function getAvailableLocales(): string[] {
  return Object.keys(LOCALES);
}
