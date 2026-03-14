/**
 * Ponto de entrada da aplicação React do PBL.
 *
 * Monta o componente raiz `<App />` dentro de `React.StrictMode` para
 * ativar verificações adicionais de desenvolvimento (double-render,
 * detecção de side effects inseguros, etc.).
 *
 * O `ErrorBoundary` envolve toda a aplicação para capturar exceções
 * não tratadas em qualquer parte da árvore de componentes, exibindo
 * uma tela de fallback amigável ao invés de uma tela branca.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import ErrorBoundary from "@pbl/shared/components/ErrorBoundary";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
