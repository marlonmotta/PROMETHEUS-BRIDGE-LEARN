/**
 * @file sentry.test.ts
 * @description Testes para o módulo de integração Sentry.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do @sentry/react
vi.mock("@sentry/react", () => ({
  init: vi.fn(),
  ErrorBoundary: vi.fn(({ children }) => children),
  captureException: vi.fn(),
  addBreadcrumb: vi.fn(),
  browserTracingIntegration: vi.fn(() => ({})),
  replayIntegration: vi.fn(() => ({})),
}));

import * as Sentry from "@sentry/react";

describe("sentry module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("initSentry loga aviso quando DSN não está configurado", async () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Re-importa para pegar o import.meta.env limpo
    const { initSentry } = await import("../lib/sentry");
    initSentry();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Sentry DSN não configurado"),
    );
    consoleSpy.mockRestore();
  });

  it("exporta SentryErrorBoundary", async () => {
    const { SentryErrorBoundary } = await import("../lib/sentry");
    expect(SentryErrorBoundary).toBeDefined();
  });

  it("captureException loga no console quando Sentry inativo", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { captureException } = await import("../lib/sentry");
    const error = new Error("Test error");
    captureException(error, { context: "test" });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[PBL] Error"),
      expect.any(Error),
      expect.objectContaining({ context: "test" }),
    );
    consoleSpy.mockRestore();
  });

  it("addBreadcrumb chama Sentry.addBreadcrumb", async () => {
    const { addBreadcrumb } = await import("../lib/sentry");
    addBreadcrumb("Test message", "test-category");

    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
      message: "Test message",
      category: "test-category",
      level: "info",
    });
  });

  it("addBreadcrumb usa category padrão 'app'", async () => {
    const { addBreadcrumb } = await import("../lib/sentry");
    addBreadcrumb("Test message");

    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
      message: "Test message",
      category: "app",
      level: "info",
    });
  });
});
