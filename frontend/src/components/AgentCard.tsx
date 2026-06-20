// ClaimGuard AI — agent result card for the multi-agent verification view.
import { CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import type { AgentResult } from "../types";
import { ConfidenceBar } from "./ui";

const STATUS_STYLE: Record<string, { icon: typeof CheckCircle2; ring: string; text: string; tone: string }> = {
  Passed: { icon: CheckCircle2, ring: "ring-green-200", text: "text-green-700", tone: "bg-green-500" },
  Warning: { icon: AlertTriangle, ring: "ring-amber-200", text: "text-amber-700", tone: "bg-amber-500" },
  Failed: { icon: XCircle, ring: "ring-red-200", text: "text-red-700", tone: "bg-red-500" },
};

export default function AgentCard({
  agent,
  pending = false,
}: {
  agent: AgentResult;
  pending?: boolean;
}) {
  const s = STATUS_STYLE[agent.status] ?? STATUS_STYLE.Passed;
  const Icon = s.icon;

  if (pending) {
    return (
      <div className="card flex items-center gap-3 p-4 opacity-60">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        <div>
          <p className="text-sm font-bold text-navy">{agent.name}</p>
          <p className="text-xs text-muted">Awaiting verification…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`card p-4 ring-1 ${s.ring}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Icon className={`mt-0.5 h-5 w-5 ${s.text}`} />
          <div>
            <p className="text-sm font-bold text-navy">{agent.name}</p>
            <p className="text-xs text-muted">{agent.input_checked}</p>
          </div>
        </div>
        <span className={`chip bg-slate-50 ${s.text}`}>{agent.status}</span>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-muted">
          <span>Confidence</span>
          <span className="text-navy">{agent.confidence}%</span>
        </div>
        <ConfidenceBar value={agent.confidence} tone={s.tone} />
      </div>

      <dl className="mt-3 space-y-1.5 text-xs">
        <div>
          <dt className="font-semibold text-muted">Output</dt>
          <dd className="text-ink">{agent.output}</dd>
        </div>
        <div>
          <dt className="font-semibold text-muted">Evidence</dt>
          <dd>
            <ul className="ml-3.5 list-disc space-y-0.5 text-ink">
              {agent.evidence.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>

      <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
        <p className="text-[11px] text-muted">{agent.explanation}</p>
      </div>
      <div className="mt-1.5 text-right">
        <span className="chip bg-navy/5 text-navy-700">Risk +{agent.risk_contribution}</span>
      </div>
    </div>
  );
}
