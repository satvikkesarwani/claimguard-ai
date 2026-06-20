// ClaimGuard AI — Feedback Learning Loop (route: /feedback). MVP Simulation.
import { AlertTriangle, CheckCircle2, XCircle, TrendingUp, GitBranch, Activity } from "lucide-react";
import { useAsync } from "../utils/useAsync";
import { getFeedback } from "../api/client";
import { PageIntro, LoadingState, ErrorState, StatCard, MvpBadge } from "../components/ui";
import { dateTime } from "../utils/format";

export default function Feedback() {
  const { data, loading, error, refetch } = useAsync(getFeedback, []);
  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error || "No feedback"} onRetry={refetch} />;

  const s = data.summary;

  return (
    <div>
      <PageIntro
        title="Feedback Learning Loop"
        subtitle="Auditor decisions captured to improve the system over time."
        demo="How auditor decisions feed back into the system: confirmed-fraud / false-positive / false-negative tallies, a rule-improvement queue, a model-monitoring queue, and a drift warning. This is a simulation — no model is actually retrained."
      />

      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        <span className="font-semibold">MVP Simulation:</span> {data.note}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Confirmed Fraud" value={s.confirmed_fraud} icon={<CheckCircle2 className="h-5 w-5" />} accent="text-red-500" />
        <StatCard label="False Positive" value={s.false_positive} icon={<XCircle className="h-5 w-5" />} accent="text-amber-500" />
        <StatCard label="False Negative" value={s.false_negative} icon={<AlertTriangle className="h-5 w-5" />} accent="text-orange-500" />
        <StatCard label="True Positive" value={s.true_positive} icon={<TrendingUp className="h-5 w-5" />} accent="text-green-600" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Captured feedback */}
        <div className="card p-5">
          <h3 className="mb-3 text-sm font-bold text-navy">Feedback Captured</h3>
          {data.events.length ? (
            <ul className="space-y-2.5">
              {data.events.map((e) => (
                <li key={e.id} className="rounded-xl border border-line px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-navy">{e.claim_id}</span>
                    <span className={`chip ${feedbackTone(e.feedback_type)}`}>{label(e.feedback_type)}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    AI: {e.ai_recommendation} → Auditor: {e.auditor_decision} · {e.user_role} · {dateTime(e.timestamp)}
                  </p>
                  {e.note && <p className="mt-1 text-sm text-ink">{e.note}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No feedback events yet.</p>
          )}
        </div>

        <div className="space-y-6">
          {/* Rule improvement queue */}
          <div className="card p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-navy">
              <GitBranch className="h-4 w-4 text-teal-600" /> Rule Improvement Queue
            </h3>
            <ul className="space-y-2.5">
              {data.rule_improvement_queue.map((r, i) => (
                <li key={i} className="rounded-xl bg-canvas px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-navy">{r.rule}</span>
                    <span className="chip bg-blue-50 text-blue-700">{r.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{r.observation}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Model monitoring */}
          <div className="card p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-navy">
              <Activity className="h-4 w-4 text-teal-600" /> Model Monitoring Queue
              {data.drift_warning && <span className="ml-auto chip bg-red-50 text-red-700">Drift warning</span>}
            </h3>
            <div className="space-y-2">
              {data.model_monitoring_queue.map((m, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-line px-3.5 py-2.5 text-sm">
                  <div>
                    <p className="font-semibold text-navy">{m.metric}</p>
                    <p className="text-xs text-muted">Target {m.target}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-navy">{m.simulated_value}</p>
                    <span className={`chip ${m.status === "Drift Warning" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                      {m.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-end">
              <MvpBadge />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function label(t: string): string {
  return { confirmed_fraud: "Confirmed Fraud", false_positive: "False Positive", false_negative: "False Negative", true_positive: "True Positive" }[t] ?? t;
}
function feedbackTone(t: string): string {
  return (
    {
      confirmed_fraud: "bg-red-50 text-red-700",
      false_positive: "bg-amber-50 text-amber-700",
      false_negative: "bg-orange-50 text-orange-700",
      true_positive: "bg-green-50 text-green-700",
    }[t] ?? "bg-slate-100 text-slate-600"
  );
}
