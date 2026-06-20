// ClaimGuard AI — vertical audit trail timeline.
import type { AuditLog } from "../types";
import { dateTime } from "../utils/format";
import { EmptyState } from "./ui";

export default function AuditTimeline({ logs }: { logs: AuditLog[] }) {
  if (!logs.length) {
    return <EmptyState title="No audit history yet" hint="Actions taken on this claim will appear here." />;
  }
  return (
    <ol className="relative ml-2 border-l-2 border-line">
      {logs.map((log) => (
        <li key={log.id} className="mb-5 ml-5 last:mb-0">
          <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-teal-500" />
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-navy">{log.action}</p>
            <span className="chip bg-slate-100 text-slate-600">{log.user_role}</span>
            <span className="text-xs text-muted">{dateTime(log.timestamp)}</span>
          </div>
          {(log.previous_status || log.new_status) && (
            <p className="mt-0.5 text-xs text-muted">
              {log.previous_status || "—"} <span className="text-slate-300">→</span>{" "}
              <span className="font-semibold text-navy-700">{log.new_status}</span>
            </p>
          )}
          {log.note && <p className="mt-1 text-sm text-ink">{log.note}</p>}
          <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-muted">
            {log.reason && <span>Reason: {log.reason}</span>}
            {log.evidence_id && <span>Evidence: {log.evidence_id}</span>}
            {log.output_hash && <span className="font-mono">{log.output_hash}</span>}
          </div>
        </li>
      ))}
    </ol>
  );
}
