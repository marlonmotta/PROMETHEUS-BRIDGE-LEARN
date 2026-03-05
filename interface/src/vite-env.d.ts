/// <reference types="vite/client" />

interface Window {
  __TAURI__: {
    core: {
      invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;
    };
  };
}
