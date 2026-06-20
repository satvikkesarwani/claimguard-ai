// ClaimGuard AI — Explainable Decision Report (route: /claims/:id/report).
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Printer, Download, Copy, Check, ArrowLeft, ShieldAlert } from "lucide-react";
import { useAsync } from "../utils/useAsync";
import { getExplanation, getReport } from "../api/client";
import { PageIntro, LoadingState, ErrorState, RiskBadge, MvpBadge } from "../components/ui";
import EvidenceTable from "../components/EvidenceTable";
import AuditTimeline from "../components/AuditTimeline";
import ScoreWaterfall from "../components/ScoreWaterfall";
import { inr } from "../utils/format";

export default function ReportPage() {
  const { id = "" } = useParams();
  const { data, loading, error, refetch } = useAsync(() => getReport(id), [id]);
  const explainQ = useAsync(() => getExplanation(id), [id]);
  const [copied, setCopied] = useState(false);

  function exportJson() {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.claim_id}-report.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copySummary() {
    if (!data) return;
    const text =
      `ClaimGuard AI Report — ${data.claim_id}\n` +
      `Trust Score: ${data.claim_trust_score}/100 | Risk: ${data.risk_score}/100 (${data.risk_category})\n` +
      `Fraud Risk: ${data.fraud_risk_level} | Medical Necessity: ${data.medical_necessity}\n` +
      `Documents: ${data.document_completeness} | STG: ${data.stg_compliance}\n` +
      `Recommended Action: ${data.recommended_action}\n\n${data.summary}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be blocked in some contexts */
    }
  }

  if (loading) return <LoadingState label="Building report…" />;
  if (error || !data) return <ErrorState message={error || "Report unavailable"} onRetry={refetch} />;

  return (
    <div>
      <div className="print:hidden">
        <PageIntro
          title={`Decision Report · ${data.claim_id}`}
          subtitle="A professional, explainable, printable adjudication report."
          demo="The explainable decision report an auditor can print or export. It bundles the trust score, all decision outputs, the full evidence table, top risk reasons, auditor notes, audit trail, the model/rule explanation and the mandatory human-in-the-loop safety note."
        />
        <div className="mb-5 flex flex-wrap gap-2">
          <Link to={`/claims/${data.claim_id}`} className="btn-ghost">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <button onClick={() => window.print()} className="btn-navy">
            <Printer className="h-4 w-4" /> Print report
          </button>
          <button onClick={exportJson} className="btn-ghost">
            <Download className="h-4 w-4" /> Export JSON
          </button>
          <button onClick={copySummary} className="btn-ghost">
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy summary"}
          </button>
        </div>
      </div>

      {/* Printable report body */}
      <div className="card space-y-7 p-7 print:border-0 print:shadow-none">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-line pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-teal-600">ClaimGuard AI — Explainable Decision Report</p>
            <h2 className="mt-1 text-2xl font-extrabold text-navy">{data.claim_id}</h2>
            <p className="mt-1 text-sm text-muted">
              {data.hospital} · {data.treatment_package} · {inr(data.claim_amount)} · Beneficiary {data.generated_for}
            </p>
          </div>
          <div className="text-right">
            <RiskBadge category={data.risk_category} score={data.risk_score} />
            <p className="mt-2 text-xs text-muted">Status: {data.status}</p>
          </div>
        </div>

        {/* Scorecards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Score label="Trust Score" value={`${data.claim_trust_score}`} sub="/ 100" tone="text-green-700" />
          <Score label="Risk Score" value={`${data.risk_score}`} sub="/ 100" tone="text-risk-high" />
          <Score label="Fraud Risk" value={data.fraud_risk_level} />
          <Score label="Medical Necessity" value={data.medical_necessity} />
          <Score label="Documents" value={data.document_completeness} />
          <Score label="STG Compliance" value={data.stg_compliance} />
        </div>

        {/* Summary */}
        <Section title="AI Claim Summary">
          <p className="text-sm leading-relaxed text-ink">{data.summary}</p>
        </Section>

        {/* Recommended action */}
        <div className="rounded-xl bg-navy px-5 py-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-300">Recommended Action</p>
          <p className="mt-1 text-lg font-extrabold">{data.recommended_action}</p>
        </div>

        {/* Score attribution waterfall */}
        {explainQ.data && explainQ.data.contributions.length > 0 && (
          <Section title="Score Attribution (Deterministic Waterfall)">
            <ScoreWaterfall data={explainQ.data} />
          </Section>
        )}

        {/* Top reasons */}
        <Section title="Top 5 Risk Reasons">
          <ol className="space-y-2">
            {data.top_risk_reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-3 rounded-lg bg-canvas px-3.5 py-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy text-[11px] font-bold text-white">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-navy">{r.reason}</span>
                    {r.contribution > 0 && <span className="text-sm font-bold text-risk-high">+{r.contribution}</span>}
                  </div>
                  <p className="text-xs text-muted">{r.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        {/* Evidence table */}
        <Section title="Evidence Table">
          <EvidenceTable rows={data.evidence_table} />
        </Section>

        {/* Auditor notes */}
        {data.auditor_notes.length > 0 && (
          <Section title="Auditor Notes">
            <ul className="space-y-2">
              {data.auditor_notes.map((n, i) => (
                <li key={i} className="rounded-lg border border-line px-3.5 py-2.5 text-sm">
                  <span className="font-semibold text-navy">{n.action}</span>{" "}
                  <span className="text-muted">· {n.role}</span>
                  <p className="text-ink">{n.note}</p>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Audit trail */}
        <Section title="Audit Trail">
          <AuditTimeline logs={data.audit_trail} />
        </Section>

        {/* Model explanation */}
        <Section title="Model / Rule Explanation">
          <p className="text-sm text-ink">{data.model_rule_explanation}</p>
          <p className="mt-2 font-mono text-xs text-muted">Output hash: {data.output_hash}</p>
        </Section>

        {/* Human-in-loop + disclaimer */}
        <div className="rounded-xl border border-teal-600/20 bg-teal-50 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-teal-800">
            <ShieldAlert className="h-4 w-4" /> Human-in-the-Loop Safety
          </p>
          <p className="mt-1 text-sm text-teal-800">{data.human_in_loop_note}</p>
        </div>
        <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
          <MvpBadge />
          <p className="text-xs leading-relaxed text-muted">{data.disclaimer}</p>
        </div>
      </div>
    </div>
  );
}

function Score({ label, value, sub, tone = "text-navy" }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-line p-3 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 text-lg font-extrabold ${tone}`}>
        {value}
        {sub && <span className="text-xs font-medium text-slate-400"> {sub}</span>}
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">{title}</h3>
      {children}
    </div>
  );
}
