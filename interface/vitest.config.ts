/**
 * Configuração do Vitest para o PBL.
 *
 * Reutiliza a configuração do Vite (plugins, aliases) e adiciona
 * configurações específicas de teste: ambiente jsdom para simular
 * o DOM do navegador e setup global para mocks do Tauri.
 */

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@pbl/shared": path.resolve(__dirname, "../packages/shared/src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/__tests__/**/*.test.{ts,tsx}"],
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/__tests__/**",
        "src/test/**",
        "src/main.tsx",
        "src/vite-env.d.ts",
      ],
      thresholds: {
        // Thresholds progressivos para o desktop.
        // Baseline v2.0 (App.integration.test): 30%/20%
        // Meta v2.1 (+ testes de hooks): 50%
        lines: 30,
        functions: 20,
        branches: 20,
        statements: 30,
      },
    },
  },
});
