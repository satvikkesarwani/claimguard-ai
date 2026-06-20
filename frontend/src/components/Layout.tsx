// ClaimGuard AI — App shell: sidebar navigation + topbar.
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileStack,
  FilePlus2,
  Workflow,
  BarChart3,
  ShieldAlert,
  Building2,
  ScrollText,
  RefreshCw,
  Network,
  Sigma,
  PlayCircle,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";
import { resetDemo } from "../api/client";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/claims", label: "Claims Dashboard", icon: FileStack },
  { to: "/claims/new", label: "Submit Claim", icon: FilePlus2 },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/fraud", label: "Fraud Workspace", icon: ShieldAlert },
  { to: "/forensics", label: "Forensics Lab", icon: Sigma },
  { to: "/hospital", label: "Hospital Portal", icon: Building2 },
  { to: "/audit", label: "Audit Logs", icon: ScrollText },
  { to: "/feedback", label: "Feedback Loop", icon: RefreshCw },
  { to: "/architecture", label: "Architecture", icon: Network },
  { to: "/demo-guide", label: "Demo Guide", icon: PlayCircle },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const location = useLocation();

  async function handleReset() {
    setResetting(true);
    try {
      const r = await resetDemo();
      setToast(`Demo reset — ${r.claims} claims reloaded`);
      setTimeout(() => {
        setToast(null);
        window.location.reload();
      }, 900);
    } catch {
      setToast("Reset failed — is the backend running?");
      setTimeout(() => setToast(null), 2500);
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-line bg-white transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-line px-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-white">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-extrabold text-navy">ClaimGuard AI</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-600">
              Adjudication · Fraud Defence
            </p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 px-3 py-4">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? "bg-teal-50 text-teal-700 ring-1 ring-teal-600/15"
                    : "text-navy-700 hover:bg-canvas"
                }`
              }
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto px-3 pb-5">
          <button onClick={handleReset} disabled={resetting} className="btn-ghost w-full">
            <RefreshCw className={`h-4 w-4 ${resetting ? "animate-spin" : ""}`} />
            Reset Demo Data
          </button>
          <p className="mt-3 px-1 text-[10px] leading-relaxed text-muted">
            MVP Simulation · anonymized mock data only. Not certified medical adjudication.
          </p>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-navy-900/30 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-white/80 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 text-navy hover:bg-canvas lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="hidden items-center gap-2 text-sm text-muted sm:flex">
              <Workflow className="h-4 w-4 text-teal-600" />
              <span className="font-semibold text-navy">
                Multi-Agent AI Decision Layer for Faster, Fairer &amp; Fraud-Resistant Health Claims
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 sm:inline">
              ● Backend Connected
            </span>
            <span className="hidden text-xs text-muted md:inline">{location.pathname}</span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-7 lg:px-8">{children}</main>

        <footer className="border-t border-line bg-white px-4 py-4 text-center text-xs text-muted lg:px-8">
          ClaimGuard AI — Hackathon MVP Simulation · Built with FastAPI + React. No real PM-JAY / NHCX
          integration · no real patient data.
        </footer>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white shadow-card">
          {toast}
        </div>
      )}
    </div>
  );
}
