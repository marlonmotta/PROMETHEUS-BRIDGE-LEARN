/**
 * Configuração do Vitest para o PBL.
 *
 * Reutiliza a configuração do Vite (plugins, aliases) e adiciona
 * configurações específicas de teste: ambiente jsdom para simular
 * o DOM do navegador e setup global para mocks do Tauri.
 */

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/__tests__/**/*.test.{ts,tsx}"],
    css: false,
  },
});
