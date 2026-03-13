/// <reference types="vite/client" />

/** Version string injected by Vite `define` config from package.json */
declare const __APP_VERSION__: string;

interface Window {
  __TAURI__: {
    core: {
      invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;
    };
  };
}
