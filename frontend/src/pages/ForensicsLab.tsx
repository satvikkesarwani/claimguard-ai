// ClaimGuard AI — Forensic Analytics Lab (route: /forensics).
// Real fraud-analytics techniques applied to mock data (MVP Simulation).
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  ReferenceLine,
} from "recharts";
import { IdCard, AlertTriangle, PhoneCall, Skull } from "lucide-react";
import { useAsync } from "../utils/useAsync";
import { getBenford, getIdentityFlags, getNetwork, getPeerOutliers, getClaims } from "../api/client";
import { PageIntro, LoadingState, ChartCard, MvpBadge, SectionTitle } from "../components/ui";
import { inr } from "../utils/format";
import type { NetworkNode } from "../types";

export default function ForensicsLab() {
  const claimsQ = useAsync(() => getClaims(), []);
  const [hospital, setHospital] = useState<string>("");
  const benfordQ = useAsync(() => getBenford(hospital || undefined), [hospital]);
  const peerQ = useAsync(getPeerOutliers, []);
  const identityQ = useAsync(getIdentityFlags, []);
  const networkQ = useAsync(getNetwork, []);

  const hospitals = useMemo(
    () => [...new Set((claimsQ.data?.claims ?? []).map((c) => c.hospital_name))].sort(),
    [claimsQ.data]
  );

  if (peerQ.loading || identityQ.loading || networkQ.loading) return <LoadingState label="Running forensic analytics…" />;

  return (
    <div>
      <PageIntro
        title="Forensic Analytics Lab"
        subtitle="Statistical fraud-forensics — Benford's Law, peer outliers, identity clusters and collusion networks."
        demo="Real fraud-analytics techniques applied to mock data: Benford's-Law billing test (Nigrini MAD thresholds), provider peer-outlier z-scores, a ghost-beneficiary / identity-cluster detector that replicates real CAG findings on PM-JAY, and a collusion network graph."
      />

      {/* Benford */}
      <ChartCard
        title="Benford's Law — Billing Amount Analyzer"
        subtitle="First-digit distribution of billed amounts vs the Benford curve (fabrication signal)"
        action={
          <select className="input max-w-[220px] py-1.5 text-xs" value={hospital} onChange={(e) => setHospital(e.target.value)}>
            <option value="">All hospitals</option>
            {hospitals.map((h) => (
              <option key={h}>{h}</option>
            ))}
          </select>
        }
      >
        {benfordQ.data && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={benfordQ.data.digits}>
                  <CartesianGrid vertical={false} stroke="#eef2f7" />
                  <XAxis dataKey="digit" stroke="#475569" fontSize={12} label={{ value: "Leading digit", position: "insideBottom", offset: -3, fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" fontSize={12} unit="%" />
                  <Tooltip />
                  <Bar dataKey="observed" name="Observed %" fill="#0d9488" radius={[5, 5, 0, 0]} barSize={26} isAnimationActive={false} />
                  <Line dataKey="expected" name="Benford expected %" stroke="#dc2626" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col justify-center gap-3 rounded-xl bg-canvas p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">MAD (conformity)</p>
                <p className="text-3xl font-extrabold text-navy">{benfordQ.data.mad}</p>
              </div>
              <span
                className="chip w-fit"
                style={{ backgroundColor: bandHex(benfordQ.data.conformity_band) + "1a", color: bandHex(benfordQ.data.conformity_band) }}
              >
                {benfordQ.data.conformity_band}
              </span>
              <p className="text-sm text-ink">{benfordQ.data.verdict}</p>
              <p className="text-[11px] text-muted">
                Sample: {benfordQ.data.sample_size} line items · Nonconformity threshold MAD &gt; {benfordQ.data.thresholds.marginal}
              </p>
            </div>
          </div>
        )}
        <p className="mt-3 text-[11px] text-muted">{benfordQ.data?.note}</p>
      </ChartCard>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Peer outliers */}
        <ChartCard title="Provider Peer-Outlier Radar" subtitle="z-scores: avg claim value vs signal density">
          {peerQ.data && (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart margin={{ left: 4, right: 12, top: 8 }}>
                  <CartesianGrid stroke="#eef2f7" />
                  <XAxis type="number" dataKey="z_claim_value" name="Claim value z" stroke="#94a3b8" fontSize={11} label={{ value: "Claim value (z)", position: "insideBottom", offset: -2, fontSize: 10 }} />
                  <YAxis type="number" dataKey="z_signal_density" name="Signal density z" stroke="#94a3b8" fontSize={11} />
                  <ZAxis type="number" range={[80, 320]} dataKey="claims" />
                  <ReferenceLine x={1.5} stroke="#dc2626" strokeDasharray="4 4" />
                  <ReferenceLine y={1.5} stroke="#dc2626" strokeDasharray="4 4" />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} content={<PeerTip />} />
                  <Scatter data={peerQ.data.providers} isAnimationActive={false}>
                    {peerQ.data.providers.map((p, i) => (
                      <Cell key={i} fill={p.outlier ? "#dc2626" : "#0d9488"} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1.5">
                {peerQ.data.providers.slice(0, 4).map((p) => (
                  <div key={p.hospital} className="flex items-center justify-between text-xs">
                    <span className="text-ink">{p.hospital}</span>
                    <span className={`chip ${p.outlier ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}>
                      peak z {p.peak_z} {p.outlier && "· outlier"}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </ChartCard>

        {/* Collusion network */}
        <ChartCard title="Collusion Network Graph" subtitle="Provider ↔ beneficiary ↔ broker links; rings highlighted">
          {networkQ.data && <NetworkGraph nodes={networkQ.data.nodes} edges={networkQ.data.edges} />}
          {networkQ.data?.rings.length ? (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="flex items-center gap-2 text-xs font-bold text-red-700">
                <AlertTriangle className="h-4 w-4" /> {networkQ.data.rings.length} potential ring(s) detected
              </p>
              {networkQ.data.rings.map((r) => (
                <p key={r.phone} className="mt-1 text-xs text-red-700">
                  Phone {r.phone}: {r.members.join(", ")} · ring strength {r.ring_strength}
                </p>
              ))}
            </div>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted">
            <Legend color="#0f2747" label="Hospital" />
            <Legend color="#0d9488" label="Beneficiary" />
            <Legend color="#dc2626" label="Broker" />
            <Legend color="#dc2626" label="Shared-phone link" line />
          </div>
        </ChartCard>
      </div>

      {/* Identity flags */}
      <div className="mt-6 card p-6">
        <div className="mb-4 flex items-center justify-between">
          <SectionTitle>Ghost-Beneficiary &amp; Identity-Cluster Detector</SectionTitle>
          <MvpBadge />
        </div>
        <p className="mb-4 text-sm text-muted">
          Replicates patterns flagged in real CAG audits of PM-JAY — many beneficiaries sharing one mobile number,
          claims on patients recorded as deceased, and simultaneous double admissions. (Mock data only.)
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <IntegrityPanel
            icon={PhoneCall}
            title="Shared-phone clusters"
            count={identityQ.data?.shared_phone_clusters.length ?? 0}
          >
            {identityQ.data?.shared_phone_clusters.map((c) => (
              <div key={c.phone} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs">
                <p className="font-bold text-red-700">{c.count} beneficiaries · {c.phone}</p>
                <p className="text-red-600">{c.beneficiaries.join(", ")}</p>
              </div>
            ))}
          </IntegrityPanel>

          <IntegrityPanel
            icon={Skull}
            title="Claims on deceased patients"
            count={identityQ.data?.deceased_patient_claims.length ?? 0}
          >
            {identityQ.data?.deceased_patient_claims.map((c) => (
              <Link key={c.claim_id} to={`/claims/${c.claim_id}`} className="block rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs hover:bg-red-100">
                <p className="font-bold text-red-700">{c.claim_id} · {c.beneficiary_id}</p>
                <p className="text-red-600">Deceased {c.deceased_on} → admitted {c.admission_date}</p>
              </Link>
            ))}
          </IntegrityPanel>

          <IntegrityPanel
            icon={IdCard}
            title="Double admissions"
            count={identityQ.data?.double_admissions.length ?? 0}
          >
            {identityQ.data?.double_admissions.length ? (
              identityQ.data.double_admissions.map((c, i) => (
                <div key={i} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs">
                  <p className="font-bold text-amber-700">{c.beneficiary_id}</p>
                  <p className="text-amber-700">{c.hospital_a} ↔ {c.hospital_b}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted">None detected in current data.</p>
            )}
          </IntegrityPanel>
        </div>
      </div>
    </div>
  );
}

/* ---------- Network graph (deterministic SVG layout) ---------- */
function NetworkGraph({ nodes, edges }: { nodes: NetworkNode[]; edges: { source: string; target: string; type: string }[] }) {
  const pos = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const color = { hospital: "#0f2747", beneficiary: "#0d9488", broker: "#dc2626" } as const;
  return (
    <svg viewBox="0 0 100 100" className="h-[240px] w-full">
      {edges.map((e, i) => {
        const s = pos[e.source];
        const t = pos[e.target];
        if (!s || !t) return null;
        const shared = e.type === "shared_phone";
        const broker = e.type === "broker";
        return (
          <line
            key={i}
            x1={s.x}
            y1={s.y}
            x2={t.x}
            y2={t.y}
            stroke={shared ? "#dc2626" : broker ? "#ea580c" : "#cbd5e1"}
            strokeWidth={shared ? 0.7 : 0.35}
            strokeDasharray={shared ? "1.5 1" : undefined}
            opacity={shared ? 0.9 : 0.6}
          />
        );
      })}
      {nodes.map((n) => (
        <g key={n.id}>
          <circle cx={n.x} cy={n.y} r={n.type === "hospital" ? 2.6 : n.type === "broker" ? 2.4 : 1.8} fill={color[n.type]} />
          <title>{n.label} ({n.type})</title>
        </g>
      ))}
    </svg>
  );
}

function PeerTip({ active, payload }: { active?: boolean; payload?: { payload: import("../types").PeerOutlier }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-card">
      <p className="font-bold text-navy">{p.hospital}</p>
      <p className="text-muted">Avg claim {inr(p.avg_claim_value)} · {p.claims} claims</p>
      <p className="text-muted">peak z {p.peak_z}{p.outlier ? " · outlier" : ""}</p>
    </div>
  );
}

function IntegrityPanel({ icon: Icon, title, count, children }: { icon: typeof PhoneCall; title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line p-4">
      <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-navy">
        <Icon className="h-4 w-4 text-red-500" /> {title}
        <span className="ml-auto chip bg-slate-100 text-slate-600">{count}</span>
      </h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Legend({ color, label, line }: { color: string; label: string; line?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {line ? (
        <span className="h-0.5 w-4" style={{ backgroundColor: color }} />
      ) : (
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      )}
      {label}
    </span>
  );
}

function bandHex(band: string): string {
  return (
    {
      "Close conformity": "#16a34a",
      "Acceptable conformity": "#65a30d",
      "Marginal conformity": "#d97706",
      Nonconformity: "#dc2626",
    }[band] ?? "#64748b"
  );
}
