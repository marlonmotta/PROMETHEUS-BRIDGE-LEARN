/**
 * Testes de componente para SettingsView.
 *
 * Cobre: renderização do formulário, label de plataforma,
 * seção de histórico e botão de salvar.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SettingsView from "@pbl/shared/components/views/SettingsView";
import type { Settings } from "@pbl/shared/constants";

const defaultSettings: Settings = {
  provider: "openai",
  model: "gpt-5.4",
  apiKey: "",
  mode: "online",
  outputFormat: "free",
  outputLanguage: "pt-BR",
  ollamaModel: "",
  ollamaUrl: "http://localhost:11434",
};

function renderSettings(overrides = {}) {
  const props = {
    settings: defaultSettings,
    onSave: vi.fn(),
    history: [],
    onDeleteHistory: vi.fn(),
    onClearHistory: vi.fn(),
    ...overrides,
  };
  render(<SettingsView {...props} />);
  return props;
}

describe("SettingsView", () => {
  it("renderiza o título de configurações", () => {
    renderSettings();
    expect(screen.getByRole("heading", { name: /configurações/i })).toBeInTheDocument();
  });

  it("exibe 'Web' como plataforma por padrão", () => {
    renderSettings();
    expect(screen.getByText("Web")).toBeInTheDocument();
  });

  it("exibe 'Desktop' quando platform='Desktop'", () => {
    renderSettings({ platform: "Desktop" });
    expect(screen.getByText("Desktop")).toBeInTheDocument();
  });

  it("botão salvar está presente", () => {
    renderSettings();
    expect(screen.getByRole("button", { name: /salvar/i })).toBeInTheDocument();
  });

  it("exibe seção de histórico", () => {
    renderSettings();
    expect(screen.getByText(/Histórico de Adaptações/i)).toBeInTheDocument();
  });

  it("exibe mensagem quando histórico está vazio", () => {
    renderSettings({ history: [] });
    expect(
      screen.getByText(/Nenhuma adaptação salva/i)
    ).toBeInTheDocument();
  });
});
