/**
 * @module PersonasView
 * @description Tela de seleção de persona para adaptação de conteúdo.
 *
 * Exibe o catálogo completo de personas em um grid responsivo com suporte a:
 * - Busca por nome ou universo
 * - Filtros por categoria (fictícia/real), faixa etária e favoritos
 * - Preview da saudação da persona selecionada
 * - Avatares AI-gerados com lazy loading e fallback de iniciais
 *
 * ## Performance
 *
 * A lista filtrada é memoizada com `useMemo` para evitar recálculos
 * desnecessários a cada re-render. Isso é especialmente importante
 * durante a digitação no campo de busca, onde cada keystroke causa
 * re-render mas a filtragem é computação pura.
 */

import { memo, useState, useMemo } from "react";
import type { Persona } from "@pbl/shared/constants";
import Icon from "@pbl/shared/components/Icon";
import PersonaAvatar from "@pbl/shared/components/PersonaAvatar";

interface Props {
  /** Catálogo completo de personas disponíveis */
  personas: Persona[];
  /** Persona atualmente selecionada (destacada no grid) */
  selectedPersona: Persona | null;
  /** Set de IDs de personas marcadas como favoritas */
  favorites: Set<string>;
  /** Callback para adicionar/remover favorito */
  onToggleFavorite: (id: string) => void;
  /** Callback quando uma persona é selecionada no grid */
  onSelect: (p: Persona) => void;
  /** Callback para prosseguir para a tela de conteúdo */
  onUse: () => void;
  /** Base URL para os avatares (default: GitHub raw) */
  avatarBase?: string;
}

export default memo(function PersonasView({
  personas,
  selectedPersona,
  favorites,
  onToggleFavorite,
  onSelect,
  onUse,
  avatarBase,
}: Props) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterAge, setFilterAge] = useState("");
  const [filterFav, setFilterFav] = useState(false);

  /**
   * Lista filtrada e ordenada de personas.
   *
   * Memoizada para evitar recálculos a cada re-render.
   * Favoritas aparecem primeiro (sort estável).
   */
  const filtered = useMemo(() => {
    return personas
      .filter((p) => {
        const name = (p.meta?.display_name || "").toLowerCase();
        const univ = (p.character?.universe || "").toLowerCase();
        const q = search.toLowerCase();
        const matchQuery = !q || name.includes(q) || univ.includes(q);
        const matchCategory =
          !filterCategory || p.meta?.category === filterCategory;
        const matchAge = !filterAge || p.meta?.target_age_range === filterAge;
        const matchFav = !filterFav || favorites.has(p.meta?.id);
        return matchQuery && matchCategory && matchAge && matchFav;
      })
      .sort((a, b) => {
        // Favoritas primeiro
        const aFav = favorites.has(a.meta?.id) ? 0 : 1;
        const bFav = favorites.has(b.meta?.id) ? 0 : 1;
        return aFav - bFav;
      });
  }, [personas, search, filterCategory, filterAge, filterFav, favorites]);

  return (
    <section>
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-txt mb-1.5">
          Selecionar Persona
        </h1>
        <p className="text-sm text-txt-2">
          Escolha a persona que o aluno vai se conectar
        </p>
      </div>

      {/* Barra de filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 flex-wrap items-stretch sm:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar persona..."
          className="flex-1 min-w-0 bg-bg-2 border border-border rounded-sm text-txt text-[13px] px-3.5 py-2.5 outline-none focus:border-accent transition-colors"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-bg-2 border border-border rounded-sm text-txt text-[13px] px-3.5 py-2.5 outline-none focus:border-accent transition-colors"
        >
          <option value="">Todas categorias</option>
          <option value="fictional">Fictícias</option>
          <option value="real">Reais</option>
        </select>
        <select
          value={filterAge}
          onChange={(e) => setFilterAge(e.target.value)}
          className="bg-bg-2 border border-border rounded-sm text-txt text-[13px] px-3.5 py-2.5 outline-none focus:border-accent transition-colors"
        >
          <option value="">Todas idades</option>
          <option value="6-10">6-10 anos</option>
          <option value="11-14">11-14 anos</option>
          <option value="15-18">15-18 anos</option>
          <option value="18+">18+</option>
        </select>
        <button
          onClick={() => setFilterFav(!filterFav)}
          className={`text-[13px] px-3.5 py-2.5 rounded-sm border transition-colors ${filterFav ? "bg-gold/20 border-gold text-gold" : "bg-bg-2 border-border text-txt-2 hover:border-accent"}`}
        >
          <Icon name="star" size={14} fill={filterFav} /> Favoritas
        </button>
      </div>

      {/* Grid de personas */}
      {personas.length === 0 ? (
        /* Loading skeleton */
        <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4 mb-7">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="bg-bg-2 border border-border rounded p-4 animate-pulse"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-bg-3" />
                <div className="flex-1">
                  <div className="h-3.5 bg-bg-3 rounded w-3/4 mb-2" />
                  <div className="h-2.5 bg-bg-3 rounded w-1/2" />
                </div>
              </div>
              <div className="h-2.5 bg-bg-3 rounded w-full mb-2" />
              <div className="h-2.5 bg-bg-3 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4 mb-7">
          {filtered.map((p) => {
            const selected = selectedPersona?.meta?.id === p.meta?.id;
            const isFav = favorites.has(p.meta?.id);
            return (
              <div
                key={p.meta.id}
                onClick={() => onSelect(p)}
                className={`relative overflow-hidden bg-bg-2 border rounded p-4 cursor-pointer transition-all hover:border-accent hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(139,92,246,0.15)]
                ${selected ? "border-accent bg-accent/8" : "border-border"}`}
              >
                {/* Botão de favorito */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(p.meta.id);
                  }}
                  className={`absolute top-2.5 right-2.5 text-base transition-transform hover:scale-125 z-10 ${isFav ? "text-gold" : "text-txt-3/40 hover:text-gold/60"}`}
                >
                  <Icon name="star" size={16} fill={isFav} />
                </button>

                {/* Avatar + Info */}
                <div className="flex items-start gap-3 mb-2">
                  <PersonaAvatar persona={p} size={44} base={avatarBase} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-gold uppercase tracking-wider mb-0.5">
                      {p.character.universe}
                    </div>
                    <div className="text-sm font-semibold truncate">
                      {p.meta.display_name}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-txt-2 mb-2.5 leading-relaxed line-clamp-2">
                  {p.character.role}
                </div>
                <div className="flex gap-1 flex-wrap">
                  {(p.meta.tags || []).slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="bg-accent/12 border border-accent/20 text-accent text-[10px] px-2 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-txt-3 mt-2">
                  <Icon name="user" size={12} />
                  {p.meta.target_age_range}
                </div>
                {selected && (
                  <div className="absolute bottom-2.5 right-2.5 bg-accent text-white text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Icon name="check" size={10} /> Selecionada
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {filtered.length === 0 && personas.length > 0 && (
        <div className="p-10 text-center text-txt-3 bg-bg-2 border border-dashed border-border rounded">
          Nenhuma persona encontrada com esses filtros.
        </div>
      )}

      {/* Preview da persona selecionada */}
      {selectedPersona && (
        <div className="bg-bg-2 border border-border border-l-[3px] border-l-accent rounded p-5 mt-2">
          <div className="flex items-center gap-3 mb-3">
            <PersonaAvatar
              persona={selectedPersona}
              size={48}
              base={avatarBase}
            />
            <div>
              <div className="text-sm font-semibold text-txt flex items-center gap-1.5">
                {selectedPersona.meta.display_name}
                {favorites.has(selectedPersona.meta.id) && (
                  <Icon name="star" size={12} fill className="text-gold" />
                )}
              </div>
              <div className="text-[11px] text-txt-3">
                {selectedPersona.character.universe}
              </div>
            </div>
          </div>
          <div className="text-sm text-txt-2 leading-relaxed mb-4 italic">
            {selectedPersona.prompts?.greeting}
          </div>
          <button
            onClick={onUse}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm bg-accent text-white text-[13px] font-medium hover:bg-accent-2 transition-colors"
          >
            Usar essa persona →
          </button>
        </div>
      )}
    </section>
  );
});
