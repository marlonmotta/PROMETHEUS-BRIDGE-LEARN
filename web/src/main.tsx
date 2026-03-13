import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { initSentry, SentryErrorBoundary } from "./lib/sentry";
import ErrorBoundary from "@pbl/shared/components/ErrorBoundary";
import App from "./App";
import "./index.css";

// Inicializa Sentry antes do React render (silencioso se DSN não configurado)
initSentry();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SentryErrorBoundary fallback={
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif", color: "#ccc", background: "#0d0d0d" }}>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Erro inesperado</h1>
        <p style={{ fontSize: "0.9rem", marginBottom: "1rem" }}>Algo deu errado. Tente recarregar a página.</p>
        <button onClick={() => window.location.reload()} style={{ padding: "8px 20px", borderRadius: "4px", background: "#8b5cf6", color: "#fff", border: "none", cursor: "pointer" }}>Recarregar</button>
      </div>
    }>
      <BrowserRouter>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </BrowserRouter>
    </SentryErrorBoundary>
  </StrictMode>,
);
