/**
 * @module ManagerView
 * @description Painel de gerenciamento do catálogo de personas (shared).
 *
 * Recebe callbacks para operações de I/O (importação, atualização, exclusão)
 * que são implementadas de forma diferente no web (WebAdapter) e no desktop
 * (Tauri invoke). Segue o mesmo pattern do DashboardView.
 */

import { memo, useState } from "react";
import type { Persona } from "@pbl/shared/constants";
import Icon from "@pbl/shared/components/Icon";
import { toast } from "@pbl/shared/components/Toast";
import { useI18n } from "@pbl/shared/i18n";

interface Props {
  personas: Persona[];
  selectedPersona: Persona | null;
  /** Componente trigger para importação (File input no web, botão com openFilePicker no desktop) */
  importTrigger: React.ReactNode;
  onUpdateOnline: () => Promise<Persona[]>;
  onDeletePersona: (id: string) => Promise<void>;
  onPersonasChanged: (personas: Persona[]) => void;
  onSelectedPersonaChanged: (persona: Persona | null) => void;
}

export default memo(function ManagerView({
  personas,
  selectedPersona,
  importTrigger,
  onUpdateOnline,
  onDeletePersona,
  onPersonasChanged,
  onSelectedPersonaChanged,
}: Props) {
  const [updating, setUpdating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Persona | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const { t } = useI18n();

  async function updateOnline() {
    setUpdating(true);
    try {
      const novas = await onUpdateOnline();
      if (novas && novas.length > 0) {
        const ids = new Set(novas.map((p) => p.meta?.id));
        onPersonasChanged([
          ...personas.filter((p) => !ids.has(p.meta?.id)),
          ...novas.map((p) => ({ ...p, _source: "local" as const })),
        ]);
        toast(t("manager.updateSuccess", { count: String(novas.length) }), "success");
      } else {
        toast(t("manager.updateUpToDate"), "info");
      }
    } catch (e) {
      toast(`${t("manager.updateError")}: ${e}`, "error");
    }
    setUpdating(false);
  }

  async function doDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.meta?.id;
    if (!id) {
      toast(t("manager.invalidId"), "error");
      setDeleteTarget(null);
      return;
    }
    try {
      await onDeletePersona(id);
      const remaining = personas.filter((p) => p.meta?.id !== id);
      onPersonasChanged(remaining);
      if (selectedPersona?.meta?.id === id) {
        if (remaining.length > 0) {
          const sorted = [...remaining].sort((a, b) =>
            (a.meta?.display_name || "").localeCompare(
              b.meta?.display_name || "",
            ),
          );
          onSelectedPersonaChanged(sorted[0]);
        } else {
          onSelectedPersonaChanged(null);
        }
      }
      toast(t("manager.deleteSuccess"), "success");
    } catch (e) {
      toast(`${t("manager.deleteError")}: ${e}`, "error");
    }
    setDeleteTarget(null);
  }

  async function doDeleteAll() {
    try {
      const ids = personas.map((p) => p.meta?.id ?? "").filter(Boolean);
      await Promise.all(ids.map((id) => onDeletePersona(id)));
      onPersonasChanged([]);
      onSelectedPersonaChanged(null);
      toast(t("manager.deletedCount", { count: String(personas.length) }), "success");
    } catch (e) {
      toast(`${t("manager.deleteAllError")}: ${e}`, "error");
    }
    setConfirmDeleteAll(false);
  }

  const localPersonas = personas.filter(
    (p) => p._source === "local" || p._source === "remote",
  );

  return (
    <section className="h-full flex flex-col overflow-hidden">
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-txt mb-1.5">
          {t("manager.title")}
        </h1>
        <p className="text-sm text-txt-2">
          {t("manager.subtitle")} ·{" "}
          <span className="text-accent font-medium">{personas.length}</span>{" "}
          {t("manager.personas")}
        </p>
      </div>

      {/* Ações */}
      <div className="flex flex-wrap gap-2.5 mb-6">
        {importTrigger}
        <button
          onClick={updateOnline}
          disabled={updating}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-sm border border-border text-txt text-[13px] font-medium hover:bg-bg-3 transition-colors disabled:opacity-50"
        >
          <Icon name="refresh" size={15} />
          {updating ? t("manager.updating") : t("manager.updateGithub")}
        </button>
        <button
          onClick={() => setConfirmDeleteAll(true)}
          disabled={personas.length === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-sm text-[13px] text-danger border border-danger/20 bg-danger/10 hover:bg-danger/20 transition-colors disabled:opacity-40"
        >
          <Icon name="trash" size={15} /> {t("manager.deleteAll")}
        </button>
      </div>

      {/* Lista de personas */}
      <div className="bg-bg-2 border border-border rounded p-5 flex-1 min-h-0 flex flex-col">
        <h2 className="text-sm font-semibold mb-4">
          {t("manager.catalog")} ({personas.length} {t("manager.personas")})
        </h2>

        {localPersonas.length === 0 && (
          <div className="text-sm text-txt-3 text-center py-6">
            {t("manager.empty")}
          </div>
        )}

        <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto">
          {localPersonas.map((p) => (
            <div
              key={p.meta?.id}
              className="flex items-center justify-between gap-3 bg-bg border border-border rounded-sm px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {p.meta?.display_name}
                </div>
                <div className="text-[11px] text-txt-2 mt-0.5">
                  {p.character?.universe} · {p.meta?.id} ·{" "}
                  <span className="text-txt-3">{p._source}</span>
                </div>
              </div>
              <button
                onClick={() => setDeleteTarget(p)}
                aria-label={t("a11y.deletePersonaNamed", { name: p.meta?.display_name || "" })}
                className="text-[12px] text-danger/60 hover:text-danger transition-colors px-2 py-1 shrink-0"
              >
                <Icon name="trash" size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: confirmar exclusão */}
      {deleteTarget && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-bg-2 border border-border rounded p-7 max-w-sm w-[90%]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold mb-2.5">{t("manager.deleteConfirm")}</h3>
            <p className="text-txt-2 text-sm mb-5">
              {t("manager.deleteConfirmMessage")}{" "}
              <strong>{deleteTarget.meta?.display_name}</strong>?
            </p>
            <div className="flex gap-2.5 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="text-[13px] text-txt-2 border border-border rounded-sm px-4 py-2 hover:bg-bg-3 transition-colors"
              >
                {t("manager.cancel")}
              </button>
              <button
                onClick={doDelete}
                className="text-[13px] text-danger border border-danger/20 bg-danger/10 rounded-sm px-4 py-2 hover:bg-danger/20 transition-colors"
              >
                {t("manager.delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: confirmar exclusão total */}
      {confirmDeleteAll && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setConfirmDeleteAll(false)}
        >
          <div
            className="bg-bg-2 border border-border rounded p-7 max-w-sm w-[90%]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold mb-2.5">{t("manager.deleteAllConfirm")}</h3>
            <p className="text-txt-2 text-sm mb-5">
              {t("manager.deleteAllMessage", { count: String(personas.length) })}
            </p>
            <div className="flex gap-2.5 justify-end">
              <button
                onClick={() => setConfirmDeleteAll(false)}
                className="text-[13px] text-txt-2 border border-border rounded-sm px-4 py-2 hover:bg-bg-3 transition-colors"
              >
                {t("manager.cancel")}
              </button>
              <button
                onClick={doDeleteAll}
                className="text-[13px] text-danger border border-danger/20 bg-danger/10 rounded-sm px-4 py-2 hover:bg-danger/20 transition-colors"
              >
                {t("manager.deleteAll")}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
});
