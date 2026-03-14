/**
 * Testes do componente Sidebar.
 *
 * Valida: renderização dos items de navegação, callback de setView,
 * mobile hamburger, branding e acessibilidade.
 *
 * Nota: "Conteúdo" e "Resultado" foram removidos do Sidebar (Phase 5 refactor).
 * A navegação agora tem 5 items: Home, Personas, Histórico, Gerenciador, Configurações.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Sidebar from "@/components/app/Sidebar";

/** Wrapper para prover o Router necessário para o <Link> no Sidebar */
function renderSidebar(props = {}) {
  const defaultProps = {
    view: "home" as const,
    setView: vi.fn(),
    hasPersona: false,
    hasResult: false,
    ...props,
  };
  return render(
    <MemoryRouter>
      <Sidebar {...defaultProps} />
    </MemoryRouter>,
  );
}

describe("Sidebar", () => {
  // ── Navegação ──

  it("renderiza os 5 items de navegação", () => {
    renderSidebar();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Personas")).toBeInTheDocument();
    expect(screen.getByText("Histórico")).toBeInTheDocument();
    expect(screen.getByText("Gerenciador")).toBeInTheDocument();
    expect(screen.getByText("Configurações")).toBeInTheDocument();
  });

  it("marca o item ativo com aria-current='page'", () => {
    renderSidebar({ view: "personas" });
    const personasBtn = screen.getByText("Personas").closest("button");
    expect(personasBtn).toHaveAttribute("aria-current", "page");
  });

  it("chama setView ao clicar num item", () => {
    const setView = vi.fn();
    renderSidebar({ setView });
    fireEvent.click(screen.getByText("Personas"));
    expect(setView).toHaveBeenCalledWith("personas");
  });

  it("chama setView com 'history' ao clicar em Histórico", () => {
    const setView = vi.fn();
    renderSidebar({ setView });
    fireEvent.click(screen.getByText("Histórico"));
    expect(setView).toHaveBeenCalledWith("history");
  });

  // ── Branding ──

  it("exibe o logo PBL", () => {
    renderSidebar();
    expect(screen.getByText("PBL")).toBeInTheDocument();
    expect(screen.getByText("PROMETHEUS · BRIDGE · LEARN")).toBeInTheDocument();
  });

  it("exibe indicador Web", () => {
    renderSidebar();
    expect(screen.getByText("Web")).toBeInTheDocument();
  });

  // ── Mobile ──

  it("renderiza botão hamburger para mobile", () => {
    renderSidebar();
    expect(screen.getByLabelText("Abrir menu")).toBeInTheDocument();
  });

  it("renderiza botão fechar quando sidebar está aberta", () => {
    renderSidebar();
    // Abre o menu
    fireEvent.click(screen.getByLabelText("Abrir menu"));
    expect(screen.getByLabelText("Fechar menu")).toBeInTheDocument();
  });

  // ── Acessibilidade ──

  it("tem role=navigation na sidebar", () => {
    renderSidebar();
    expect(
      screen.getByRole("navigation", { name: /Navegação principal/ }),
    ).toBeInTheDocument();
  });
});
