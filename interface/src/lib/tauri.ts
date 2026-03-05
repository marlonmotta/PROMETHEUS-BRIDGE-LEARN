/**
 * @module tauri
 * @description Camada de abstração para comunicação com o backend Tauri.
 *
 * Encapsula as chamadas ao runtime Tauri (`window.__TAURI__`) com fallbacks
 * seguros para quando a aplicação roda fora do contexto desktop (ex: browser
 * durante desenvolvimento). Também inclui o seletor de arquivos via Web API.
 *
 * ## Por que esta abstração existe?
 *
 * O `__TAURI__` global só está disponível quando a app roda dentro do
 * wrapper Tauri. Durante o desenvolvimento com `vite dev`, o acesso direto
 * ao `__TAURI__` causaria erros. Este módulo garante degradação graceful
 * com um warning no console, permitindo desenvolvimento híbrido.
 */

/**
 * Executa um comando Tauri de forma segura.
 *
 * Se o runtime Tauri não estiver disponível (ex: rodando no browser),
 * emite um warning no console e retorna `undefined`. Isso permite que
 * o frontend seja desenvolvido e testado independentemente do backend Rust.
 *
 * @typeParam T - Tipo do retorno esperado do comando
 * @param cmd - Nome do comando Tauri (deve corresponder a um `#[tauri::command]`)
 * @param args - Argumentos nomeados do comando (objeto chave-valor)
 * @returns Promise com o resultado do comando ou `undefined` se Tauri indisponível
 */
export async function invoke<T = unknown>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (typeof window !== "undefined" && window.__TAURI__) {
    return window.__TAURI__.core.invoke(cmd, args) as Promise<T>;
  }
  console.warn(`[PBL] Tauri não disponível - ignorando invoke("${cmd}")`);
  return undefined as unknown as T;
}

/**
 * Abre o seletor nativo de arquivos e retorna o conteúdo como texto.
 *
 * Utiliza a Web File API para compatibilidade. O elemento `<input>` é
 * criado, adicionado ao DOM (necessário em alguns browsers), e removido
 * após o uso para evitar acúmulo de elementos ocultos.
 *
 * @param accept - Filtro de tipo de arquivo (ex: ".json", ".txt")
 * @returns Conteúdo textual do arquivo selecionado, ou `null` se cancelado
 *
 * @remarks
 * Implementação com timeout de 5 minutos para resolver a Promise caso o
 * usuário cancele o diálogo (o evento `cancel` não é confiável em todos
 * os browsers). O input é removido do DOM em qualquer cenário.
 */
export function openFilePicker(accept: string): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.style.display = "none";

    /**
     * Garante a limpeza do elemento do DOM após o uso.
     */
    const cleanup = () => {
      if (input.parentNode) {
        input.parentNode.removeChild(input);
      }
    };

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      cleanup();
      if (!file) {
        resolve(null);
        return;
      }
      try {
        const text = await file.text();
        resolve(text);
      } catch {
        resolve(null);
      }
    };

    // Fallback: resolve com null se o usuário cancelar o diálogo
    // O evento "cancel" é disparado em Chromium 113+ quando o diálogo é fechado
    input.addEventListener("cancel", () => {
      cleanup();
      resolve(null);
    });

    // Adiciona ao DOM (necessário para Firefox) e dispara o clique
    document.body.appendChild(input);
    input.click();

    // Timeout de segurança: se nada acontecer em 5 min, resolve e limpa
    setTimeout(() => {
      cleanup();
      resolve(null);
    }, 300_000);
  });
}
