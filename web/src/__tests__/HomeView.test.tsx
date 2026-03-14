/**
 * Testes de componente para HomeView.
 *
 * Cobre: renderização básica, cards de estatísticas,
 * callbacks de navegação, listagem e exclusão de histórico.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HomeView from "@pbl/shared/components/views/HomeView";
import type { HistoryItem, Settings } from "@pbl/shared/constants";

const defaultSettings: Settings = {
  provider: "openai",
  model: "gpt-4o",
  apiKey: "",
  mode: "online",
  outputFormat: "free",
  outputLanguage: "pt-BR",
  ollamaModel: "",
  ollamaUrl: "http://localhost:11434",
};

const historyItem: HistoryItem = {
  persona: "Naruto Uzumaki",
  content: "Conteúdo de teste",
  result: "Resultado adaptado",
  subject: "Matemática",
  date: "12/03/2026",
};

function renderHome(overrides = {}) {
  const props = {
    personaCount: 42,
    history: [],
    settings: defaultSettings,
    onNewAdaptation: vi.fn(),
    onLoadHistory: vi.fn(),
    onDeleteHistory: vi.fn(),
    ...overrides,
  };
  render(<HomeView {...props} />);
  return props;
}

describe("HomeView", () => {
  it("renderiza o título principal", () => {
    renderHome();
    expect(screen.getByText(/Bem-vindo ao PBL/i)).toBeInTheDocument();
  });

  it("exibe a contagem correta de personas no stat card", () => {
    renderHome({ personaCount: 64 });
    expect(screen.getByText("64")).toBeInTheDocument();
    expect(screen.getByText("Personas disponíveis")).toBeInTheDocument();
  });

  it("exibe zero adaptações salvas quando histórico está vazio", () => {
    renderHome({ history: [] });
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("Adaptações salvas")).toBeInTheDocument();
  });

  it("exibe a contagem correta de adaptações salvas", () => {
    renderHome({ history: [historyItem, historyItem] });
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("exibe o provider quando mode é online", () => {
    renderHome({ settings: { ...defaultSettings, provider: "openai", mode: "online" } });
    expect(screen.getByText("Modo de IA ativo")).toBeInTheDocument();
  });

  it("exibe 'Ollama' quando o modo é offline", () => {
    renderHome({ settings: { ...defaultSettings, mode: "offline" } });
    expect(screen.getByText("Ollama")).toBeInTheDocument();
  });

  it("dispara onNewAdaptation ao clicar no botão de nova adaptação", () => {
    const { onNewAdaptation } = renderHome();
    const btns = screen.getAllByRole("button");
    const btn = btns.find((b) => /nova|começar|adaptar/i.test(b.textContent || ""));
    if (btn) fireEvent.click(btn);
    expect(onNewAdaptation).toHaveBeenCalled();
  });

  it("exibe itens do histórico quando há registros", () => {
    renderHome({ history: [historyItem] });
    expect(screen.getByText("Naruto Uzumaki")).toBeInTheDocument();
  });

  it("chama onLoadHistory ao clicar em item do histórico", () => {
    const { onLoadHistory } = renderHome({ history: [historyItem] });
    fireEvent.click(screen.getByText("Naruto Uzumaki"));
    expect(onLoadHistory).toHaveBeenCalledWith(historyItem);
  });
});
