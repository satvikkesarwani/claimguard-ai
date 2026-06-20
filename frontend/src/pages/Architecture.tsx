// ClaimGuard AI — Architecture page (route: /architecture). Three-layer design from PDF.
import { ArrowDown, ShieldCheck } from "lucide-react";
import { PageIntro } from "../components/ui";

const LAYER1 = [
  { name: "Hospital Portal", desc: "Claim uploads" },
  { name: "Insurer System", desc: "Policy & claims data" },
  { name: "PM-JAY System", desc: "Govt health scheme" },
  { name: "TPA", desc: "Third-party admin" },
  { name: "NHCX Gateway", desc: "Standardized exchange" },
];

const LAYER2 = [
  { name: "API Gateway", desc: "Entry point" },
  { name: "Claim Processing", desc: "Ingestion & workflow" },
  { name: "Document Intelligence", desc: "OCR & extraction" },
  { name: "Multi-Agent Orchestrator", desc: "Routes 10 agents", highlight: true },
  { name: "Rules Engine", desc: "Weighted risk scoring" },
  { name: "Vector Knowledge Base", desc: "Policy / STG rules" },
];

const LAYER3 = [
  { name: "Auditor Dashboard", desc: "Claim review & decisions" },
  { name: "Hospital Dashboard", desc: "Submission & tracking" },
  { name: "Fraud Investigation", desc: "Deep-dive analytics" },
  { name: "Policy Analytics", desc: "Scorecards & insights" },
];

const SECURITY = [
  "Role-Based Access Control (RBAC)",
  "OAuth2 Authentication (placeholder)",
  "AES-256 Encryption (roadmap)",
  "Immutable Audit Trails",
  "Model Output Logging",
  "Human Override Capability",
  "Bias & False-Positive Monitoring",
  "Privacy & Consent-Aware Data Usage",
];

export default function Architecture() {
  return (
    <div>
      <PageIntro
        title="System Architecture"
        subtitle="Three-layer architecture with a vertical security shield — as specified in the source PDF."
        demo="The proposed system design: an Integration Layer (hospital/insurer/PM-JAY/TPA/NHCX), an AI Decision Layer (orchestrator + rules + ML services → risk score + recommendation), a User Layer (the dashboards), and a cross-cutting Security Layer. Components shown as roadmap are clearly labelled."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="space-y-5 lg:col-span-3">
          {/* Layer 1 */}
          <LayerBlock title="Layer 1 · Integration Layer" color="#2563eb">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {LAYER1.map((n) => (
                <Node key={n.name} {...n} />
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Roadmap — these external integrations are not live in this MVP (no real PM-JAY/NHCX connection).
            </p>
          </LayerBlock>

          <Arrow />

          {/* Layer 2 */}
          <LayerBlock title="Layer 2 · AI Decision Layer" color="#0d9488">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {LAYER2.map((n) => (
                <Node key={n.name} {...n} />
              ))}
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-3">
                <p className="text-sm font-bold text-purple-800">ML Model Services</p>
                <p className="text-xs text-purple-700">LLM · Fraud ML · Medical NLP · Image Forensics (roadmap)</p>
              </div>
              <div className="rounded-xl border border-teal-300 bg-teal-50 px-4 py-3">
                <p className="text-sm font-bold text-teal-800">Output</p>
                <p className="text-xs text-teal-700">Risk Score + Explainable Recommendation</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              In this MVP the Rules Engine + Multi-Agent Orchestrator are implemented with deterministic logic; ML
              services are placeholders.
            </p>
          </LayerBlock>

          <Arrow />

          {/* Layer 3 */}
          <LayerBlock title="Layer 3 · User Layer" color="#7c3aed">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {LAYER3.map((n) => (
                <Node key={n.name} {...n} />
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Data Stores: Claim DB (SQLite in MVP; PostgreSQL in production) · Document Store · Audit Log Service
            </p>
          </LayerBlock>
        </div>

        {/* Security shield */}
        <div className="card border-amber-200 p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-700">
            <ShieldCheck className="h-4 w-4" /> Security Layer
          </h3>
          <ul className="space-y-2 text-sm">
            {SECURITY.map((s) => (
              <li key={s} className="flex items-start gap-2 text-ink">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                {s}
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            Several controls (OAuth2, AES-256) are roadmap items. The MVP implements RBAC-style roles, model-output
            logging and a full audit trail.
          </p>
        </div>
      </div>
    </div>
  );
}

function LayerBlock({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="mb-4 rounded-lg px-4 py-2 text-sm font-bold text-white" style={{ backgroundColor: color }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Node({ name, desc, highlight }: { name: string; desc: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border px-3.5 py-3 ${highlight ? "border-teal-400 bg-teal-50" : "border-line bg-white"}`}>
      <p className="text-sm font-semibold text-navy">{name}</p>
      <p className="text-xs text-muted">{desc}</p>
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex justify-center">
      <ArrowDown className="h-6 w-6 text-slate-300" />
    </div>
  );
}
