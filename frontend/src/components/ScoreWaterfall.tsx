// ClaimGuard AI — deterministic score-attribution waterfall.
// Every point of the 0-100 risk score is traced to a named signal (exact, not estimated SHAP).
import type { ScoreAttribution } from "../types";

export default function ScoreWaterfall({ data }: { data: ScoreAttribution }) {
  const max = Math.max(data.final_score, 100);
  return (
    <div>
      <div className="space-y-2">
        {data.steps.map((s, i) => {
          const isTotal = s.kind === "total";
          const isBase = s.kind === "base";
          const start = isBase ? 0 : isTotal ? 0 : s.cumulative - s.value;
          const widthPct = ((isTotal ? s.cumulative : s.value) / max) * 100;
          const offsetPct = (start / max) * 100;
          return (
            <div key={i} className="flex items-center gap-3">
              <div className="w-44 shrink-0 truncate text-xs text-ink" title={s.label}>
                {s.label}
              </div>
              <div className="relative h-6 flex-1 rounded-md bg-slate-50">
                <div
                  className={`absolute top-0 h-6 rounded-md ${
                    isBase ? "bg-slate-300" : isTotal ? "bg-navy" : "bg-risk-high"
                  }`}
                  style={{ left: `${offsetPct}%`, width: `${Math.max(widthPct, isBase ? 0 : 2)}%` }}
                />
              </div>
              <div className={`w-12 shrink-0 text-right text-xs font-bold ${isTotal ? "text-navy" : "text-risk-high"}`}>
                {isTotal ? s.cumulative : `+${s.value}`}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-muted">{data.note}</p>
      {data.capped && (
        <p className="mt-1 text-[11px] font-medium text-amber-600">
          Raw total {data.raw_total} exceeded 100 and was capped to 100.
        </p>
      )}
    </div>
  );
}
