/**
 * @module ServiceProvider
 * @description Provider que injeta o adapter de serviço correto via Context.
 *
 * Na versão web, sempre retorna o WebAdapter.
 * Se futuramente houver um TauriAdapter, basta trocar aqui
 * com base em `window.__TAURI__`.
 */

import { useMemo, type ReactNode } from "react";
import { WebAdapter } from "@/lib/services/web-adapter";
import { ServiceContext } from "./ServiceContext";

export function ServiceProvider({ children }: { children: ReactNode }) {
  const service = useMemo(() => new WebAdapter(), []);

  return (
    <ServiceContext.Provider value={service}>
      {children}
    </ServiceContext.Provider>
  );
}
