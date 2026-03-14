/**
 * @module ServiceContext
 * @description React Context para injeção do adapter de serviço.
 */

import { createContext } from "react";
import type { IAppService } from "@/lib/services/types";

export const ServiceContext = createContext<IAppService>(null!);
