import { Link, Outlet, useLocation } from "react-router-dom";
import { Sparkles, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/sobre", label: "Sobre" },
];

function Header() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-5">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <img src="/app-icon.png" alt="PBL" className="w-8 h-8 rounded-full" />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-txt tracking-wider group-hover:text-accent transition-colors">
              PBL
            </span>
            <span className="text-[10px] text-txt-3 tracking-widest">
              PROMETHEUS · BRIDGE · LEARN
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? "text-accent bg-accent/10"
                  : "text-txt-2 hover:text-txt hover:bg-bg-3"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/app"
            className="ml-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-sm bg-accent text-white text-sm font-semibold hover:bg-accent-2 transition-colors"
          >
            <Sparkles size={14} />
            Acessar App
          </Link>
        </nav>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-txt-2 hover:text-txt transition-colors"
          aria-label="Menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Nav */}
      {menuOpen && (
        <nav className="md:hidden border-t border-border bg-bg-2 px-6 py-4 flex flex-col gap-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={`px-4 py-2.5 rounded-sm text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? "text-accent bg-accent/10"
                  : "text-txt-2 hover:text-txt hover:bg-bg-3"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/app"
            onClick={() => setMenuOpen(false)}
            className="mt-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-sm bg-accent text-white text-sm font-semibold hover:bg-accent-2 transition-colors"
          >
            <Sparkles size={14} />
            Acessar App
          </Link>
        </nav>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-bg-2">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <img
              src="/app-icon.png"
              alt="PBL"
              className="w-7 h-7 rounded-full"
            />
            <span className="text-sm font-bold text-txt-2 tracking-wider">
              PROMETHEUS · BRIDGE · LEARN
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-txt-3">
            <a
              href="https://github.com/marlonmotta/PROMETHEUS-BRIDGE-LEARN"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-txt transition-colors"
            >
              GitHub
            </a>
            <Link to="/sobre" className="hover:text-txt transition-colors">
              Sobre
            </Link>
            <Link to="/app" className="hover:text-txt transition-colors">
              Web App
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-center text-xs text-txt-3">
          © {new Date().getFullYear()} PBL - PROMETHEUS · BRIDGE · LEARN. Open
          Source sob licença MIT.
        </div>
      </div>
    </footer>
  );
}

function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 300);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Voltar ao topo"
      className={`fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center shadow-lg hover:bg-accent-2 transition-all duration-300 cursor-pointer ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  );
}

export default function MarketingLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-18">
        <Outlet />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
