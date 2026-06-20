// ClaimGuard AI — Analytics Dashboard (route: /analytics). Policy/admin view.
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Activity, Clock, Zap, ShieldAlert } from "lucide-react";
import { useAsync } from "../utils/useAsync";
import { getAnalyticsOverview, getHospitals } from "../api/client";
import { PageIntro, LoadingState, ErrorState, StatCard, ChartCard } from "../components/ui";
import { CHART_COLORS, riskHex } from "../utils/format";

export default function Analytics() {
  const overviewQ = useAsync(getAnalyticsOverview, []);
  const hospitalsQ = useAsync(getHospitals, []);

  if (overviewQ.loading || hospitalsQ.loading) return <LoadingState label="Crunching analytics…" />;
  if (overviewQ.error || !overviewQ.data)
    return <ErrorState message={overviewQ.error || "No analytics"} onRetry={overviewQ.refetch} />;

  const d = overviewQ.data;
  const hospitals = hospitalsQ.data?.hospitals ?? [];

  return (
    <div>
      <PageIntro
        title="Analytics Dashboard"
        subtitle="Policy & admin view — risk distribution, hospital anomalies and audit insights."
        demo="The population-scale policy view: risk distribution, status breakdown, high-risk packages, hospital anomaly leaderboard, fast-track rate, average review time and the audit-action mix — all computed live from the claims data."
      />

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Claims" value={d.total_claims} icon={<Activity className="h-5 w-5" />} />
        <StatCard label="Fast-Track Rate" value={`${d.fast_track_rate}%`} sub="Low-risk auto-cleared" icon={<Zap className="h-5 w-5" />} accent="text-green-600" />
        <StatCard label="High-Risk Flagged" value={d.high_risk_flagged} sub="High + Critical" icon={<ShieldAlert className="h-5 w-5" />} accent="text-red-500" />
        <StatCard label="Avg Review Time" value={`${d.avg_review_time_min}m`} sub={`Avg score ${d.avg_risk_score}/100`} icon={<Clock className="h-5 w-5" />} accent="text-amber-500" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Risk distribution */}
        <ChartCard title="Risk Distribution" subtitle="Claims by AI risk band">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie isAnimationActive={false} data={d.risk_distribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {d.risk_distribution.map((e) => (
                  <Cell key={e.name} fill={riskHex(e.name)} />
                ))}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Status breakdown */}
        <ChartCard title="Status Breakdown" subtitle="Claims by current workflow status">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={d.status_distribution} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid horizontal={false} stroke="#eef2f7" />
              <XAxis type="number" allowDecimals={false} stroke="#94a3b8" fontSize={12} />
              <YAxis type="category" dataKey="name" width={110} stroke="#475569" fontSize={12} />
              <Tooltip cursor={{ fill: "#f1f5f9" }} />
              <Bar isAnimationActive={false} dataKey="value" fill="#0d9488" radius={[0, 6, 6, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* High-risk packages */}
        <ChartCard title="High-Risk Packages" subtitle="Average risk score per treatment package">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={d.high_risk_packages} margin={{ bottom: 40 }}>
              <CartesianGrid vertical={false} stroke="#eef2f7" />
              <XAxis dataKey="package" angle={-25} textAnchor="end" interval={0} height={70} stroke="#475569" fontSize={10} />
              <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
              <Tooltip cursor={{ fill: "#f1f5f9" }} />
              <Bar isAnimationActive={false} dataKey="avg_risk" radius={[6, 6, 0, 0]} barSize={26}>
                {d.high_risk_packages.map((p, i) => (
                  <Cell key={i} fill={p.avg_risk > 50 ? "#dc2626" : p.avg_risk > 25 ? "#d97706" : "#16a34a"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Audit action distribution */}
        <ChartCard title="Audit Action Distribution" subtitle="What auditors did across all claims">
          {d.audit_action_distribution.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie isAnimationActive={false} data={d.audit_action_distribution} dataKey="value" nameKey="name" outerRadius={95} label>
                  {d.audit_action_distribution.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-16 text-center text-sm text-muted">No auditor actions recorded yet.</p>
          )}
        </ChartCard>
      </div>

      {/* Hospital anomaly leaderboard */}
      <ChartCard title="Hospital Anomaly Leaderboard" subtitle="Hospitals ranked by average claim risk" >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                <th className="py-2.5 pr-4 font-semibold">Hospital</th>
                <th className="px-4 py-2.5 font-semibold text-right">Claims</th>
                <th className="px-4 py-2.5 font-semibold text-right">Flagged</th>
                <th className="px-4 py-2.5 font-semibold text-right">Signals</th>
                <th className="px-4 py-2.5 font-semibold text-right">Avg Risk</th>
                <th className="px-4 py-2.5 font-semibold">Anomaly</th>
              </tr>
            </thead>
            <tbody>
              {hospitals.map((h) => (
                <tr key={h.hospital_name} className="border-b border-line/70 last:border-0">
                  <td className="py-2.5 pr-4 font-semibold text-navy">
                    {h.hospital_name} <span className="text-xs font-normal text-muted">{h.hospital_id}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right">{h.claims}</td>
                  <td className="px-4 py-2.5 text-right text-red-600">{h.flagged_claims}</td>
                  <td className="px-4 py-2.5 text-right">{h.signal_count}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-navy">{h.avg_risk_score}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className="chip"
                      style={{ backgroundColor: anomalyHex(h.anomaly_level) + "1a", color: anomalyHex(h.anomaly_level) }}
                    >
                      {h.anomaly_level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

function anomalyHex(level: string): string {
  return { Low: "#16a34a", Medium: "#d97706", High: "#ea580c", Critical: "#dc2626" }[level] ?? "#64748b";
}
