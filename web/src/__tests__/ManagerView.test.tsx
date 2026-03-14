/**
 * Testes de componente para ManagerView.
 *
 * Cobre: renderização da lista de personas, estado vazio,
 * importTrigger e botão de atualização online.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ManagerView from "@pbl/shared/components/views/ManagerView";
import type { Persona } from "@pbl/shared/constants";

function makePersona(id: string, name: string): Persona {
  return {
    meta: { id, display_name: name, tags: [] },
    character: { universe: "Teste", role: "professor" },
    _source: "local",
  };
}

const persona1 = makePersona("naruto", "Naruto Uzumaki");
const persona2 = makePersona("goku", "Goku");

function renderManager(overrides = {}) {
  const props = {
    personas: [],
    selectedPersona: null,
    importTrigger: <button>Importar</button>,
    onUpdateOnline: vi.fn().mockResolvedValue([]),
    onDeletePersona: vi.fn().mockResolvedValue(undefined),
    onPersonasChanged: vi.fn(),
    onSelectedPersonaChanged: vi.fn(),
    ...overrides,
  };
  render(<ManagerView {...props} />);
  return props;
}

describe("ManagerView", () => {
  it("renderiza o título 'Gerenciar Personas'", () => {
    renderManager();
    expect(screen.getByRole("heading", { name: /gerenciar personas/i })).toBeInTheDocument();
  });

  it("exibe mensagem de lista vazia quando não há personas locais", () => {
    renderManager({ personas: [] });
    expect(screen.getByText(/nenhuma persona importada/i)).toBeInTheDocument();
  });

  it("exibe personas locais na lista", () => {
    renderManager({ personas: [persona1, persona2] });
    expect(screen.getByText("Naruto Uzumaki")).toBeInTheDocument();
    expect(screen.getByText("Goku")).toBeInTheDocument();
  });

  it("exibe o importTrigger passado por prop", () => {
    renderManager();
    expect(screen.getByRole("button", { name: /importar/i })).toBeInTheDocument();
  });

  it("exibe botão 'Atualizar do GitHub'", () => {
    renderManager();
    expect(screen.getByRole("button", { name: /atualizar do github/i })).toBeInTheDocument();
  });

  it("botão 'Excluir Todas' fica desabilitado com lista vazia", () => {
    renderManager({ personas: [] });
    const btn = screen.getByRole("button", { name: /excluir todas/i });
    expect(btn).toBeDisabled();
  });

  it("abre modal de confirmação ao clicar no botão de excluir persona", () => {
    renderManager({ personas: [persona1] });
    // O botão de lixeira da persona - não tem texto, filtramos pelos conhecidos
    const allBtns = screen.getAllByRole("button");
    const deleteBtn = allBtns.find(
      (b) => !b.textContent?.match(/importar|atualizar|excluir todas/i)
    );
    if (deleteBtn) fireEvent.click(deleteBtn);
    expect(screen.getByText(/excluir persona\?/i)).toBeInTheDocument();
  });
});
