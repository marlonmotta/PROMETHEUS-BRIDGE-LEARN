import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import AppLayout from "@/components/app/AppLayout";

// Code splitting: each page is a separate chunk loaded on demand
const Landing = lazy(() => import("@/pages/Landing"));
const About = lazy(() => import("@/pages/About"));
const WebApp = lazy(() => import("@/pages/WebApp"));

export default function App() {
  return (
    <Suspense fallback={<div className="h-screen bg-bg" />}>
      <Routes>
        {/* Marketing pages (header + footer) */}
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/sobre" element={<About />} />
        </Route>

        {/* Web App (dashboard layout, no marketing shell) */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<WebApp />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
