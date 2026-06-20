// ClaimGuard AI — Claim Intake / Hospital Submission (route: /claims/new).
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileCheck2, Send, RotateCcw, AlertTriangle } from "lucide-react";
import { createClaim } from "../api/client";
import { PageIntro, SectionTitle } from "../components/ui";
import { MANDATORY_DOCS, SIGNAL_CATALOGUE } from "../data/catalogue";

const PACKAGES = [
  "General Medicine",
  "Dialysis",
  "Cataract Surgery",
  "Cardiac Care — Angioplasty",
  "Cardiac Care — Stent",
  "Orthopaedics — Fracture Fixation",
  "Maternity Care",
  "General Surgery — Appendectomy",
  "Neurology — Evaluation",
];

const emptyDocs = Object.fromEntries(MANDATORY_DOCS.map((d) => [d.key, true])) as Record<string, boolean>;
const emptySignals = Object.fromEntries(SIGNAL_CATALOGUE.map((s) => [s.key, false])) as Record<string, boolean>;

export default function ClaimIntake() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    claim_id: "",
    beneficiary_id: "BEN-2050",
    hospital_name: "Sunrise Care Hospital",
    hospital_id: "HOSP-201",
    admission_date: "2026-06-15",
    discharge_date: "2026-06-18",
    diagnosis: "Acute Bronchitis",
    procedure_code: "PROC-GEN-118",
    treatment_package: "General Medicine",
    claim_amount: 24000,
    claimed_package_rate: 24000,
    ocr_text: "",
  });
  const [docs, setDocs] = useState<Record<string, boolean>>({ ...emptyDocs });
  const [signals, setSignals] = useState<Record<string, boolean>>({ ...emptySignals });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live estimated score preview (mirrors backend weights + derived rules).
  const preview = useMemo(() => {
    const active = { ...signals };
    if (MANDATORY_DOCS.some((d) => d.mandatory && !docs[d.key])) active.missing_document = true;
    if (form.claimed_package_rate > 0 && form.claim_amount > form.claimed_package_rate * 1.15)
      active.inflated_billing = true;
    const total = SIGNAL_CATALOGUE.reduce((sum, s) => sum + (active[s.key] ? s.weight : 0), 0);
    const score = Math.min(total, 100);
    const category =
      score <= 25 ? "Low Risk" : score <= 50 ? "Medium Risk" : score <= 75 ? "High Risk" : "Critical Risk";
    return { score, category };
  }, [signals, docs, form.claim_amount, form.claimed_package_rate]);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const created = await createClaim({
        ...form,
        claim_id: form.claim_id || undefined,
        claim_amount: Number(form.claim_amount),
        claimed_package_rate: Number(form.claimed_package_rate),
        documents: docs,
        signals,
      });
      navigate(`/claims/${created.claim_id}`);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          "Submission failed — is the backend running?"
      );
      setSubmitting(false);
    }
  }

  function reset() {
    setDocs({ ...emptyDocs });
    setSignals({ ...emptySignals });
    setError(null);
  }

  return (
    <div>
      <PageIntro
        title="Submit New Claim"
        subtitle="Hospital portal — submit claim details + documents for AI adjudication."
        demo="The hospital-side submission form. Fill claim details, tick the document checklist, and optionally toggle simulated risk signals to see how each affects the live risk score before submitting to the backend."
      />

      <form onSubmit={submit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Claim details */}
          <div className="card p-6">
            <SectionTitle>Claim details</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Claim ID (optional — auto-generated)">
                <input className="input" value={form.claim_id} onChange={(e) => set("claim_id", e.target.value)} placeholder="CLM-XXXX-NEW" />
              </Field>
              <Field label="Beneficiary ID">
                <input className="input" value={form.beneficiary_id} onChange={(e) => set("beneficiary_id", e.target.value)} required />
              </Field>
              <Field label="Hospital name">
                <input className="input" value={form.hospital_name} onChange={(e) => set("hospital_name", e.target.value)} required />
              </Field>
              <Field label="Hospital ID">
                <input className="input" value={form.hospital_id} onChange={(e) => set("hospital_id", e.target.value)} />
              </Field>
              <Field label="Admission date">
                <input type="date" className="input" value={form.admission_date} onChange={(e) => set("admission_date", e.target.value)} />
              </Field>
              <Field label="Discharge date">
                <input type="date" className="input" value={form.discharge_date} onChange={(e) => set("discharge_date", e.target.value)} />
              </Field>
              <Field label="Diagnosis">
                <input className="input" value={form.diagnosis} onChange={(e) => set("diagnosis", e.target.value)} required />
              </Field>
              <Field label="Procedure code">
                <input className="input" value={form.procedure_code} onChange={(e) => set("procedure_code", e.target.value)} />
              </Field>
              <Field label="Treatment package">
                <select className="input" value={form.treatment_package} onChange={(e) => set("treatment_package", e.target.value)}>
                  {PACKAGES.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Claim amount (₹)">
                  <input type="number" className="input" value={form.claim_amount} onChange={(e) => set("claim_amount", Number(e.target.value))} />
                </Field>
                <Field label="Package rate (₹)">
                  <input type="number" className="input" value={form.claimed_package_rate} onChange={(e) => set("claimed_package_rate", Number(e.target.value))} />
                </Field>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="card p-6">
            <SectionTitle>Document checklist</SectionTitle>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {MANDATORY_DOCS.map((d) => (
                <label
                  key={d.key}
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-line px-3.5 py-2.5 hover:bg-canvas"
                >
                  <span className="flex items-center gap-2 text-sm text-ink">
                    <FileCheck2 className={`h-4 w-4 ${docs[d.key] ? "text-teal-600" : "text-slate-300"}`} />
                    {d.label}
                    {d.mandatory && <span className="text-[10px] font-semibold text-red-500">required</span>}
                  </span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-teal-600"
                    checked={docs[d.key]}
                    onChange={(e) => setDocs((s) => ({ ...s, [d.key]: e.target.checked }))}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* OCR text */}
          <div className="card p-6">
            <SectionTitle>Document text (simulated OCR input)</SectionTitle>
            <textarea
              className="input min-h-[90px]"
              placeholder="Paste discharge summary / bill text — used for the OCR & Document agent (MVP Simulation)."
              value={form.ocr_text}
              onChange={(e) => set("ocr_text", e.target.value)}
            />
          </div>
        </div>

        {/* Right rail: signals + preview + submit */}
        <div className="space-y-6">
          <div className="card sticky top-20 p-6">
            <div className="mb-3 flex items-center justify-between">
              <SectionTitle>Estimated risk (live)</SectionTitle>
            </div>
            <div className="rounded-xl bg-canvas p-4 text-center">
              <p className="text-4xl font-extrabold text-navy">{preview.score}</p>
              <p className="mt-1 text-sm font-semibold text-muted">{preview.category}</p>
            </div>
            <p className="mt-3 text-[11px] text-muted">
              Preview uses the same weights as the backend engine. Final score is recomputed server-side on submit.
            </p>
          </div>

          <div className="card p-6">
            <SectionTitle>Simulate risk signals</SectionTitle>
            <div className="space-y-2">
              {SIGNAL_CATALOGUE.map((s) => (
                <label key={s.key} className="flex cursor-pointer items-start justify-between gap-3 rounded-lg px-1 py-1.5 hover:bg-canvas">
                  <span className="text-sm text-ink">
                    {s.label}
                    <span className="ml-1.5 text-[10px] font-semibold text-slate-400">+{s.weight}</span>
                  </span>
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 shrink-0 accent-teal-600"
                    checked={signals[s.key]}
                    onChange={(e) => setSignals((p) => ({ ...p, [s.key]: e.target.checked }))}
                  />
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              <Send className="h-4 w-4" /> {submitting ? "Submitting…" : "Submit Claim"}
            </button>
            <button type="button" onClick={reset} className="btn-ghost">
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
