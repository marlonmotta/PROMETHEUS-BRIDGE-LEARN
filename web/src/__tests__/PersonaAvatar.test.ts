/**
 * Testes unitários do PersonaAvatar.
 *
 * Testa a lógica de:
 * - Geração de cor determinística a partir do ID (idToColor)
 * - Extração de iniciais do display_name (getInitials)
 * - Fallback: quando avatar 404, exibe iniciais coloridas
 */

import { describe, it, expect } from "vitest";
import { idToColor, getInitials } from "@pbl/shared/components/PersonaAvatar";

// ─── idToColor ───────────────────────────────────────────────────────────────

describe("idToColor", () => {
  it("retorna cor HSL válida", () => {
    const color = idToColor("goku");
    expect(color).toMatch(/^hsl\(\d+, 60%, 45%\)$/);
  });

  it("mesma entrada produz mesma cor (determinístico)", () => {
    expect(idToColor("naruto")).toBe(idToColor("naruto"));
    expect(idToColor("goku")).toBe(idToColor("goku"));
  });

  it("entradas diferentes produzem cores diferentes", () => {
    expect(idToColor("goku")).not.toBe(idToColor("naruto"));
    expect(idToColor("einstein")).not.toBe(idToColor("curie"));
  });

  it("lida com string vazia", () => {
    const color = idToColor("");
    expect(color).toMatch(/^hsl\(\d+, 60%, 45%\)$/);
  });
});

// ─── getInitials ─────────────────────────────────────────────────────────────

describe("getInitials", () => {
  it("extrai até 2 iniciais de nome composto", () => {
    expect(getInitials("Ada Lovelace")).toBe("AL");
    expect(getInitials("Albert Einstein")).toBe("AE");
  });

  it("extrai 1 inicial de nome simples", () => {
    expect(getInitials("Goku")).toBe("G");
    expect(getInitials("Naruto")).toBe("N");
  });

  it("limita a 2 iniciais mesmo com nomes longos", () => {
    expect(getInitials("Neil deGrasse Tyson")).toBe("ND");
  });

  it("converte para uppercase", () => {
    const initials = getInitials("marie curie");
    expect(initials).toBe("MC");
  });
});
