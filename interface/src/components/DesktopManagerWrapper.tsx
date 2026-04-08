/**
 * @module ManagerView (Desktop)
 * @description Thin wrapper around the shared ManagerView.
 *
 * Provides the desktop-specific import trigger (Tauri openFilePicker)
 * and delegates all operations to Tauri invoke commands.
 */

import { useState } from "react";
import { invoke, openFilePicker } from "../lib/tauri";
import type { Persona } from "@pbl/shared/constants";
import Icon from "@pbl/shared/components/Icon";
import { toast } from "@pbl/shared/components/Toast";
import SharedManagerView from "@pbl/shared/components/views/ManagerView";
import { useI18n } from "@pbl/shared/i18n";

interface Props {
  personas: Persona[];
  setPersonas: React.Dispatch<React.SetStateAction<Persona[]>>;
  selectedPersona: Persona | null;
  setSelectedPersona: React.Dispatch<React.SetStateAction<Persona | null>>;
}

export default function ManagerView({
  personas,
  setPersonas,
  selectedPersona,
  setSelectedPersona,
}: Props) {
  const [importing, setImporting] = useState(false);
  const { t } = useI18n();

  async function importFromFile() {
    try {
      setImporting(true);
      const text = await openFilePicker(".json");
      if (!text) return;

      const json: Persona = await invoke("add_persona_from_json", { json: text });

      setPersonas((prev) => {
        const idx = prev.findIndex((p) => p.meta?.id === json.meta?.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...json, _source: "local" };
          return updated;
        }
        return [...prev, { ...json, _source: "local" }];
      });
      toast(`"${json.meta?.display_name}" ${t("manager.importSuccess")}`, "success");
    } catch (err: unknown) {
      toast(`${t("manager.importError")}: ${(err as Error).message}`, "error");
    } finally {
      setImporting(false);
    }
  }

  const importTrigger = (
    <button
      onClick={importFromFile}
      disabled={importing}
      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-sm bg-accent text-white text-[13px] font-medium hover:bg-accent-2 transition-colors disabled:opacity-50"
    >
      <Icon name="download" size={15} /> {importing ? t("manager.importing") : t("manager.importFile")}
    </button>
  );

  return (
    <SharedManagerView
      personas={personas}
      selectedPersona={selectedPersona}
      importTrigger={importTrigger}
      onUpdateOnline={() => invoke("update_personas_online")}
      onDeletePersona={(id) => invoke("delete_persona", { id })}
      onPersonasChanged={(p) => setPersonas(p)}
      onSelectedPersonaChanged={(p) => setSelectedPersona(p)}
    />
  );
}
