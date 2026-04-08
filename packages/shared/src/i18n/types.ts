import ptBR from "./pt-BR.json";

// Utilidade recursiva para extrair caminhos em dot-notation (ex: "home.stats.personas")
type DotPrefix<T extends string, U extends string> = T extends "" ? U : `${T}.${U}`;

export type FlattenKeys<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? DotPrefix<K, FlattenKeys<T[K]>>
          : K
        : never;
    }[keyof T]
  : "";

/** 
 * Tipo que representa TODAS as chaves válidas no idioma nativo (PT-BR).
 * Garante autocomplete e segurança em tempo de compilação.
 */
export type TranslationKey = FlattenKeys<typeof ptBR>;
