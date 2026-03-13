/**
 * @file WebApp.test.tsx
 * @description Testes para o WebApp (orchestrator principal do /app).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

// Mock do service
const mockService = {
  loadPersonas: vi.fn().mockResolvedValue([
    { meta: { id: "test-1", display_name: "Persona A" }, _source: "remote" },
    { meta: { id: "test-2", display_name: "Persona B" }, _source: "remote" },
  ]),
  updatePersonasOnline: vi.fn().mockResolvedValue([]),
  deletePersona: vi.fn().mockResolvedValue(undefined),
  addPersonaFromJson: vi.fn().mockResolvedValue({}),
  invokeAI: vi.fn().mockResolvedValue("Resposta da IA"),
  checkOllama: vi.fn().mockResolvedValue(false),
  getApiKey: vi.fn().mockResolvedValue(""),
  saveApiKey: vi.fn().mockResolvedValue(undefined),
  deleteApiKey: vi.fn().mockResolvedValue(undefined),
  exportFile: vi.fn().mockResolvedValue(undefined),
};

vi.mock("@/providers/useService", () => ({
  useService: () => mockService,
}));

// Mock do Sidebar — usa props reais do WebApp: view, setView
vi.mock("@/components/app/Sidebar", () => ({
  default: ({ view, setView }: { view: string; setView: (v: string) => void }) => (
    <nav data-testid="sidebar">
      <button onClick={() => setView("home")}>Home</button>
      <button onClick={() => setView("personas")}>Personas</button>
      <span data-testid="active-view">{view}</span>
    </nav>
  ),
}));

// Mocks de Views compartilhados
vi.mock("@pbl/shared/components/views/HomeView", () => ({
  default: (props: Record<string, unknown>) => (
    <div data-testid="home-view">Home - {String(props.personaCount ?? 0)} personas</div>
  ),
}));
vi.mock("@pbl/shared/components/views/DashboardView", () => ({
  default: () => <div data-testid="dashboard-view">Dashboard</div>,
}));
vi.mock("@pbl/shared/components/views/HistoryView", () => ({
  default: () => <div data-testid="history-view">History</div>,
}));
vi.mock("@pbl/shared/components/views/SettingsView", () => ({
  default: () => <div data-testid="settings-view">Settings</div>,
}));
vi.mock("@/components/app/WebManagerWrapper", () => ({
  default: () => <div data-testid="manager-view">Manager</div>,
}));
vi.mock("@pbl/shared/components/Toast", () => ({
  default: () => <div data-testid="toast-container" />,
  toast: vi.fn(),
}));
vi.mock("@/hooks/useImportFile", () => ({
  useImportFile: () => ({ handleImportFile: vi.fn() }),
}));

import WebApp from "../pages/WebApp";

describe("WebApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renderiza sem erros", async () => {
    const { container } = render(<WebApp />);
    await waitFor(() => {
      expect(container.innerHTML.length).toBeGreaterThan(0);
    });
  });

  it("carrega personas na inicialização", async () => {
    render(<WebApp />);
    await waitFor(() => {
      expect(mockService.loadPersonas).toHaveBeenCalledTimes(1);
    });
  });

  it("carrega API key na inicialização", async () => {
    render(<WebApp />);
    await waitFor(() => {
      expect(mockService.getApiKey).toHaveBeenCalledTimes(1);
    });
  });

  it("renderiza sidebar", async () => {
    render(<WebApp />);
    await waitFor(() => {
      expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    });
  });

  it("renderiza toast container", async () => {
    render(<WebApp />);
    await waitFor(() => {
      expect(screen.getByTestId("toast-container")).toBeInTheDocument();
    });
  });

  it("inicia com a view home ativa", async () => {
    render(<WebApp />);
    await waitFor(() => {
      expect(screen.getByTestId("active-view")).toHaveTextContent("home");
    });
  });

  it("renderiza HomeView quando view é home", async () => {
    render(<WebApp />);
    await waitFor(() => {
      expect(screen.getByTestId("home-view")).toBeInTheDocument();
    });
  });

  it("trata erro ao carregar personas gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockService.loadPersonas.mockRejectedValueOnce(new Error("Network error"));
    render(<WebApp />);
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[PBL]"),
        expect.any(Error),
      );
    });
    consoleSpy.mockRestore();
  });

  it("trata erro ao carregar API key gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockService.getApiKey.mockRejectedValueOnce(new Error("Storage error"));
    render(<WebApp />);
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[PBL]"),
        expect.any(Error),
      );
    });
    consoleSpy.mockRestore();
  });

  it("exibe contagem de personas no HomeView após carregar", async () => {
    render(<WebApp />);
    await waitFor(() => {
      expect(screen.getByTestId("home-view")).toHaveTextContent("2 personas");
    });
  });
});
