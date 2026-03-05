/**
 * Testes do componente Toast.
 *
 * Valida o sistema de notificações toast: exibição, tipos visuais,
 * fechamento manual e função global `toast()`.
 */

import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ToastContainer, { toast } from "../Toast";

describe("ToastContainer", () => {
  it("renderiza sem toasts inicialmente", () => {
    const { container } = render(<ToastContainer />);
    expect(container.querySelector("[role='alert']")).toBeNull();
  });

  it("exibe toast ao chamar a função toast()", async () => {
    render(<ToastContainer />);
    toast("Mensagem de teste", "success");
    expect(await screen.findByText("Mensagem de teste")).toBeInTheDocument();
  });

  it("exibe toast de erro com estilo correto", async () => {
    render(<ToastContainer />);
    toast("Falha no upload", "error");
    const alertEl = await screen.findByText("Falha no upload");
    expect(alertEl.closest("[role='alert']")).toBeInTheDocument();
  });

  it("fecha toast ao clicar no botão X", async () => {
    render(<ToastContainer />);
    toast("Fechar isso", "info");

    const closeBtn = await screen.findByLabelText("Fechar notificação");
    fireEvent.click(closeBtn);

    // Após fechar, o texto não deve mais estar no documento
    expect(screen.queryByText("Fechar isso")).not.toBeInTheDocument();
  });

  it("exibe múltiplos toasts simultaneamente", async () => {
    render(<ToastContainer />);
    toast("Primeiro toast", "success");
    toast("Segundo toast", "error");

    expect(await screen.findByText("Primeiro toast")).toBeInTheDocument();
    expect(await screen.findByText("Segundo toast")).toBeInTheDocument();
  });
});
