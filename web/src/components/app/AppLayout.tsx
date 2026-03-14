import { Outlet } from "react-router-dom";
import { ServiceProvider } from "@/providers/ServiceProvider";

/**
 * Layout do Web App (/app).
 *
 * Wraps the outlet com ServiceProvider para injetar o WebAdapter
 * em todos os componentes filhos via useService().
 */
export default function AppLayout() {
  return (
    <ServiceProvider>
      <div className="h-screen flex overflow-hidden bg-bg">
        <Outlet />
      </div>
    </ServiceProvider>
  );
}
