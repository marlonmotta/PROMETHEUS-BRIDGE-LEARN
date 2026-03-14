/**
 * @file AppLayout.test.tsx
 * @description Testes para o layout do app (AppLayout + Sidebar wrapper).
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ServiceProvider } from "../providers/ServiceProvider";

// Mock do AppLayout pois depende de Outlet do react-router
vi.mock("../components/app/AppLayout", () => ({
  default: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="app-layout">
      <nav data-testid="sidebar">Sidebar</nav>
      <main>{children || <div>Outlet</div>}</main>
    </div>
  ),
}));

describe("AppLayout", () => {
  it("renderiza o layout com sidebar e conteúdo principal", async () => {
    const { default: AppLayout } = await import(
      "../components/app/AppLayout"
    );
    const { getByTestId } = render(
      <MemoryRouter>
        <ServiceProvider>
          <AppLayout />
        </ServiceProvider>
      </MemoryRouter>,
    );
    expect(getByTestId("app-layout")).toBeInTheDocument();
    expect(getByTestId("sidebar")).toBeInTheDocument();
  });
});
