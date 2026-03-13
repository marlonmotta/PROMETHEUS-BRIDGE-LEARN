/**
 * Setup global de testes do PBL Web.
 *
 * - Importa matchers do @testing-library/jest-dom
 * - Limpa o DOM após cada teste
 * - Mock do sessionStorage para API key tests
 */

import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  localStorage.clear();
});
