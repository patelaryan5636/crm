import { useState } from "react";
import { ArrowLeft, Menu, X, BookOpen, FileText, Shield, Cookie, HelpCircle } from "lucide-react";
import { useNavigate, NavLink, Link } from "react-router-dom";
import GraphuraLogo from "../../assets/Logo/Graphura_Logo.webp";

const NAV_LINKS = [
  { to: "/how-to-use",           label: "How to Use",        icon: HelpCircle  },
  { to: "/terms-and-conditions", label: "Terms",             icon: FileText    },
  { to: "/privacy-policy",       label: "Privacy",           icon: Shield      },
  { to: "/cookie-policy",        label: "Cookies",           icon: Cookie      },
];

/**
 * Shared layout for all legal/policy pages.
 */
export default function PolicyLayout({ title, subtitle, children }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-500 text-xs font-bold hover:bg-slate-100 hover:border-slate-300 hover:text-[#2a465a] transition-all duration-200 shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Back</span>
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0">
            <img src={GraphuraLogo} alt="Graphura CRM" className="h-11 w-auto" />
          </Link>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-100 rounded-2xl">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap",
                    isActive
                      ? "bg-[#2a465a] text-white shadow-md"
                      : "text-slate-500 hover:text-[#2a465a] hover:bg-white",
                  ].join(" ")
                }
              >
                <Icon size={13} />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all duration-200 shrink-0"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                    isActive
                      ? "bg-[#2a465a] text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-[#2a465a]",
                  ].join(" ")
                }
              >
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* ── Hero strip ───────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#2a465a] to-[#1a3347] text-white py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-slate-300 text-sm sm:text-base">{subtitle}</p>
          )}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-10">
        <div className="space-y-6">{children}</div>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Graphura Technologies. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * A styled card wrapper for each section inside a policy page.
 */
export function PolicySection({ icon, title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-shadow duration-200 hover:shadow-md">
      {/* Section header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
        {icon && (
          <span className="text-[#2a465a] shrink-0 text-lg">{icon}</span>
        )}
        <h2 className="text-base sm:text-lg font-bold text-[#2a465a]">
          {title}
        </h2>
      </div>
      {/* Section body */}
      <div className="px-6 py-5 text-slate-700 text-sm sm:text-base leading-relaxed space-y-3">
        {children}
      </div>
    </div>
  );
}

/** A styled sub-heading within a section body */
export function SubHeading({ children }) {
  return (
    <h3 className="text-sm font-bold text-slate-800 mt-4 mb-1">{children}</h3>
  );
}

/** A styled unordered list */
export function PolicyList({ items }) {
  return (
    <ul className="list-none space-y-2 mt-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#2a465a] shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
