/**
 * @file MarketingLayout.test.tsx
 * @description Testes para MarketingLayout (Header, Footer, ScrollToTop).
 */

import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MarketingLayout from "../components/marketing/MarketingLayout";

// Wrapper helper com Router
function renderWithRouter(initialRoute = "/") {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <MarketingLayout />
    </MemoryRouter>,
  );
}

describe("MarketingLayout", () => {
  it("renderiza sem erros", () => {
    const { container } = renderWithRouter();
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });

  it("renderiza o header com logo PBL", () => {
    renderWithRouter();
    expect(screen.getAllByAltText("PBL").length).toBeGreaterThanOrEqual(1);
  });

  it("renderiza os links de navegação desktop", () => {
    renderWithRouter();
    expect(screen.getAllByText("Home").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Sobre").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Acessar App").length).toBeGreaterThan(0);
  });

  it("renderiza o footer com copyright", () => {
    renderWithRouter();
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });

  it("renderiza link do GitHub no footer", () => {
    renderWithRouter();
    expect(screen.getByText("GitHub")).toBeInTheDocument();
  });

  it("renderiza o botão de scroll-to-top (inicialmente invisível)", () => {
    renderWithRouter();
    const scrollBtn = screen.getByLabelText("Voltar ao topo");
    expect(scrollBtn).toBeInTheDocument();
    // Inicialmente invisível (opacity-0)
    expect(scrollBtn.className).toContain("opacity-0");
  });

  it("renderiza o botão hambúrguer mobile", () => {
    renderWithRouter();
    const menuBtn = screen.getByLabelText("Menu");
    expect(menuBtn).toBeInTheDocument();
  });

  it("abre menu mobile ao clicar no hambúrguer", () => {
    renderWithRouter();
    const menuBtn = screen.getByLabelText("Menu");
    fireEvent.click(menuBtn);
    // Após clicar, deve haver links de navegação dobrados (desktop + mobile)
    const homeLinks = screen.getAllByText("Home");
    expect(homeLinks.length).toBeGreaterThanOrEqual(2);
  });

  it("aplica classe ativa no link da rota atual", () => {
    renderWithRouter("/");
    const homeLinks = screen.getAllByText("Home");
    const activeLink = homeLinks.find((el) =>
      el.className.includes("text-accent"),
    );
    expect(activeLink).toBeTruthy();
  });

  it("footer contém link para Web App", () => {
    renderWithRouter();
    expect(screen.getByText("Web App")).toBeInTheDocument();
  });
});
