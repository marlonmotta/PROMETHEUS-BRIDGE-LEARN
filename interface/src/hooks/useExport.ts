/**
 * @module useExport
 * @description Hook para exportar conteúdo em diversos formatos.
 *
 * Encapsula a lógica de salvar arquivo via diálogo Tauri + invoke export_file.
 */

import { useCallback } from "react";
import { invoke } from "../lib/tauri";

export function useExport() {
  const handleExport = useCallback(async (content: string, format: string) => {
    try {
      const { save } = await import("@tauri-apps/plugin-dialog");
      const path = await save({
        defaultPath: `adaptacao.${format}`,
        filters: [{ name: format.toUpperCase(), extensions: [format] }],
      });
      if (path) {
        await invoke("export_file", { content, format, path });
      }
    } catch (err) {
      console.error("[PBL] Export error:", err);
    }
  }, []);

  return { handleExport };
}
