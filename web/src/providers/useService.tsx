/**
 * @module useService
 * @description Hook para acessar o adapter de serviço injetado pelo ServiceProvider.
 */

import { useContext } from "react";
import type { IAppService } from "@/lib/services/types";
import { ServiceContext } from "./ServiceContext";

export function useService(): IAppService {
  const ctx = useContext(ServiceContext);
  if (!ctx) throw new Error("useService must be used within ServiceProvider");
  return ctx;
}
