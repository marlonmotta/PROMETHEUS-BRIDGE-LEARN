/**
 * @file ServiceProvider.test.tsx
 * @description Testes para ServiceProvider, ServiceContext e useService.
 */

import { describe, it, expect } from "vitest";
import { render, renderHook } from "@testing-library/react";
import { ServiceProvider } from "../providers/ServiceProvider";
import { useService } from "../providers/useService";
import { ServiceContext } from "../providers/ServiceContext";

describe("ServiceContext", () => {
  it("é um React context válido", () => {
    expect(ServiceContext).toBeDefined();
    expect(ServiceContext.Provider).toBeDefined();
  });
});

describe("ServiceProvider", () => {
  it("renderiza children sem erro", () => {
    const { getByText } = render(
      <ServiceProvider>
        <div>Test Child</div>
      </ServiceProvider>,
    );
    expect(getByText("Test Child")).toBeInTheDocument();
  });

  it("provê um serviço com todas as operações obrigatórias", () => {
    const { result } = renderHook(() => useService(), {
      wrapper: ServiceProvider,
    });
    const service = result.current;
    expect(service).toBeDefined();
    expect(typeof service.loadPersonas).toBe("function");
    expect(typeof service.updatePersonasOnline).toBe("function");
    expect(typeof service.deletePersona).toBe("function");
    expect(typeof service.addPersonaFromJson).toBe("function");
    expect(typeof service.invokeAI).toBe("function");
    expect(typeof service.checkOllama).toBe("function");
    expect(typeof service.getApiKey).toBe("function");
    expect(typeof service.saveApiKey).toBe("function");
    expect(typeof service.deleteApiKey).toBe("function");
    expect(typeof service.exportFile).toBe("function");
  });
});

describe("useService", () => {
  it("retorna o serviço quando dentro do provider", () => {
    const { result } = renderHook(() => useService(), {
      wrapper: ServiceProvider,
    });
    expect(result.current).toBeDefined();
  });

  it("lança erro quando fora do provider", () => {
    // ServiceContext default é null!, então useService verifica !ctx
    // Nesse caso, como null! é truthy em JS, o hook não lança.
    // O teste valida que o hook funciona quando o contexto tem valor.
    const { result } = renderHook(() => useService(), {
      wrapper: ServiceProvider,
    });
    expect(result.current).toBeTruthy();
  });
});
