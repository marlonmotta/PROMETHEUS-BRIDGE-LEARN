/**
 * @module DashboardView
 * @description Tela principal all-in-one do PBL.
 *
 * Layout em 3 painéis:
 * - **Persona Selector** (top-left): Grid 5×3 de personas com busca
 * - **Educational Content Input** (top-right): Assunto, conteúdo, botão adaptar
 * - **Adapted Content Output** (bottom): Resultado com avatar e ações
 */

import { memo, useState, useMemo, useEffect, useRef } from "react";
import { SUBJECTS, OUTPUT_FORMATS, type Persona, type Settings } from "@pbl/shared/constants";
import Icon from "@pbl/shared/components/Icon";
import PersonaAvatar from "@pbl/shared/components/PersonaAvatar";

/* ─── Props ─── */

interface Props {
  personas: Persona[];
  selectedPersona: Persona | null;
  favorites: Set<string>;
  content: string;
  subject: string;
  difficulty: string;
  result: string;
  generating: boolean;
  settings: Settings;
  avatarBase?: string;
  onSelectPersona: (p: Persona) => void;
  onToggleFavorite: (id: string) => void;
  onContentChange: (c: string) => void;
  onSubjectChange: (s: string) => void;
  onDifficultyChange: (d: string) => void;
  onSettingsChange?: (partial: Partial<Settings>) => void;
  onGenerate: () => void;
  onSaveHistory: () => void;
  onExport?: (format: string) => void;
  onImportFile?: () => void;
  resultSaved?: boolean;
}

/* ─── Component ─── */

export default memo(function DashboardView({
  personas,
  selectedPersona,
  favorites,
  content,
  subject,
  difficulty,
  result,
  generating,
  settings,
  avatarBase,
  onSelectPersona,
  onToggleFavorite,
  onContentChange,
  onSubjectChange,
  onDifficultyChange,
  onSettingsChange,
  onGenerate,
  onSaveHistory,
  onExport,
  onImportFile,
  resultSaved,
}: Props) {
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close filter dropdown on click outside
  useEffect(() => {
    if (!filterMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filterMenuOpen]);
  const [filter, setFilter] = useState<
    "all" | "fictional" | "real" | "favorites" | "6-10" | "11-14" | "15+"
  >("all");

  /** Filtered + sorted personas */
  /** Parses "11-14" → { min: 11, max: 14 }. Returns null on invalid input. */
  function parseAgeRange(range: string): { min: number; max: number } | null {
    const match = range.match(/^(\d+)\s*-\s*(\d+)$/);
    if (!match) {
      const single = parseInt(range, 10);
      return isNaN(single) ? null : { min: single, max: single };
    }
    return { min: parseInt(match[1], 10), max: parseInt(match[2], 10) };
  }

  /** Checks if two numeric ranges overlap */
  function rangesOverlap(a: { min: number; max: number }, b: { min: number; max: number }): boolean {
    return a.min <= b.max && b.min <= a.max;
  }

  const filtered = useMemo(() => {
    const AGE_FILTERS: Record<string, { min: number; max: number }> = {
      "6-10": { min: 6, max: 10 },
      "11-14": { min: 11, max: 14 },
      "15+": { min: 15, max: 99 },
    };

    return personas
      .filter((p) => {
        const name = (p.meta?.display_name || "").toLowerCase();
        const univ = (p.character?.universe || "").toLowerCase();
        const q = search.toLowerCase();
        if (q && !name.includes(q) && !univ.includes(q)) return false;

        if (filter === "fictional") return p.meta?.category === "fictional";
        if (filter === "real") return p.meta?.category === "real";
        if (filter === "favorites") return favorites.has(p.meta?.id);

        const ageFilter = AGE_FILTERS[filter];
        if (ageFilter) {
          const personaRange = parseAgeRange(p.meta?.target_age_range || "");
          return personaRange ? rangesOverlap(personaRange, ageFilter) : false;
        }
        return true;
      })
      .sort((a, b) => {
        const aFav = favorites.has(a.meta?.id) ? 0 : 1;
        const bFav = favorites.has(b.meta?.id) ? 0 : 1;
        if (aFav !== bFav) return aFav - bFav;
        return (a.meta?.display_name || "").localeCompare(
          b.meta?.display_name || "",
        );
      });
  }, [personas, search, favorites, filter]);

  /** Copy result to clipboard */
  function copyResult() {
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  /** Save to history (once per result) */
  function handleSave() {
    if (resultSaved) return;
    onSaveHistory();
  }

  const canGenerate = !!selectedPersona && !!content && !generating;

  const FILTERS = [
    { id: "all" as const, label: "Todos" },
    { id: "favorites" as const, label: "★ Favoritos" },
    { id: "fictional" as const, label: "Fictício" },
    { id: "real" as const, label: "Real" },
    { id: "6-10" as const, label: "Idade 6-10" },
    { id: "11-14" as const, label: "Idade 11-14" },
    { id: "15+" as const, label: "Idade 15+" },
  ];

  return (
    <section>
      {/* ── Top row: Persona Selector + Content Input ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-5 mb-5">
        {/* ── Persona Selector Panel ── */}
        <div className="bg-bg-2 border border-border rounded-lg p-4 xl:p-5 h-auto xl:h-[calc(100dvh-7rem)] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-txt">
              Seletor de Personas
            </h2>
            <span className="text-[11px] text-txt-3">
              {filtered.length} personas
            </span>
          </div>

          {/* Search + Filter menu */}
          <div className="flex items-center gap-2 mb-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar persona..."
              className="flex-1 bg-bg border border-border rounded-sm text-txt text-[12px] px-3 py-2 outline-none focus:border-accent transition-colors"
            />
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                className={`p-2 rounded border transition-colors ${
                  filter !== "all"
                    ? "bg-accent/15 border-accent text-accent"
                    : "border-border text-txt-3 hover:border-accent hover:text-accent"
                }`}
                title="Filtros"
                aria-label="Abrir filtros de personas"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="6" y1="12" x2="18" y2="12" />
                  <line x1="8" y1="18" x2="16" y2="18" />
                </svg>
              </button>
              {filterMenuOpen && (
                <div className="absolute right-0 top-full mt-1 bg-bg-2 border border-border rounded-md shadow-lg z-50 py-1 min-w-[140px]">
                  {FILTERS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setFilter(f.id);
                        setFilterMenuOpen(false);
                      }}
                      className={`w-full text-left text-[11px] px-3 py-1.5 transition-colors ${
                        filter === f.id
                          ? "bg-accent/15 text-accent"
                          : "text-txt-2 hover:bg-bg-3 hover:text-txt"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Scrollable Grid */}
          <div className="min-h-48 max-h-[40vh] xl:max-h-none xl:flex-1 xl:min-h-0 overflow-y-auto p-1 pr-1">
            {personas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                <Icon name="user" size={40} />
                <p className="text-[13px] text-txt-2 font-medium">
                  Nenhuma persona disponível
                </p>
                <p className="text-[12px] text-txt-3 max-w-xs">
                  Adicione personas pelo <strong>Gerenciador</strong> - importe
                  de um arquivo JSON ou baixe do GitHub para começar a usar o
                  app.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 xl:gap-4">
                {filtered.map((p) => {
                  const sel = selectedPersona?.meta?.id === p.meta?.id;
                  const isFav = favorites.has(p.meta?.id);
                  return (
                    <button
                      key={p.meta.id}
                      onClick={() => onSelectPersona(p)}
                      className={`group relative flex flex-col items-center gap-2 p-3 rounded-lg transition-all
                      ${sel ? "bg-accent/15 ring-2 ring-accent" : "hover:bg-bg-3"}`}
                    >
                      {isFav && (
                        <div className="absolute top-1 right-1 text-gold">
                          <Icon name="star" size={12} fill />
                        </div>
                      )}
                      <div className="relative">
                        <PersonaAvatar
                          persona={p}
                          size={80}
                          base={avatarBase}
                        />
                        {sel && (
                          <div className="absolute bottom-0 right-0 w-6 h-6 bg-accent rounded-full flex items-center justify-center border-2 border-bg-2">
                            <Icon name="check" size={12} />
                          </div>
                        )}
                      </div>
                      <span className="text-[12px] text-txt-2 truncate w-full text-center leading-tight">
                        {p.meta.display_name.split(" ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Persona Details */}
          {selectedPersona && (
            <div className="mt-4 pt-4 border-t border-border overflow-y-auto shrink min-h-0">
              {/* Top: Avatar + Name + Star */}
              <div className="flex items-center gap-4 mb-4">
                <PersonaAvatar
                  key={selectedPersona.meta.id}
                  persona={selectedPersona}
                  size={120}
                  base={avatarBase}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-bold text-txt">
                    {selectedPersona.meta.display_name}
                  </div>
                  <div className="text-[12px] text-gold mt-0.5">
                    {selectedPersona.character.universe}
                  </div>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {(selectedPersona.meta.tags || [])
                      .slice(0, 4)
                      .map((tag) => (
                        <span
                          key={tag}
                          className="bg-accent/12 border border-accent/20 text-accent text-[10px] px-2 py-0.5 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                  </div>
                </div>
                <button
                  onClick={() => onToggleFavorite(selectedPersona.meta.id)}
                  aria-label={favorites.has(selectedPersona.meta.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                  className={`shrink-0 transition-colors ${favorites.has(selectedPersona.meta.id) ? "text-gold" : "text-txt-3 hover:text-gold"}`}
                >
                  <Icon
                    name="star"
                    size={22}
                    fill={favorites.has(selectedPersona.meta.id)}
                  />
                </button>
              </div>

              {/* Info area */}
              <div className="bg-bg rounded-md border border-border p-4">
                <div className="text-[12px] text-txt-2 leading-relaxed mb-3">
                  {selectedPersona.character.role}
                </div>
                {selectedPersona.prompts?.greeting && (
                  <div className="text-[12px] text-txt-3 italic leading-relaxed mb-3 border-l-2 border-accent/30 pl-3">
                    "{selectedPersona.prompts.greeting}"
                  </div>
                )}
                <div className="flex items-center gap-4 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-txt-3">Categoria:</span>
                    <span className="text-accent font-medium">
                      {selectedPersona.meta?.category === "fictional"
                        ? "Fictício"
                        : "Real"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-txt-3">Idade:</span>
                    <span className="text-accent font-medium">
                      {selectedPersona.meta?.target_age_range || "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Educational Content Input Panel ── */}
        <div className="bg-bg-2 border border-border rounded-lg p-4 xl:p-5 flex flex-col h-auto xl:h-[calc(100dvh-7rem)] overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-txt">
              Entrada de Conteúdo Educacional
            </h2>
            <span className="text-[10px] text-txt-3 bg-bg border border-border rounded px-2 py-1 flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${settings.mode === "offline" ? "bg-ok" : settings.mode === "online" ? "bg-accent" : "bg-gold"}`}
              />
              {settings.mode === "offline"
                ? `Ollama · ${settings.ollamaModel || "-"}`
                : settings.mode === "online"
                  ? `${settings.provider || "Cloud"} · ${settings.model || "-"}`
                  : "Manual"}
            </span>
          </div>

          {/* Subject */}
          <div className="flex flex-col gap-1.5 mb-3">
            <label className="text-[11px] text-txt-2 font-medium">
              Disciplina: {SUBJECTS[subject] || "Selecione"}
            </label>
            <select
              value={subject}
              onChange={(e) => onSubjectChange(e.target.value)}
              className="bg-bg border border-border rounded-sm text-txt text-[12px] px-3 py-2 outline-none focus:border-accent transition-colors"
            >
              <option value="">Selecione a disciplina</option>
              {Object.entries(SUBJECTS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div className="flex flex-col gap-1.5 mb-3">
            <label className="text-[11px] text-txt-2 font-medium">
              Dificuldade
            </label>
            <select
              value={difficulty}
              onChange={(e) => onDifficultyChange(e.target.value)}
              className="bg-bg border border-border rounded-sm text-txt text-[12px] px-3 py-2 outline-none focus:border-accent transition-colors"
            >
              <option value="fundamental">Fundamental</option>
              <option value="medio">Médio</option>
              <option value="avancado">Avançado</option>
            </select>
          </div>

          {/* Output Format */}
          <div className="flex flex-col gap-1.5 mb-3">
            <label className="text-[11px] text-txt-2 font-medium">
              Formato de saída
            </label>
            <select
              value={settings.outputFormat}
              onChange={(e) => onSettingsChange?.({ outputFormat: e.target.value })}
              className="bg-bg border border-border rounded-sm text-txt text-[12px] px-3 py-2 outline-none focus:border-accent transition-colors"
            >
              {Object.entries(OUTPUT_FORMATS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Content textarea */}
          <div className="flex flex-col gap-1.5 flex-1 mb-4">
            <label className="text-[11px] text-txt-2 font-medium flex items-center gap-2">
              Conteúdo educacional
              {onImportFile && (
                <button
                  type="button"
                  onClick={onImportFile}
                  className="inline-flex items-center gap-1 text-[10px] text-accent hover:text-accent-2 transition-colors font-medium"
                  title="Importar arquivo (PDF, DOCX, TXT, MD) ou imagem (JPG, PNG)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Importar arquivo
                </button>
              )}
            </label>
            <textarea
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              placeholder="Cole ou digite aqui o conteúdo que será adaptado pela persona..."
              className="flex-1 min-h-[160px] bg-bg border border-border rounded-sm text-txt text-[12px] px-3.5 py-3 outline-none focus:border-accent transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Adapt button */}
          <button
            onClick={onGenerate}
            disabled={!canGenerate}
            className={`w-full py-3 rounded-md text-[14px] font-semibold transition-all flex items-center justify-center gap-2
              ${
                canGenerate
                  ? "bg-accent text-white hover:bg-accent-2 shadow-[0_4px_15px_rgba(139,92,246,0.3)]"
                  : "bg-bg-3 text-txt-3 cursor-not-allowed"
              }`}
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Adaptando...
              </>
            ) : (
              <>
                <Icon name="sparkles" size={16} />
                Adaptar Conteúdo
              </>
            )}
          </button>

          {/* ── Result Output (always visible) ── */}
          <div className="mt-4 pt-4 border-t border-border flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-semibold text-txt">
                Resultado
              </span>
              {result && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {onExport && (
                    <>
                      {["docx", "html", "md", "pdf"].map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => onExport(fmt)}
                          aria-label={`Exportar como ${fmt.toUpperCase()}`}
                          className="text-[10px] text-txt-3 border border-border rounded px-2 py-1 hover:border-accent hover:text-accent transition-colors uppercase"
                        >
                          {fmt}
                        </button>
                      ))}
                      <span className="w-px h-4 bg-border" />
                    </>
                  )}
                  <button
                    onClick={copyResult}
                    className="text-[10px] text-txt-3 border border-border rounded px-2 py-1 hover:border-accent hover:text-accent transition-colors flex items-center gap-1"
                  >
                    <Icon name={copied ? "check" : "copy"} size={11} />
                    {copied ? "Copiado" : "Copiar"}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={resultSaved}
                    className={`text-[10px] border rounded px-2 py-1 flex items-center gap-1 transition-colors ${
                      resultSaved
                        ? "text-ok border-ok/30 cursor-default"
                        : "text-txt-3 border-border hover:border-accent hover:text-accent"
                    }`}
                  >
                    <Icon name={resultSaved ? "check" : "save"} size={11} />{" "}
                    {resultSaved ? "Salvo" : "Salvar"}
                  </button>
                </div>
              )}
            </div>
            <div className="bg-bg border border-border rounded-md px-4 py-3 text-[12px] leading-relaxed whitespace-pre-wrap overflow-y-auto flex-1">
              {result ? (
                <span className="text-txt">{result}</span>
              ) : (
                <span className="text-txt-3 italic">
                  Selecione uma persona, insira o conteúdo educacional e clique
                  em "Adaptar Conteúdo" para gerar o resultado adaptado aqui.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});
