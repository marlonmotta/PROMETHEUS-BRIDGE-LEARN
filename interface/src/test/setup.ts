/**
 * Setup global de testes do PBL.
 *
 * Executado antes de cada arquivo de teste. Responsável por:
 * - Importar matchers do @testing-library/jest-dom (toBeInTheDocument, etc.)
 * - Mockar o ambiente Tauri (window.__TAURI__) para que testes rodem
 *   sem o backend Rust real. Os invokes retornam valores default seguros.
 */

import "@testing-library/jest-dom/vitest";
import { vi, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Limpa o DOM após cada teste para evitar vazamento entre testes
afterEach(() => {
  cleanup();
});

/**
 * Mock global do Tauri.
 *
 * Simula o `window.__TAURI__` para que chamadas ao `invoke()` no código
 * da aplicação não falhem durante testes. Cada comando tem um retorno
 * default seguro que pode ser sobrescrito em testes específicos
 * via `vi.spyOn(window.__TAURI__.core, 'invoke')`.
 */
const mockInvoke = vi.fn(async (cmd: string) => {
  const defaults: Record<string, unknown> = {
    load_personas: [],
    check_ollama: false,
    update_personas_online: [],
    get_api_key: "",
    save_api_key: undefined,
    delete_api_key: undefined,
    invoke_ai: "Resposta mock da IA",
    export_file: undefined,
  };
  return defaults[cmd] ?? undefined;
});

// Injeta o mock no window global
Object.defineProperty(window, "__TAURI__", {
  value: {
    core: {
      invoke: mockInvoke,
    },
  },
  writable: true,
  configurable: true,
});
