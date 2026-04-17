/**
 * @module ManagerView (Web)
 * @description Thin wrapper around the shared ManagerView.
 *
 * Provides the web-specific import trigger (File API input[type="file"])
 * and delegates all operations to the service layer via useService().
 */

import { useRef, type ChangeEvent } from "react";
import type { Persona } from "@pbl/shared/constants";
import Icon from "@pbl/shared/components/Icon";
import { toast } from "@pbl/shared/components/Toast";
import { useService } from "@/providers/useService";
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
  const service = useService();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text) as Persona;

      if (!json.meta?.id) throw new Error(t("errors.missingMetaId"));
      if (!json.meta?.display_name) {
        throw new Error(t("errors.missingDisplayName"));
      }

      await service.addPersonaFromJson(text);

      setPersonas((prev) => {
        const idx = prev.findIndex((p) => p.meta?.id === json.meta.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...json, _source: "local" };
          return updated;
        }
        return [...prev, { ...json, _source: "local" }];
      });
      toast(`"${json.meta.display_name}" ${t("manager.importSuccess")}`, "success");
    } catch (err: unknown) {
      toast(`${t("manager.importError")}: ${(err as Error).message}`, "error");
    }

    e.target.value = "";
  }

  const importTrigger = (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-sm bg-accent text-white text-[13px] font-medium hover:bg-accent-2 transition-colors"
      >
        <Icon name="download" size={15} /> {t("manager.importFile")}
      </button>
    </>
  );

  return (
    <SharedManagerView
      personas={personas}
      selectedPersona={selectedPersona}
      importTrigger={importTrigger}
      onUpdateOnline={() => service.updatePersonasOnline()}
      onDeletePersona={(id) => service.deletePersona(id)}
      onPersonasChanged={(p) => setPersonas(p)}
      onSelectedPersonaChanged={(p) => setSelectedPersona(p)}
    />
  );
}
