// ClaimGuard AI — Fraud Investigation Workspace (route: /fraud).
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Copy, RefreshCcw, ImageOff, FileWarning, IdCard, ArrowRight } from "lucide-react";
import { useAsync } from "../utils/useAsync";
import { getFraudPatterns, getHospitals } from "../api/client";
import { PageIntro, LoadingState, ErrorState, RiskBadge, EmptyState } from "../components/ui";
import { inr } from "../utils/format";
import type { SignalClaim } from "../types";

export default function FraudWorkspace() {
  const fraudQ = useAsync(getFraudPatterns, []);
  const hospitalsQ = useAsync(getHospitals, []);
  const [selected, setSelected] = useState<string | null>(null);

  if (fraudQ.loading || hospitalsQ.loading) return <LoadingState label="Loading fraud workspace…" />;
  if (fraudQ.error || !fraudQ.data) return <ErrorState message={fraudQ.error || "No data"} onRetry={fraudQ.refetch} />;

  const f = fraudQ.data;
  const hospitals = (hospitalsQ.data?.hospitals ?? []).filter((h) => h.avg_risk_score > 25);
  const selectedClaim = f.critical_queue.find((c) => c.claim_id === selected) ?? f.critical_queue[0];

  const signalPanels = [
    { icon: Copy, label: "Duplicate Procedure", rows: f.duplicate_procedure_signals, tone: "text-red-600" },
    { icon: RefreshCcw, label: "Repeat Admission", rows: f.repeat_admission_signals, tone: "text-orange-600" },
    { icon: ImageOff, label: "Reused Image", rows: f.reused_image_signals, tone: "text-red-600" },
    { icon: FileWarning, label: "Suspicious Document", rows: f.suspicious_document_signals, tone: "text-amber-600" },
    { icon: IdCard, label: "Identity / Eligibility", rows: f.identity_signals, tone: "text-red-700" },
  ];

  return (
    <div>
      <PageIntro
        title="Fraud Investigation Workspace"
        subtitle="Deep-dive for high-risk and critical claims flagged by the fraud agents."
        demo="The fraud investigator's deep-dive: the critical-claims queue, per-signal evidence panels (duplicate procedures, repeat admissions, reused images, suspicious documents, identity risk), hospital risk scorecards, and a case evidence panel for the selected claim."
      />

      {/* Pattern counts chart */}
      <div className="mb-6 card p-5">
        <h3 className="mb-4 text-sm font-bold text-navy">Fraud / Risk Signal Frequency</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={f.pattern_counts.filter((p) => p.count > 0)} margin={{ bottom: 60 }}>
            <CartesianGrid vertical={false} stroke="#eef2f7" />
            <XAxis dataKey="label" angle={-30} textAnchor="end" interval={0} height={90} stroke="#475569" fontSize={10} />
            <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={12} />
            <Tooltip cursor={{ fill: "#f1f5f9" }} />
            <Bar isAnimationActive={false} dataKey="count" radius={[6, 6, 0, 0]} barSize={28}>
              {f.pattern_counts.filter((p) => p.count > 0).map((p, i) => (
                <Cell key={i} fill={p.weight >= 20 ? "#dc2626" : p.weight >= 15 ? "#ea580c" : "#d97706"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Critical queue */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="mb-3 text-sm font-bold text-navy">Critical & High-Risk Queue</h3>
          {f.critical_queue.length ? (
            <div className="space-y-2">
              {f.critical_queue.map((c) => (
                <button
                  key={c.claim_id}
                  onClick={() => setSelected(c.claim_id)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                    selectedClaim?.claim_id === c.claim_id ? "border-teal-500/40 bg-teal-50/50" : "border-line hover:bg-canvas"
                  }`}
                >
                  <div>
                    <p className="text-sm font-bold text-navy">{c.claim_id}</p>
                    <p className="text-xs text-muted">
                      {c.hospital_name} · {c.beneficiary_id} · {inr(c.claim_amount)}
                    </p>
                  </div>
                  <RiskBadge category={c.risk_category} score={c.risk_score} />
                </button>
              ))}
            </div>
          ) : (
            <EmptyState title="No high-risk claims" />
          )}
        </div>

        {/* Case evidence panel */}
        <div className="card p-5">
          <h3 className="mb-3 text-sm font-bold text-navy">Case Evidence Panel</h3>
          {selectedClaim ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-canvas p-4">
                <p className="text-lg font-extrabold text-navy">{selectedClaim.claim_id}</p>
                <p className="text-xs text-muted">{selectedClaim.hospital_name}</p>
                <div className="mt-2">
                  <RiskBadge category={selectedClaim.risk_category} score={selectedClaim.risk_score} />
                </div>
              </div>
              <p className="text-sm text-ink">{selectedClaim.ai_summary}</p>
              <Link to={`/claims/${selectedClaim.claim_id}`} className="btn-primary w-full">
                Open full review <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to={`/claims/${selectedClaim.claim_id}/report`} className="btn-ghost w-full">
                View report
              </Link>
            </div>
          ) : (
            <EmptyState title="Select a claim" />
          )}
        </div>
      </div>

      {/* Signal panels */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {signalPanels.map((p) => (
          <div key={p.label} className="card p-5">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-navy">
              <p.icon className={`h-4 w-4 ${p.tone}`} /> {p.label}
              <span className="ml-auto chip bg-slate-100 text-slate-600">{p.rows.length}</span>
            </h4>
            {p.rows.length ? (
              <ul className="space-y-1.5">
                {p.rows.map((r: SignalClaim) => (
                  <li key={r.claim_id} className="flex items-center justify-between text-sm">
                    <Link to={`/claims/${r.claim_id}`} className="font-semibold text-teal-700 hover:underline">
                      {r.claim_id}
                    </Link>
                    <span className="text-xs text-muted">{r.hospital_name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted">No claims with this signal.</p>
            )}
          </div>
        ))}

        {/* Hospital risk scorecards */}
        <div className="card p-5">
          <h4 className="mb-3 text-sm font-bold text-navy">Hospital Risk Scorecards</h4>
          {hospitals.length ? (
            <ul className="space-y-2">
              {hospitals.map((h) => (
                <li key={h.hospital_name} className="flex items-center justify-between text-sm">
                  <span className="text-ink">{h.hospital_name}</span>
                  <span className="chip" style={{ backgroundColor: "#fee2e2", color: "#b91c1c" }}>
                    {h.avg_risk_score}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted">No elevated hospitals.</p>
          )}
        </div>
      </div>
    </div>
  );
}
