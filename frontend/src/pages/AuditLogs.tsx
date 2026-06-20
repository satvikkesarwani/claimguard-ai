// ClaimGuard AI — Audit Logs (route: /audit). Full traceability trail.
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Search } from "lucide-react";
import { useAsync } from "../utils/useAsync";
import { getAuditLogs } from "../api/client";
import { PageIntro, LoadingState, ErrorState, EmptyState, MvpBadge } from "../components/ui";
import { dateTime } from "../utils/format";

export default function AuditLogs() {
  const { data, loading, error, refetch } = useAsync(() => getAuditLogs(), []);
  const [search, setSearch] = useState("");
  const logs = data?.logs ?? [];

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return logs;
    return logs.filter(
      (l) =>
        l.claim_id.toLowerCase().includes(s) ||
        l.action.toLowerCase().includes(s) ||
        l.user_role.toLowerCase().includes(s)
    );
  }, [logs, search]);

  return (
    <div>
      <PageIntro
        title="Audit Logs"
        subtitle="Every claim action, timestamped with role, status change, reason and output hash."
        demo="The traceability layer: an append-only-style log of every action (submission + auditor decisions) with role, previous→new status, note, reason, evidence ID and a model/rule output-hash placeholder."
      />

      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-teal-600/20 bg-teal-50 px-4 py-2.5 text-sm text-teal-800">
          <ShieldCheck className="h-4 w-4" />
          <span className="font-semibold">Immutable audit trail</span>
          <MvpBadge className="ml-1" />
        </div>
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search claim / action / role…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No audit entries" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-canvas text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-semibold">Timestamp</th>
                  <th className="px-4 py-3 font-semibold">Claim</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status change</th>
                  <th className="px-4 py-3 font-semibold">Note</th>
                  <th className="px-4 py-3 font-semibold">Output hash</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id} className="border-b border-line/70 last:border-0 hover:bg-canvas/60">
                    <td className="px-4 py-3 text-xs text-muted">{dateTime(l.timestamp)}</td>
                    <td className="px-4 py-3">
                      <Link to={`/claims/${l.claim_id}`} className="font-semibold text-teal-700 hover:underline">
                        {l.claim_id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-semibold text-navy">{l.action}</td>
                    <td className="px-4 py-3 text-muted">{l.user_role}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className="text-muted">{l.previous_status || "—"}</span>
                      <span className="mx-1 text-slate-300">→</span>
                      <span className="font-semibold text-navy-700">{l.new_status}</span>
                    </td>
                    <td className="px-4 py-3 max-w-[240px] truncate text-ink" title={l.note}>
                      {l.note || "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-muted">{l.output_hash}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
