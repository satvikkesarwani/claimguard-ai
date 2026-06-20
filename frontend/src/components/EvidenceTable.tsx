// ClaimGuard AI — evidence table used on report + review pages.
import type { EvidenceRow } from "../types";
import { EmptyState } from "./ui";

export default function EvidenceTable({ rows }: { rows: EvidenceRow[] }) {
  if (!rows.length) {
    return <EmptyState title="No risk evidence" hint="No signals were triggered for this claim." />;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-line bg-canvas text-xs uppercase tracking-wide text-muted">
            <th className="px-4 py-2.5 font-semibold">Signal</th>
            <th className="px-4 py-2.5 font-semibold">Category</th>
            <th className="px-4 py-2.5 font-semibold">Detected by</th>
            <th className="px-4 py-2.5 font-semibold text-right">Risk +</th>
            <th className="px-4 py-2.5 font-semibold">Detail</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line/70 last:border-0">
              <td className="px-4 py-2.5 font-semibold text-navy">{r.signal}</td>
              <td className="px-4 py-2.5 text-muted">{r.category}</td>
              <td className="px-4 py-2.5 text-ink">{r.agent}</td>
              <td className="px-4 py-2.5 text-right font-bold text-risk-high">+{r.risk_contribution}</td>
              <td className="px-4 py-2.5 text-xs text-muted">{r.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
