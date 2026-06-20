// ClaimGuard AI — small reusable UI primitives.
import type { ReactNode } from "react";
import { useEffect } from "react";
import { Info, Loader2, Inbox, X, FlaskConical } from "lucide-react";
import { RISK_COLORS, STATUS_COLORS } from "../utils/format";

/* ---------- MVP Simulation badge ---------- */
export function MvpBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`chip bg-teal-50 text-teal-700 ring-1 ring-teal-600/15 ${className}`}
      title="This feature is demonstrated with explainable, rule-based mock logic."
    >
      <FlaskConical className="h-3.5 w-3.5" /> MVP Simulation
    </span>
  );
}

/* ---------- "What this page demonstrates" intro ---------- */
export function PageIntro({ title, subtitle, demo }: { title: string; subtitle: string; demo: string }) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy">{title}</h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        </div>
        <MvpBadge />
      </div>
      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-teal-600/15 bg-teal-50/60 px-4 py-3 text-sm text-navy-700">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
        <p>
          <span className="font-semibold">What this page demonstrates: </span>
          {demo}
        </p>
      </div>
    </div>
  );
}

/* ---------- StatCard ---------- */
export function StatCard({
  label,
  value,
  sub,
  icon,
  accent = "text-teal-600",
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  icon?: ReactNode;
  accent?: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
        {icon && <span className={accent}>{icon}</span>}
      </div>
      <p className="mt-2 text-3xl font-extrabold text-navy">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}

/* ---------- RiskBadge ---------- */
export function RiskBadge({ category, score }: { category: string; score?: number }) {
  const c = RISK_COLORS[category] ?? { text: "text-muted", bg: "bg-slate-100" };
  return (
    <span className={`chip ${c.bg} ${c.text} ring-1 ring-inset ring-black/5`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.bg ? c.text.replace("text-", "bg-") : ""}`} />
      {category}
      {score !== undefined && <span className="opacity-70">· {score}</span>}
    </span>
  );
}

/* ---------- StatusBadge ---------- */
export function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? "bg-slate-100 text-slate-600";
  return <span className={`chip ${cls}`}>{status}</span>;
}

/* ---------- ChartCard ---------- */
export function ChartCard({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-navy">{title}</h3>
          {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

/* ---------- LoadingState ---------- */
export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted">
      <Loader2 className="h-7 w-7 animate-spin text-teal-600" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

/* ---------- EmptyState ---------- */
export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-white py-16 text-center">
      <Inbox className="h-8 w-8 text-slate-300" />
      <p className="font-semibold text-navy">{title}</p>
      {hint && <p className="max-w-sm text-sm text-muted">{hint}</p>}
    </div>
  );
}

/* ---------- ErrorState ---------- */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50 py-14 text-center">
      <p className="font-semibold text-red-700">Could not load data</p>
      <p className="max-w-md text-sm text-red-600">{message}</p>
      {onRetry && (
        <button className="btn-ghost mt-1" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

/* ---------- Modal ---------- */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="card relative z-10 w-full max-w-lg p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-navy">{title}</h3>
          <button className="rounded-lg p-1 text-muted hover:bg-canvas" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- ConfidenceBar ---------- */
export function ConfidenceBar({ value, tone = "bg-teal-500" }: { value: number; tone?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

/* ---------- Section label ---------- */
export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">{children}</h2>;
}
