// ClaimGuard AI — claims table with risk + status badges and a review link.
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { Claim } from "../types";
import { inr, shortDate } from "../utils/format";
import { RiskBadge, StatusBadge, EmptyState } from "./ui";

export default function ClaimTable({ claims }: { claims: Claim[] }) {
  if (!claims.length) {
    return <EmptyState title="No claims match these filters" hint="Try clearing a filter or resetting the demo data." />;
  }
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[940px] text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-canvas text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-semibold">Claim ID</th>
              <th className="px-4 py-3 font-semibold">Beneficiary</th>
              <th className="px-4 py-3 font-semibold">Hospital</th>
              <th className="px-4 py-3 font-semibold">Package</th>
              <th className="px-4 py-3 font-semibold text-right">Amount</th>
              <th className="px-4 py-3 font-semibold">Submitted</th>
              <th className="px-4 py-3 font-semibold">Risk</th>
              <th className="px-4 py-3 font-semibold">Recommended</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {claims.map((c) => (
              <tr key={c.claim_id} className="border-b border-line/70 last:border-0 hover:bg-canvas/60">
                <td className="px-4 py-3 font-semibold text-navy">{c.claim_id}</td>
                <td className="px-4 py-3 text-muted">{c.beneficiary_id}</td>
                <td className="px-4 py-3 text-ink">{c.hospital_name}</td>
                <td className="px-4 py-3 text-ink">{c.treatment_package}</td>
                <td className="px-4 py-3 text-right font-medium text-ink">{inr(c.claim_amount)}</td>
                <td className="px-4 py-3 text-muted">{shortDate(c.submission_date)}</td>
                <td className="px-4 py-3">
                  <RiskBadge category={c.risk_category} score={c.risk_score} />
                </td>
                <td className="px-4 py-3 text-xs font-medium text-navy-700">{c.recommended_action}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={c.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to={`/claims/${c.claim_id}`}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50"
                  >
                    Review <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
