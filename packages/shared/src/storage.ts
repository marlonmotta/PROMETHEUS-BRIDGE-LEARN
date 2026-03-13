/**
 * @module storage
 * @description Abstração de persistência para o PBL.
 *
 * O appReducer precisa gravar estado (histórico, favoritos, settings)
 * mas NÃO deve saber onde está persistindo. Esta camada resolve isso:
 *
 * - **Web**: usa `localStorage` (browser nativo)
 * - **Desktop**: usa `localStorage` do WebView (futuro: Tauri Store)
 *
 * O consumer (App.tsx / WebApp.tsx) chama `setStorage()` no boot
 * e o reducer opera via `getStorage()` de forma agnóstica.
 */

// ─── Interface ──────────────────────────────────────────────────────────────

export interface IStorage {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

// ─── Implementação: Browser (localStorage) ──────────────────────────────────

export class BrowserStorage implements IStorage {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error(`[PBL] Falha ao salvar "${key}":`, e);
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`[PBL] Falha ao remover "${key}":`, e);
    }
  }
}

// ─── Singleton global ───────────────────────────────────────────────────────

let _storage: IStorage = new BrowserStorage();

/** Define o adapter de storage (chamar no boot da app) */
export function setStorage(s: IStorage): void {
  _storage = s;
}

/** Retorna o adapter de storage configurado */
export function getStorage(): IStorage {
  return _storage;
}
