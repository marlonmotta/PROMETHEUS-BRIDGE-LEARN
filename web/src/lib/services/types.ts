/**
 * @module IAppService
 * @description Interface do serviço de aplicação (Ports & Adapters).
 *
 * Define o contrato que todas as implementações (WebAdapter, TauriAdapter, etc.)
 * devem seguir. Cada adapter implementa essas operações usando os mecanismos
 * da sua plataforma.
 */

import type { Persona } from "@pbl/shared/constants";

/** Parâmetros para invocação de IA */
export interface AIRequest {
  mode: "offline" | "online" | "manual";
  provider: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  userContent: string;
}

/** Interface do serviço de aplicação */
export interface IAppService {
  // ── Personas ──
  loadPersonas(): Promise<Persona[]>;
  updatePersonasOnline(): Promise<Persona[]>;
  invalidatePersonasCache(): void;
  deletePersona(id: string): Promise<void>;
  addPersonaFromJson(jsonStr: string): Promise<Persona>;

  // ── AI ──
  invokeAI(params: AIRequest): Promise<string>;
  checkOllama(): Promise<boolean>;

  // ── Storage ──
  getApiKey(): Promise<string>;
  saveApiKey(apiKey: string): Promise<void>;
  deleteApiKey(): Promise<void>;

  // ── Export ──
  exportFile(content: string, format: string, filename: string): Promise<void>;
}

