/**
 * @module PersonaAvatar
 * @description Componente de avatar de persona com fallback de iniciais.
 *
 * Renderiza a imagem do avatar da persona. Se a imagem falhar ao carregar
 * (404, rede indisponível), exibe um circle com iniciais coloridas geradas
 * a partir do ID da persona (cor determinística via hash).
 *
 * ## Uso
 *
 * ```tsx
 * <PersonaAvatar persona={persona} size={44} base={avatarBase} />
 * ```
 */

import { useState } from "react";
import type { Persona } from "@pbl/shared/constants";

const AVATAR_BASE_DEFAULT =
  "https://raw.githubusercontent.com/marlonmotta/PROMETHEUS-BRIDGE-LEARN/main/personas/avatars";

/** Gera uma cor HSL consistente a partir de uma string (hash determinístico) */
export function idToColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++)
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 60%, 45%)`;
}

/** Extrai as iniciais (até 2 letras) do display_name */
export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

interface Props {
  persona: Persona;
  size?: number;
  base?: string;
}

export default function PersonaAvatar({
  persona,
  size = 40,
  base = AVATAR_BASE_DEFAULT,
}: Props) {
  const [failed, setFailed] = useState(false);
  const id = persona.meta?.id || "";
  const name = persona.meta?.display_name || "?";
  const src = `${base}/${id}.webp`;

  if (failed || !id) {
    return (
      <div
        className="rounded-full flex items-center justify-center font-bold text-white shrink-0 aspect-square"
        style={{
          width: size,
          height: size,
          backgroundColor: idToColor(id || name),
          fontSize: size * 0.38,
        }}
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
      className="rounded-full object-cover shrink-0 aspect-square"
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    />
  );
}
