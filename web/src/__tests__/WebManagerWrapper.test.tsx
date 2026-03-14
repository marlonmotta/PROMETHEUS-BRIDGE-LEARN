/**
 * @file WebManagerWrapper.test.tsx
 * @description Testes para o WebManagerWrapper (wrapper web do ManagerView).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockService = {
  loadPersonas: vi.fn(),
  updatePersonasOnline: vi.fn().mockResolvedValue([]),
  deletePersona: vi.fn().mockResolvedValue(undefined),
  addPersonaFromJson: vi.fn().mockResolvedValue({}),
  invokeAI: vi.fn(),
  checkOllama: vi.fn(),
  getApiKey: vi.fn(),
  saveApiKey: vi.fn(),
  deleteApiKey: vi.fn(),
  exportFile: vi.fn(),
};

vi.mock("@/providers/useService", () => ({
  useService: () => mockService,
}));

// Mock do SharedManagerView para isolar o wrapper
vi.mock("@pbl/shared/components/views/ManagerView", () => ({
  default: ({
    importTrigger,
    onUpdateOnline,
    onDeletePersona,
  }: {
    importTrigger: React.ReactNode;
    onUpdateOnline: () => void;
    onDeletePersona: (id: string) => void;
  }) => (
    <div data-testid="shared-manager">
      <div data-testid="import-trigger">{importTrigger}</div>
      <button data-testid="update-btn" onClick={onUpdateOnline}>
        Update
      </button>
      <button
        data-testid="delete-btn"
        onClick={() => onDeletePersona("test-id")}
      >
        Delete
      </button>
    </div>
  ),
}));

vi.mock("@pbl/shared/components/Toast", () => ({
  toast: vi.fn(),
}));

import ManagerView from "../components/app/WebManagerWrapper";
import { toast } from "@pbl/shared/components/Toast";

describe("WebManagerWrapper", () => {
  const defaultProps = {
    personas: [
      { meta: { id: "p1", display_name: "Persona 1" } },
    ] as Parameters<typeof ManagerView>[0]["personas"],
    setPersonas: vi.fn(),
    selectedPersona: null,
    setSelectedPersona: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza sem erros", () => {
    const { container } = render(<ManagerView {...defaultProps} />);
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });

  it("renderiza o SharedManagerView", () => {
    render(<ManagerView {...defaultProps} />);
    expect(screen.getByTestId("shared-manager")).toBeInTheDocument();
  });

  it("renderiza o trigger de importação com botão", () => {
    render(<ManagerView {...defaultProps} />);
    expect(screen.getByText("Importar do arquivo")).toBeInTheDocument();
  });

  it("renderiza input file hidden", () => {
    render(<ManagerView {...defaultProps} />);
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
    expect(input?.getAttribute("accept")).toBe(".json");
  });

  it("chama updatePersonasOnline ao clicar Update", async () => {
    render(<ManagerView {...defaultProps} />);
    fireEvent.click(screen.getByTestId("update-btn"));
    expect(mockService.updatePersonasOnline).toHaveBeenCalled();
  });

  it("chama deletePersona ao clicar Delete", () => {
    render(<ManagerView {...defaultProps} />);
    fireEvent.click(screen.getByTestId("delete-btn"));
    expect(mockService.deletePersona).toHaveBeenCalledWith("test-id");
  });

  it("processa importação de arquivo JSON válido", async () => {
    mockService.addPersonaFromJson.mockResolvedValueOnce({});
    render(<ManagerView {...defaultProps} />);

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const validJson = JSON.stringify({
      meta: { id: "new-persona", display_name: "Nova Persona" },
    });
    const file = new File([validJson], "persona.json", {
      type: "application/json",
    });

    // Simula file change
    Object.defineProperty(input, "files", { value: [file], writable: true });
    fireEvent.change(input);

    await waitFor(() => {
      expect(mockService.addPersonaFromJson).toHaveBeenCalledWith(validJson);
    });

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.stringContaining("importada com sucesso"),
        "success",
      );
    });
  });

  it("mostra erro para JSON inválido", async () => {
    render(<ManagerView {...defaultProps} />);

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(["invalid json"], "bad.json", {
      type: "application/json",
    });

    Object.defineProperty(input, "files", { value: [file], writable: true });
    fireEvent.change(input);

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.stringContaining("Erro na importação"),
        "error",
      );
    });
  });
});
