// ClaimGuard AI — Hospital Portal (route: /hospital). Hospital-side claim tracking.
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Upload, MessageSquareWarning, FileX2, CheckCircle2 } from "lucide-react";
import { useAsync } from "../utils/useAsync";
import { getAuditLogs, getClaims } from "../api/client";
import { PageIntro, LoadingState, ErrorState, StatusBadge, RiskBadge, MvpBadge } from "../components/ui";
import { MANDATORY_DOCS } from "../data/catalogue";
import { inr, shortDate } from "../utils/format";

export default function HospitalPortal() {
  const claimsQ = useAsync(() => getClaims(), []);
  const auditQ = useAsync(() => getAuditLogs(), []);
  const [resubmitted, setResubmitted] = useState<Record<string, boolean>>({});

  const claims = claimsQ.data?.claims ?? [];
  const hospitals = useMemo(() => [...new Set(claims.map((c) => c.hospital_name))].sort(), [claims]);
  const [hospital, setHospital] = useState<string>("");

  const visible = hospital ? claims.filter((c) => c.hospital_name === hospital) : claims;

  // Map claim -> latest auditor query/hold note.
  const queryByClaim = useMemo(() => {
    const m: Record<string, string> = {};
    for (const log of auditQ.data?.logs ?? []) {
      if (["Query Hospital", "Fraud Hold", "Send to Medical Audit", "Reject"].includes(log.action) && log.note) {
        if (!m[log.claim_id]) m[log.claim_id] = `${log.action}: ${log.note}`;
      }
    }
    return m;
  }, [auditQ.data]);

  if (claimsQ.loading) return <LoadingState label="Loading hospital portal…" />;
  if (claimsQ.error) return <ErrorState message={claimsQ.error} onRetry={claimsQ.refetch} />;

  return (
    <div>
      <PageIntro
        title="Hospital Portal"
        subtitle="Hospital-side view — track submitted claims, queries and document requests."
        demo="The hospital's view of its own claims: current status, auditor queries, exactly which mandatory documents are missing, why a claim was queried, and a simulated 'resubmit documents' action."
      />

      <div className="mb-5 flex items-center gap-3">
        <Building2 className="h-5 w-5 text-teal-600" />
        <select className="input max-w-xs" value={hospital} onChange={(e) => setHospital(e.target.value)}>
          <option value="">All hospitals</option>
          {hospitals.map((h) => (
            <option key={h}>{h}</option>
          ))}
        </select>
        <Link to="/claims/new" className="btn-primary ml-auto">
          <Upload className="h-4 w-4" /> Submit New Claim
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {visible.map((c) => {
          const missing = MANDATORY_DOCS.filter((d) => d.mandatory && !c.documents?.[d.key as keyof typeof c.documents]);
          const query = queryByClaim[c.claim_id];
          const isResubmitted = resubmitted[c.claim_id];
          return (
            <div key={c.claim_id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-extrabold text-navy">{c.claim_id}</p>
                    <StatusBadge status={c.status} />
                    <RiskBadge category={c.risk_category} score={c.risk_score} />
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {c.treatment_package} · {c.diagnosis} · {inr(c.claim_amount)} · Submitted {shortDate(c.submission_date)}
                  </p>
                </div>
                <Link to={`/claims/${c.claim_id}`} className="btn-ghost py-2 text-xs">
                  View details
                </Link>
              </div>

              {/* Auditor query */}
              {query && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <MessageSquareWarning className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-semibold">Auditor query / action</p>
                    <p>{query}</p>
                  </div>
                </div>
              )}

              {/* Missing documents */}
              {missing.length > 0 ? (
                <div className="mt-4">
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-700">
                    <FileX2 className="h-4 w-4" /> Missing documents requested
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {missing.map((m) => (
                      <span key={m.key} className="chip bg-red-50 text-red-700">
                        {m.label}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      disabled={isResubmitted}
                      onClick={() => setResubmitted((s) => ({ ...s, [c.claim_id]: true }))}
                      className="btn-primary py-2 text-xs"
                    >
                      <Upload className="h-3.5 w-3.5" /> {isResubmitted ? "Documents resubmitted" : "Resubmit documents"}
                    </button>
                    {isResubmitted && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-green-700">
                        <CheckCircle2 className="h-4 w-4" /> Queued for re-review
                      </span>
                    )}
                    <MvpBadge className="ml-auto" />
                  </div>
                </div>
              ) : (
                <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-green-700">
                  <CheckCircle2 className="h-4 w-4" /> All mandatory documents present
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
