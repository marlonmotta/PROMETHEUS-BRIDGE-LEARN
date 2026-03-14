/**
 * Testes unitários do módulo shared/storage.
 *
 * Testa a camada de abstração de persistência que permite
 * o app funcionar tanto no desktop (Tauri) quanto na web (localStorage).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserStorage, setStorage, getStorage } from "@pbl/shared/storage";

let storage: BrowserStorage;

beforeEach(() => {
  localStorage.clear();
  storage = new BrowserStorage();
});

// ─── BrowserStorage ──────────────────────────────────────────────────────────

describe("BrowserStorage", () => {
  it("salva e recupera valores do localStorage", () => {
    storage.set("pbl_test", "valor-123");
    expect(storage.get("pbl_test")).toBe("valor-123");
  });

  it("retorna null para chave inexistente", () => {
    expect(storage.get("chave_nao_existe")).toBeNull();
  });

  it("remove uma chave do localStorage", () => {
    storage.set("pbl_temp", "valor");
    storage.remove("pbl_temp");
    expect(storage.get("pbl_temp")).toBeNull();
  });

  it("sobrescreve valor existente", () => {
    storage.set("pbl_key", "valor-1");
    storage.set("pbl_key", "valor-2");
    expect(storage.get("pbl_key")).toBe("valor-2");
  });

  it("get não lança exceção quando localStorage falha", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    // Deve retornar null, não lançar
    expect(storage.get("qualquer")).toBeNull();
  });

  it("set não lança exceção quando localStorage está cheio", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    // Não deve lançar - erros são logados silenciosamente
    expect(() => storage.set("key", "value")).not.toThrow();
  });
});

// ─── Singleton Global ────────────────────────────────────────────────────────

describe("setStorage / getStorage (singleton)", () => {
  it("retorna BrowserStorage como padrão", () => {
    const s = getStorage();
    expect(s).toBeDefined();
    expect(typeof s.get).toBe("function");
    expect(typeof s.set).toBe("function");
  });

  it("permite trocar o adapter de storage", () => {
    const mockStorage = {
      get: vi.fn(() => "mock-value"),
      set: vi.fn(),
      remove: vi.fn(),
    };

    setStorage(mockStorage);
    const s = getStorage();
    expect(s.get("test")).toBe("mock-value");
    expect(mockStorage.get).toHaveBeenCalledWith("test");

    // Restaura para não afetar outros testes
    setStorage(new BrowserStorage());
  });
});
