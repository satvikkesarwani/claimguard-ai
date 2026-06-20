// ClaimGuard AI — Multi-Agent Verification (route: /agents/:claimId).
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Play, ArrowRight, CircleDot } from "lucide-react";
import { useAsync } from "../utils/useAsync";
import { analyzeClaim } from "../api/client";
import { PageIntro, LoadingState, ErrorState, MvpBadge } from "../components/ui";
import AgentCard from "../components/AgentCard";
import RiskGauge from "../components/RiskGauge";

export default function AgentsPage() {
  const { claimId = "" } = useParams();
  const { data, loading, error, refetch } = useAsync(() => analyzeClaim(claimId), [claimId]);
  const [revealed, setRevealed] = useState(0);
  const [running, setRunning] = useState(false);

  // Reveal all immediately once loaded; "Run Verification" replays the animation.
  useEffect(() => {
    if (data) setRevealed(data.agents.length);
  }, [data]);

  function runVerification() {
    if (!data) return;
    setRunning(true);
    setRevealed(0);
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setRevealed(i);
      if (i >= data.agents.length) {
        clearInterval(timer);
        setRunning(false);
      }
    }, 420);
  }

  if (loading) return <LoadingState label="Loading agents…" />;
  if (error || !data) return <ErrorState message={error || "Claim not found"} onRetry={refetch} />;

  const done = revealed >= data.agents.length;

  return (
    <div>
      <PageIntro
        title={`Multi-Agent Verification · ${claimId}`}
        subtitle="Ten specialized agents each verify one domain, then combine into a single risk score."
        demo="How the multi-agent system works. Press Run Verification to watch each agent report its status, confidence and evidence in sequence, then see the combined risk score and recommendation."
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted">
          <CircleDot className="h-4 w-4 text-teal-600" />
          {done ? `All ${data.agents.length} agents completed` : `Verifying… ${revealed}/${data.agents.length}`}
          <MvpBadge className="ml-2" />
        </div>
        <div className="flex gap-2">
          <button onClick={runVerification} disabled={running} className="btn-primary">
            <Play className="h-4 w-4" /> {running ? "Running…" : "Run Verification"}
          </button>
          <Link to={`/claims/${claimId}`} className="btn-ghost">
            Back to Review <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-teal-500 transition-all duration-300"
          style={{ width: `${(revealed / data.agents.length) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-2">
          {data.agents.map((a, i) => (
            <AgentCard key={a.key} agent={a} pending={i >= revealed} />
          ))}
        </div>

        <div className="space-y-6">
          <div className={`card p-6 transition ${done ? "ring-2 ring-teal-500/30" : "opacity-70"}`}>
            <h3 className="mb-2 text-sm font-bold text-navy">Combined Risk Score</h3>
            {done ? (
              <>
                <RiskGauge score={data.risk_score} category={data.risk_category} />
                <div className="mt-4 rounded-xl bg-canvas p-3 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Recommendation</p>
                  <p className="mt-1 text-sm font-bold text-navy">{data.recommended_action}</p>
                </div>
              </>
            ) : (
              <p className="py-10 text-center text-sm text-muted">Final score appears after all agents complete…</p>
            )}
          </div>

          <div className="card p-6">
            <h3 className="mb-3 text-sm font-bold text-navy">Active Signals</h3>
            {data.active_signals.length ? (
              <div className="flex flex-wrap gap-2">
                {data.top_factors.map((f) => (
                  <span key={f.key} className="chip bg-red-50 text-red-700">
                    {f.label} +{f.contribution}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No risk signals — clean claim.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
