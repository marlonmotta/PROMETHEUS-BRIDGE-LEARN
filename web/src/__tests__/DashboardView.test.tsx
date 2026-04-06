/**
 * Testes de componente para DashboardView.
 *
 * Cobre: renderização, seleção de persona, textarea, botão "Adaptar Conteúdo"
 * (habilitado/desabilitado), estado de carregamento, importação condicional
 * e exibição de resultado.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DashboardView from "@pbl/shared/components/views/DashboardView";
import type { Persona, Settings } from "@pbl/shared/constants";

const defaultSettings: Settings = {
  provider: "openai",
  model: "gpt-4o",
  apiKey: "",
  mode: "online",
  outputFormat: "free",
  outputLanguage: "pt-BR",
  ollamaModel: "",
  ollamaUrl: "http://localhost:11434",
  interfaceLanguage: "pt-BR",
};

function makePersona(id: string, name: string): Persona {
  return {
    meta: { id, display_name: name },
    character: { universe: "Teste", role: "professor" },
    _source: "bundled",
  };
}

const persona = makePersona("naruto", "Naruto Uzumaki");

function renderDashboard(overrides = {}) {
  const props = {
    personas: [persona],
    selectedPersona: null,
    favorites: new Set<string>(),
    content: "",
    subject: "general",
    difficulty: "moderate",
    result: "",
    generating: false,
    settings: defaultSettings,
    onSelectPersona: vi.fn(),
    onToggleFavorite: vi.fn(),
    onContentChange: vi.fn(),
    onSubjectChange: vi.fn(),
    onDifficultyChange: vi.fn(),
    onGenerate: vi.fn(),
    onSaveHistory: vi.fn(),
    ...overrides,
  };
  render(<DashboardView {...props} />);
  return props;
}

describe("DashboardView", () => {
  it("renderiza a persona Naruto no seletor", () => {
    renderDashboard();
    // DashboardView shows only first name in the card (split(' ')[0])
    expect(screen.getByText("Naruto")).toBeInTheDocument();
  });

  it("exibe label 'Conteúdo educacional'", () => {
    renderDashboard();
    // Label contains a child button when onImportFile is provided; use exact:false
    const matches = screen.getAllByText(/Conteúdo educacional/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("dispara onContentChange ao digitar no textarea", () => {
    const { onContentChange } = renderDashboard();
    const textarea = screen.getByPlaceholderText(/Cole ou digite/i);
    fireEvent.change(textarea, { target: { value: "Fotossíntese" } });
    expect(onContentChange).toHaveBeenCalledWith("Fotossíntese");
  });

  it("dispara onSelectPersona ao clicar em uma persona", () => {
    const { onSelectPersona } = renderDashboard();
    // Persona card shows first name only, click the button containing it
    const allBtns = screen.getAllByRole("button");
    const personaBtn = allBtns.find((b) =>
      b.textContent?.includes("Naruto")
    );
    if (personaBtn) fireEvent.click(personaBtn);
    expect(onSelectPersona).toHaveBeenCalledWith(persona);
  });

  it("botão 'Adaptar Conteúdo' está desabilitado sem persona selecionada", () => {
    renderDashboard({ selectedPersona: null, content: "texto" });
    const btn = screen.getByRole("button", { name: /Adaptar Conteúdo/i });
    expect(btn).toBeDisabled();
  });

  it("botão 'Adaptar Conteúdo' está desabilitado sem conteúdo", () => {
    renderDashboard({ selectedPersona: persona, content: "" });
    const btn = screen.getByRole("button", { name: /Adaptar Conteúdo/i });
    expect(btn).toBeDisabled();
  });

  it("botão 'Adaptar Conteúdo' está habilitado com persona e conteúdo", () => {
    renderDashboard({ selectedPersona: persona, content: "Fotossíntese" });
    const btn = screen.getByRole("button", { name: /Adaptar Conteúdo/i });
    expect(btn).not.toBeDisabled();
  });

  it("dispara onGenerate ao clicar em 'Adaptar Conteúdo'", () => {
    const { onGenerate } = renderDashboard({
      selectedPersona: persona,
      content: "Fotossíntese",
    });
    fireEvent.click(screen.getByRole("button", { name: /Adaptar Conteúdo/i }));
    expect(onGenerate).toHaveBeenCalledOnce();
  });

  it("exibe 'Adaptando...' durante generating=true", () => {
    renderDashboard({
      generating: true,
      selectedPersona: persona,
      content: "texto",
    });
    expect(screen.getByText(/Adaptando/i)).toBeInTheDocument();
  });

  it("botão 'Importar arquivo' NÃO aparece sem onImportFile", () => {
    renderDashboard();
    expect(screen.queryByText(/Importar arquivo/i)).not.toBeInTheDocument();
  });

  it("botão 'Importar arquivo' aparece com onImportFile", () => {
    renderDashboard({ onImportFile: vi.fn() });
    expect(screen.getByText(/Importar arquivo/i)).toBeInTheDocument();
  });

  it("exibe resultado quando result está preenchido", () => {
    renderDashboard({ result: "Resultado adaptado pelo Naruto" });
    expect(
      screen.getByText("Resultado adaptado pelo Naruto")
    ).toBeInTheDocument();
  });
});
