/**
 * @module Icon
 * @description Componente de ícones SVG inline do PBL.
 *
 * Utiliza paths SVG inline ao invés de uma biblioteca de ícones para
 * manter o bundle mínimo (zero dependências externas para ícones).
 * Todos os ícones seguem o padrão Lucide/Feather (24x24 viewBox, 2px stroke).
 *
 * ## Adicionando novos ícones
 *
 * 1. Encontre o path SVG no site do Lucide (lucide.dev)
 * 2. Adicione a entrada no objeto `ICON_PATHS` abaixo
 * 3. O tipo será automaticamente inferido pelo TypeScript
 */

/**
 * Mapa de nome → path SVG para cada ícone disponível.
 * A key é usada como `name` no componente Icon.
 */
const ICON_PATHS: Record<string, string> = {
  copy: "M8 4H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2 M8 4a2 2 0 012-2h6a2 2 0 012 2v0a2 2 0 01-2 2H10a2 2 0 01-2-2z",
  save: "M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z M17 21v-8H7v8 M7 3v5h8",
  refresh: "M1 4v6h6 M23 20v-6h-6 M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15",
  trash:
    "M3 6h18 M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2 M10 11v6 M14 11v6",
  download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3",
  print:
    "M6 9V2h12v7 M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2 M6 14h12v8H6z",
  info: "M12 22a10 10 0 100-20 10 10 0 000 20z M12 16v-4 M12 8h.01",
  check: "M20 6L9 17l-5-5",
  x: "M18 6L6 18 M6 6l12 12",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  "star-off":
    "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  lock: "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z M7 11V7a5 5 0 0110 0v4",
};

interface Props {
  /** Nome do ícone (deve corresponder a uma key em `ICON_PATHS`) */
  name: keyof typeof ICON_PATHS;
  /** Tamanho em pixels (largura e altura) */
  size?: number;
  /** Classes CSS adicionais para estilização */
  className?: string;
  /** Se `true`, preenche o ícone com a cor atual ao invés de stroke */
  fill?: boolean;
}

/**
 * Renderiza um ícone SVG inline com tamanho e estilo configuráveis.
 *
 * @example
 * ```tsx
 * <Icon name="check" size={16} className="text-ok" />
 * <Icon name="star" size={14} fill />
 * ```
 */
export default function Icon({ name, size = 16, className = "", fill = false }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}
