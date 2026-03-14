/**
 * @file useImportFile.test.ts
 * @description Testes para o hook useImportFile (web).
 */

import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useImportFile } from "../hooks/useImportFile";
import { DEFAULT_SETTINGS } from "@pbl/shared/constants";

describe("useImportFile", () => {
  it("retorna handleImportFile como função", () => {
    const dispatch = vi.fn();
    const { result } = renderHook(() =>
      useImportFile({ settings: DEFAULT_SETTINGS, dispatch }),
    );
    expect(typeof result.current.handleImportFile).toBe("function");
  });

  it("mantém referência estável entre renders", () => {
    const dispatch = vi.fn();
    const { result, rerender } = renderHook(() =>
      useImportFile({ settings: DEFAULT_SETTINGS, dispatch }),
    );
    const firstRef = result.current.handleImportFile;
    rerender();
    expect(result.current.handleImportFile).toBe(firstRef);
  });
});
