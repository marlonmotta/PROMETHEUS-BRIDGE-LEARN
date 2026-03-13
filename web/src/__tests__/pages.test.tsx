/**
 * @file pages.test.tsx
 * @description Testes para páginas estáticas (Landing, About).
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Landing e About são componentes de apresentação
// Testamos renderização e presença de elementos chave

describe("Landing", () => {
  it("renderiza a página de landing sem erro", async () => {
    const { default: Landing } = await import("../pages/Landing");
    const { container } = render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });

  it("contém link para o app", async () => {
    const { default: Landing } = await import("../pages/Landing");
    const { container } = render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );
    const links = container.querySelectorAll("a");
    const appLink = Array.from(links).find(
      (link) => link.getAttribute("href") === "/app",
    );
    expect(appLink).toBeTruthy();
  });
});

describe("About", () => {
  it("renderiza a página about sem erro", async () => {
    const { default: About } = await import("../pages/About");
    const { container } = render(
      <MemoryRouter>
        <About />
      </MemoryRouter>,
    );
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });
});
