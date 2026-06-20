// ClaimGuard AI — Claims Dashboard (route: /claims). List + filter + search.
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, FilePlus2, X } from "lucide-react";
import { useAsync } from "../utils/useAsync";
import { getClaims } from "../api/client";
import { PageIntro, LoadingState, ErrorState, RiskBadge } from "../components/ui";
import ClaimTable from "../components/ClaimTable";

const RISK_LEVELS = ["Low Risk", "Medium Risk", "High Risk", "Critical Risk"];
const STATUSES = ["Pending Review", "Approved", "Queried", "In Medical Audit", "Fraud Hold", "Rejected"];

export default function ClaimsDashboard() {
  const { data, loading, error, refetch } = useAsync(() => getClaims(), []);
  const [search, setSearch] = useState("");
  const [risk, setRisk] = useState("");
  const [status, setStatus] = useState("");
  const [hospital, setHospital] = useState("");
  const [pkg, setPkg] = useState("");

  const claims = data?.claims ?? [];
  const hospitals = useMemo(() => [...new Set(claims.map((c) => c.hospital_name))].sort(), [claims]);
  const packages = useMemo(() => [...new Set(claims.map((c) => c.treatment_package))].sort(), [claims]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return claims.filter((c) => {
      if (risk && c.risk_category !== risk) return false;
      if (status && c.status !== status) return false;
      if (hospital && c.hospital_name !== hospital) return false;
      if (pkg && c.treatment_package !== pkg) return false;
      if (
        s &&
        !(
          c.claim_id.toLowerCase().includes(s) ||
          c.beneficiary_id.toLowerCase().includes(s) ||
          c.hospital_name.toLowerCase().includes(s) ||
          c.diagnosis.toLowerCase().includes(s) ||
          c.treatment_package.toLowerCase().includes(s)
        )
      )
        return false;
      return true;
    });
  }, [claims, search, risk, status, hospital, pkg]);

  const anyFilter = search || risk || status || hospital || pkg;
  function clearAll() {
    setSearch("");
    setRisk("");
    setStatus("");
    setHospital("");
    setPkg("");
  }

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of claims) m[c.risk_category] = (m[c.risk_category] ?? 0) + 1;
    return m;
  }, [claims]);

  return (
    <div>
      <PageIntro
        title="Claims Dashboard"
        subtitle="Triage all submitted claims by AI risk score, category and recommended action."
        demo="The full claims queue with live risk scores from the rule-based engine. Filter by risk, status, hospital or package and search instantly — then open any claim to review the AI's reasoning."
      />

      {/* Risk summary strip */}
      <div className="mb-5 flex flex-wrap gap-3">
        {RISK_LEVELS.map((r) => (
          <button
            key={r}
            onClick={() => setRisk(risk === r ? "" : r)}
            className={`card flex items-center gap-2.5 px-4 py-2.5 transition ${risk === r ? "ring-2 ring-teal-500/40" : ""}`}
          >
            <RiskBadge category={r} />
            <span className="text-lg font-extrabold text-navy">{counts[r] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card mb-5 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="relative md:col-span-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search claim, beneficiary, hospital, diagnosis…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input md:col-span-2" value={risk} onChange={(e) => setRisk(e.target.value)}>
            <option value="">All risk levels</option>
            {RISK_LEVELS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <select className="input md:col-span-2" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select className="input md:col-span-2" value={hospital} onChange={(e) => setHospital(e.target.value)}>
            <option value="">All hospitals</option>
            {hospitals.map((h) => (
              <option key={h}>{h}</option>
            ))}
          </select>
          <select className="input md:col-span-2" value={pkg} onChange={(e) => setPkg(e.target.value)}>
            <option value="">All packages</option>
            {packages.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-muted">
            Showing <span className="font-semibold text-navy">{filtered.length}</span> of {claims.length} claims
          </p>
          <div className="flex gap-2">
            {anyFilter && (
              <button onClick={clearAll} className="btn-ghost py-2 text-xs">
                <X className="h-3.5 w-3.5" /> Clear filters
              </button>
            )}
            <Link to="/claims/new" className="btn-primary py-2 text-xs">
              <FilePlus2 className="h-3.5 w-3.5" /> Submit Claim
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Loading claims…" />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <ClaimTable claims={filtered} />
      )}
    </div>
  );
}
