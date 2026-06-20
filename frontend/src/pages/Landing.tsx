// ClaimGuard AI — Landing / Overview page (route: /).
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Zap,
  ShieldAlert,
  Lightbulb,
  UserCheck,
  FileStack,
  FilePlus2,
  PlayCircle,
  ArrowRight,
  Activity,
  Clock,
  ScrollText,
} from "lucide-react";
import { useAsync } from "../utils/useAsync";
import { getAnalyticsOverview } from "../api/client";
import { StatCard, MvpBadge } from "../components/ui";

const VALUES = [
  { icon: Zap, title: "Faster genuine claims", desc: "Low-risk claims fast-tracked so funds reach genuine patients sooner.", tone: "text-teal-600" },
  { icon: ShieldAlert, title: "Fraud defence", desc: "High-risk claims flagged before settlement using explainable signals.", tone: "text-red-500" },
  { icon: Lightbulb, title: "Explainable recommendations", desc: "Every score comes with human-readable reasons and evidence.", tone: "text-amber-500" },
  { icon: UserCheck, title: "Human-in-the-loop safety", desc: "AI recommends; a qualified auditor always makes the final call.", tone: "text-blue-600" },
];

export default function Landing() {
  const { data } = useAsync(getAnalyticsOverview, []);

  return (
    <div>
      {/* Hero */}
      <section className="card relative overflow-hidden p-8 lg:p-12">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-teal-50" />
        <div className="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-blue-50" />
        <div className="relative max-w-3xl">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-white">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <MvpBadge />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-navy lg:text-5xl">ClaimGuard AI</h1>
          <p className="mt-3 text-lg font-semibold text-teal-700">
            AI Health-Insurance Claims Adjudication &amp; Fraud Defence
          </p>
          <p className="mt-2 max-w-2xl text-base text-muted">
            A Multi-Agent AI Decision Layer for Faster, Fairer &amp; Fraud-Resistant Health Claims. ClaimGuard AI
            sits on top of hospital, insurer, TPA and NHCX workflows — extracting claim data, running specialized
            verification agents, scoring fraud/medical risk, and producing an explainable recommendation with a
            full audit trail.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/claims" className="btn-primary">
              <FileStack className="h-4 w-4" /> Open Claims Dashboard
            </Link>
            <Link to="/claims/new" className="btn-navy">
              <FilePlus2 className="h-4 w-4" /> Submit New Claim
            </Link>
            <Link to="/demo-guide" className="btn-ghost">
              <PlayCircle className="h-4 w-4" /> View Demo Guide
            </Link>
          </div>
        </div>
      </section>

      {/* KPI cards */}
      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Claims Analyzed" value={data?.total_claims ?? "—"} sub="Across all hospitals (mock)" icon={<Activity className="h-5 w-5" />} />
        <StatCard label="High-Risk Flagged" value={data?.high_risk_flagged ?? "—"} sub="High + Critical risk claims" icon={<ShieldAlert className="h-5 w-5" />} accent="text-red-500" />
        <StatCard label="Avg Decision Time" value={data ? `${data.avg_review_time_min}m` : "—"} sub="Simulated review time" icon={<Clock className="h-5 w-5" />} accent="text-amber-500" />
        <StatCard label="Audit Trail Coverage" value={data ? `${data.audit_trail_coverage}%` : "—"} sub="Every action logged" icon={<ScrollText className="h-5 w-5" />} accent="text-blue-600" />
      </section>

      {/* Value cards */}
      <section className="mt-8">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted">Why ClaimGuard AI</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => (
            <div key={v.title} className="card p-5">
              <v.icon className={`h-6 w-6 ${v.tone}`} />
              <h3 className="mt-3 text-sm font-bold text-navy">{v.title}</h3>
              <p className="mt-1 text-sm text-muted">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Problem framing (from PDF) */}
      <section className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="text-sm font-bold text-navy">The real-world problem</h3>
          <p className="mt-2 text-sm text-muted">
            India's health-insurance systems process a massive volume of claims (~40,000 daily under PM-JAY). Many
            are genuine, but some contain wrong packages, incomplete or manipulated documents, inflated bills, ghost
            identities, duplicate procedures, reused images, and AI-generated fake clinical notes. Manual review is
            slow, inconsistent, reactive, and cannot scale.
          </p>
          <p className="mt-3 text-xs text-slate-400">
            Source: project PDF — figures shown for context only (anonymized MVP, no live PM-JAY data).
          </p>
        </div>
        <div className="card p-6">
          <h3 className="text-sm font-bold text-navy">The ClaimGuard approach</h3>
          <ul className="mt-2 space-y-2 text-sm text-muted">
            {[
              "Auto-clears low-risk claims for fast-track settlement",
              "Flags suspicious claims with explainable risk signals",
              "Gives auditors a one-page AI risk summary",
              "Creates an immutable-style audit trail for every action",
              "Learns from auditor feedback (simulated learning loop)",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
