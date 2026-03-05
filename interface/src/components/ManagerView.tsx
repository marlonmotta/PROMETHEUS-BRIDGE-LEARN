/**
 * @module ManagerView
 * @description Painel de gerenciamento do catálogo de personas.
 *
 * Permite ao professor:
 * - Importar personas de arquivos JSON locais
 * - Atualizar o catálogo baixando novas personas do repositório GitHub
 * - Excluir personas locais (personas embutidas são protegidas)
 * - Buscar e filtrar personas por nome
 *
 * ## Fluxo de Importação
 *
 * 1. Usuário clica em "Importar do arquivo"
 * 2. `openFilePicker` abre o seletor nativo de arquivos
 * 3. O conteúdo JSON é lido no frontend e validado
 * 4. O JSON é enviado ao backend Rust via `add_persona_from_json`
 * 5. A persona é salva em `app_data_dir/personas/` e adicionada ao catálogo
 *
 * ## Segurança
 *
 * - O JSON importado é validado antes de ser aceito (campos obrigatórios)
 * - O backend sanitiza o ID da persona antes de usá-lo como nome de arquivo
 * - Apenas personas locais podem ser excluídas (embutidas são imutáveis)
 */

import { useState } from "react";
import { invoke, openFilePicker } from "../lib/tauri";
import type { Persona } from "../lib/constants";
import Icon from "./Icon";
import { toast } from "./Toast";

interface Props {
  /** Catálogo completo de personas (embutidas + locais) */
  personas: Persona[];
  /** Setter do estado de personas no componente pai */
  setPersonas: React.Dispatch<React.SetStateAction<Persona[]>>;
  /** Persona atualmente selecionada (pode ser null) */
  selectedPersona: Persona | null;
  /** Setter da persona selecionada no componente pai */
  setSelectedPersona: React.Dispatch<React.SetStateAction<Persona | null>>;
}

export default function ManagerView({
  personas,
  setPersonas,
  selectedPersona,
  setSelectedPersona,
}: Props) {
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Persona | null>(null);

  /** Filtra personas por nome (case-insensitive) */
  const filtered = personas.filter((p) => {
    const name = (p.meta?.display_name || "").toLowerCase();
    return !search || name.includes(search.toLowerCase());
  });

  /**
   * Importa uma persona a partir de um arquivo JSON selecionado pelo usuário.
   *
   * O JSON é lido no frontend (via File API) e validado localmente antes
   * de ser enviado ao backend. Isso permite feedback imediato ao usuário
   * sem depender do Rust para validações básicas.
   */
  async function importFromFile() {
    const text = await openFilePicker(".json");
    if (!text) return;

    try {
      const json = JSON.parse(text) as Persona;

      // Validação local dos campos obrigatórios
      if (!json.meta?.id) throw new Error("Campo meta.id ausente no JSON");
      if (!json.meta?.display_name) {
        throw new Error("Campo meta.display_name ausente no JSON");
      }

      // Persiste no backend (sanitização do ID é feita no Rust)
      try {
        await invoke("add_persona_from_json", { jsonStr: text });
      } catch (backendErr) {
        console.warn("[PBL] Falha ao persistir persona no backend:", backendErr);
        toast("Persona adicionada temporariamente (não foi possível salvar no disco)", "info");
      }

      // Atualiza o catálogo local (merge por ID)
      setPersonas((prev) => {
        const idx = prev.findIndex((p) => p.meta?.id === json.meta.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...json, _source: "local" };
          return updated;
        }
        return [...prev, { ...json, _source: "local" }];
      });
      toast(`"${json.meta.display_name}" importada com sucesso`, "success");
    } catch (e: unknown) {
      toast(`Erro na importação: ${(e as Error).message}`, "error");
    }
  }

  /**
   * Baixa novas personas do repositório GitHub via manifest.json.
   *
   * O backend compara o manifest remoto com as personas locais e baixa
   * apenas as que ainda não existem, implementando atualização incremental.
   */
  async function updateOnline() {
    setUpdating(true);
    try {
      const novas = await invoke<Persona[]>("update_personas_online");
      if (novas && novas.length > 0) {
        const ids = new Set(novas.map((p) => p.meta?.id));
        setPersonas((prev) => [
          ...prev.filter((p) => !ids.has(p.meta?.id)),
          ...novas.map((p) => ({ ...p, _source: "local" })),
        ]);
        toast(`${novas.length} persona(s) nova(s) baixada(s) do GitHub`, "success");
      } else {
        toast("Tudo atualizado. Nenhuma persona nova no repositório.", "info");
      }
    } catch (e) {
      toast(`Falha ao conectar ao GitHub: ${e}`, "error");
    }
    setUpdating(false);
  }

  /**
   * Executa a exclusão da persona selecionada para deleção.
   *
   * Remove do disco via backend e do estado local. Se a persona excluída
   * era a selecionada para adaptação, limpa a seleção.
   */
  async function doDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.meta?.id;
    try {
      await invoke("delete_persona", { id });
      setPersonas((prev) => prev.filter((p) => p.meta?.id !== id));
      if (selectedPersona?.meta?.id === id) setSelectedPersona(null);
      toast("Persona excluída com sucesso", "success");
    } catch (e) {
      toast(`Erro ao excluir persona: ${e}`, "error");
    }
    setDeleteTarget(null);
  }

  return (
    <section>
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-txt mb-1.5">Gerenciador de Personas</h1>
        <p className="text-sm text-txt-2">Gerencie todas as personas disponíveis</p>
      </div>

      <div className="flex gap-3 mb-5">
        <button
          onClick={importFromFile}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-sm bg-accent text-white text-[13px] font-medium hover:bg-accent-2 transition-colors"
        >
          <Icon name="download" size={15} /> Importar do arquivo
        </button>
        <button
          onClick={updateOnline}
          disabled={updating}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-sm bg-bg-3 text-txt text-[13px] border border-border hover:border-accent transition-colors disabled:opacity-40"
        >
          <Icon name="refresh" size={15} /> {updating ? "Atualizando..." : "Atualizar do GitHub"}
        </button>
      </div>

      <div className="mb-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar..."
          className="w-80 bg-bg-2 border border-border rounded-sm text-txt text-[13px] px-3.5 py-2.5 outline-none focus:border-accent transition-colors"
        />
      </div>

      <div className="flex flex-col gap-2">
        {filtered.map((p) => (
          <div
            key={p.meta.id}
            className="bg-bg-2 border border-border rounded-sm px-4 py-3.5 flex items-center justify-between gap-3 hover:border-border transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="text-sm font-semibold">{p.meta.display_name}</div>
              <div className="text-[10px] text-gold uppercase tracking-wider">
                {p.character?.universe}
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] text-txt-3">
                {p._source === "local" ? (
                  <>
                    <Icon name="download" size={11} /> Local
                  </>
                ) : (
                  <>
                    <Icon name="lock" size={11} /> Embutida
                  </>
                )}
              </span>
            </div>
            {p._source === "local" && (
              <button
                onClick={() => setDeleteTarget(p)}
                className="inline-flex items-center gap-1 text-[12px] text-danger border border-danger/20 bg-danger/10 rounded-sm px-3 py-1.5 hover:bg-danger/20 transition-colors"
              >
                <Icon name="trash" size={13} /> Excluir
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Modal de confirmação de exclusão */}
      {deleteTarget && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-bg-2 border border-border rounded p-7 max-w-sm w-[90%]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold mb-2.5">Excluir persona?</h3>
            <p className="text-txt-2 text-sm mb-5">
              Tem certeza que deseja excluir <strong>{deleteTarget.meta?.display_name}</strong>?
            </p>
            <div className="flex gap-2.5 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="text-[13px] text-txt-2 border border-border rounded-sm px-4 py-2 hover:bg-bg-3 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={doDelete}
                className="text-[13px] text-danger border border-danger/20 bg-danger/10 rounded-sm px-4 py-2 hover:bg-danger/20 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
