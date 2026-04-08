import ptBR from "./pt-BR.json";

/**
 * Utilidade recursiva para extrair TODOS os caminhos em dot-notation.
 *
 * Diferente da versão anterior, cada chave folha recebe o prefixo
 * completo de seus pais (ex: "home.stats.personas" em vez de apenas "personas").
 */
export type FlattenKeys<T, Prefix extends string = ""> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? FlattenKeys<T[K], Prefix extends "" ? K : `${Prefix}.${K}`>
        : Prefix extends "" ? K : `${Prefix}.${K}`;
    }[keyof T & string]
  : never;

/**
 * Tipo que representa TODAS as chaves válidas no idioma nativo (PT-BR).
 * Garante autocomplete e segurança em tempo de compilação.
 */
export type TranslationKey = FlattenKeys<typeof ptBR>;
