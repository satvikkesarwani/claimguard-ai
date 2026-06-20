// ClaimGuard AI — Claim Review Detail (route: /claims/:id). Main auditor screen.
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FileText,
  Workflow,
  Sparkles,
  ShieldCheck,
  Stethoscope,
  FileCheck2,
  ScrollText,
  ArrowRight,
} from "lucide-react";
import { useAsync } from "../utils/useAsync";
import { analyzeClaim, getAuditLogs, getClaim, postDecision } from "../api/client";
import {
  PageIntro,
  LoadingState,
  ErrorState,
  StatusBadge,
  Modal,
  MvpBadge,
} from "../components/ui";
import RiskGauge from "../components/RiskGauge";
import AgentCard from "../components/AgentCard";
import AuditTimeline from "../components/AuditTimeline";
import { DECISION_ACTIONS } from "../data/catalogue";
import { inr, shortDate } from "../utils/format";
import type { AuditLog } from "../types";

const STATUS_TONE: Record<string, string> = {
  Supported: "text-green-700",
  Complete: "text-green-700",
  "Follows guideline": "text-green-700",
  Weak: "text-amber-700",
  Partial: "text-amber-700",
  Missing: "text-amber-700",
  "Not Supported": "text-red-700",
  Suspicious: "text-red-700",
  "Violates guideline": "text-red-700",
};

export default function ClaimReview() {
  const { id = "" } = useParams();
  const claimQ = useAsync(() => getClaim(id), [id]);
  const analysisQ = useAsync(() => analyzeClaim(id), [id]);
  const auditQ = useAsync(() => getAuditLogs(id), [id]);

  const [modalAction, setModalAction] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [role, setRole] = useState("Claim Adjudicator");
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const claim = claimQ.data;
  const analysis = analysisQ.data;

  async function confirmDecision() {
    if (!modalAction) return;
    setSaving(true);
    try {
      const fb = DECISION_ACTIONS.find((d) => d.action === modalAction)?.feedback || undefined;
      const res = await postDecision(id, { action: modalAction, note, user_role: role, feedback_type: fb });
      setBanner(`Decision recorded: ${modalAction} → status "${res.claim.status}". Audit log + feedback created.`);
      setModalAction(null);
      setNote("");
      claimQ.refetch();
      auditQ.refetch();
    } catch {
      setBanner("Failed to record decision — is the backend running?");
    } finally {
      setSaving(false);
    }
  }

  if (claimQ.loading || analysisQ.loading) return <LoadingState label="Loading claim review…" />;
  if (claimQ.error || !claim) return <ErrorState message={claimQ.error || "Claim not found"} onRetry={claimQ.refetch} />;

  return (
    <div>
      <PageIntro
        title={`Claim Review · ${claim.claim_id}`}
        subtitle="AI summary, risk score, agent results and human-in-the-loop actions."
        demo="The auditor's main workspace: a one-page AI summary, risk gauge, decision-output statuses, all 10 agent results, top risk factors, the audit trail, and the five human-in-the-loop action buttons."
      />

      {banner && (
        <div className="mb-5 rounded-xl border border-teal-600/20 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800">
          {banner}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT: summary, statuses, agents */}
        <div className="space-y-6 lg:col-span-2">
          {/* AI summary */}
          <div className="card p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-navy">
                <Sparkles className="h-4 w-4 text-teal-600" /> AI Claim Summary
              </h3>
              <MvpBadge />
            </div>
            <p className="text-sm leading-relaxed text-ink">{claim.ai_summary}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Meta label="Beneficiary" value={claim.beneficiary_id} />
              <Meta label="Hospital" value={claim.hospital_name} />
              <Meta label="Package" value={claim.treatment_package} />
              <Meta label="Claim amount" value={inr(claim.claim_amount)} />
              <Meta label="Diagnosis" value={claim.diagnosis} />
              <Meta label="Procedure" value={claim.procedure_code} />
              <Meta label="Admission" value={shortDate(claim.admission_date)} />
              <Meta label="Discharge" value={shortDate(claim.discharge_date)} />
            </div>
          </div>

          {/* Decision-output statuses */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatusTile icon={ShieldCheck} label="Fraud Risk" value={claim.fraud_risk} />
            <StatusTile icon={Stethoscope} label="Medical Necessity" value={claim.medical_necessity} />
            <StatusTile icon={FileCheck2} label="Documents" value={claim.document_completeness} />
            <StatusTile icon={ScrollText} label="STG Compliance" value={claim.stg_compliance} />
          </div>

          {/* Agents */}
          <div className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-navy">
                <Workflow className="h-4 w-4 text-teal-600" /> Multi-Agent Verification Results
              </h3>
              <Link to={`/agents/${claim.claim_id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline">
                Open agent runner <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {analysis?.agents.map((a) => (
                <AgentCard key={a.key} agent={a} />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: gauge, top factors, actions, audit */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="mb-2 text-sm font-bold text-navy">Combined Risk Score</h3>
            <RiskGauge score={claim.risk_score} category={claim.risk_category} />
            <div className="mt-4 rounded-xl bg-canvas p-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Recommended Action</p>
              <p className="mt-1 text-sm font-bold text-navy">{claim.recommended_action}</p>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-muted">Current status</span>
              <StatusBadge status={claim.status} />
            </div>
          </div>

          {/* Top factors */}
          <div className="card p-6">
            <h3 className="mb-3 text-sm font-bold text-navy">Top Risk Factors</h3>
            {analysis && analysis.top_factors.length ? (
              <ul className="space-y-3">
                {analysis.top_factors.map((f) => (
                  <li key={f.key}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-ink">{f.label}</span>
                      <span className="font-bold text-risk-high">+{f.contribution}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-risk-high" style={{ width: `${(f.contribution / 25) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No risk signals detected — clean claim.</p>
            )}
          </div>

          {/* Actions */}
          <div className="card p-6">
            <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-navy">Auditor Action</h3>
            <p className="mb-3 text-xs text-muted">Human-in-the-loop — your decision is final and fully logged.</p>
            <div className="grid grid-cols-1 gap-2">
              {DECISION_ACTIONS.map((d) => (
                <button
                  key={d.action}
                  onClick={() => setModalAction(d.action)}
                  className={`btn text-white ${d.tone}`}
                >
                  {d.action}
                </button>
              ))}
            </div>
            <Link to={`/claims/${claim.claim_id}/report`} className="btn-ghost mt-3 w-full">
              <FileText className="h-4 w-4" /> View Decision Report
            </Link>
          </div>

          {/* Audit trail */}
          <div className="card p-6">
            <h3 className="mb-3 text-sm font-bold text-navy">Audit Trail</h3>
            <AuditTimeline logs={(auditQ.data?.logs as AuditLog[]) ?? []} />
          </div>
        </div>
      </div>

      {/* Decision modal */}
      <Modal
        open={!!modalAction}
        onClose={() => setModalAction(null)}
        title={`Confirm: ${modalAction}`}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModalAction(null)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={confirmDecision} disabled={saving}>
              {saving ? "Recording…" : `Confirm ${modalAction}`}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Acting as</label>
            <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
              <option>Claim Adjudicator</option>
              <option>Medical Auditor</option>
              <option>Fraud Investigator</option>
              <option>Policy/Admin</option>
            </select>
          </div>
          <div>
            <label className="label">Auditor note</label>
            <textarea
              className="input min-h-[100px]"
              placeholder="Reason for this decision (logged to the audit trail and feedback loop)…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <p className="rounded-lg bg-canvas p-3 text-xs text-muted">
            This records an audit-log entry, updates the claim status, and creates a feedback event for the
            learning-loop simulation.
          </p>
        </div>
      </Modal>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="text-ink">{value}</p>
    </div>
  );
}

function StatusTile({ icon: Icon, label, value }: { icon: typeof ShieldCheck; label: string; value: string }) {
  const tone = STATUS_TONE[value] ?? "text-navy-700";
  return (
    <div className="card p-4">
      <Icon className="h-4 w-4 text-teal-600" />
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-0.5 text-sm font-bold ${tone}`}>{value}</p>
    </div>
  );
}
