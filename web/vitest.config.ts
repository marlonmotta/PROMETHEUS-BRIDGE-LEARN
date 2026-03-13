/**
 * Configuração do Vitest para o PBL Web.
 *
 * Usa jsdom para simular o DOM do navegador e aliases
 * compatíveis com o vite.config.ts.
 */

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
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
        // Thresholds progressivos - atualizar sempre que novos testes forem adicionados.
        // v0.2.0 baseline (core logic): 15% → com integration + exporters: 30%
        // v2.0 gate (App.tsx desktop + adapter): 50%
        // Meta próximo marco: 70% quando testes de componentes React forem adicionados.
        lines: 50,
        functions: 50,
        branches: 30,
        statements: 50,
      },
    },
  },
});
