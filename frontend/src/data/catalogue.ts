// ClaimGuard AI — static catalogues mirrored from the backend risk engine.
// Kept in sync with backend/app/services/risk_engine.py (weights are identical).

export interface SignalDef {
  key: string;
  label: string;
  weight: number;
  category: string;
  description: string;
}

export const SIGNAL_CATALOGUE: SignalDef[] = [
  { key: "missing_document", label: "Missing mandatory document", weight: 12, category: "Document", description: "One or more mandatory claim documents are absent." },
  { key: "package_mismatch", label: "Treatment package mismatch", weight: 18, category: "Billing", description: "Claim filed under a package that does not match the diagnosis/procedure." },
  { key: "diagnosis_treatment_mismatch", label: "Diagnosis-treatment mismatch", weight: 16, category: "Medical", description: "Procedure is not clinically aligned with the stated diagnosis." },
  { key: "inflated_billing", label: "Inflated billing", weight: 14, category: "Billing", description: "Claimed amount exceeds the expected package rate benchmark." },
  { key: "duplicate_procedure", label: "Duplicate procedure", weight: 18, category: "Fraud", description: "Same procedure appears to be claimed multiple times." },
  { key: "repeat_admission", label: "Repeat admission pattern", weight: 15, category: "Fraud", description: "Same beneficiary repeatedly admitted for a similar issue." },
  { key: "reused_image", label: "Reused image signal", weight: 22, category: "Image", description: "Diagnostic image / patient photo matches an image used in other claims." },
  { key: "suspicious_document", label: "Suspicious document authenticity", weight: 20, category: "Document", description: "Document shows edits, altered watermark or forgery indicators." },
  { key: "identity_issue", label: "Identity / eligibility issue", weight: 25, category: "Identity", description: "Beneficiary identity or scheme eligibility could not be verified." },
  { key: "ai_generated_note", label: "AI-generated clinical note suspicion", weight: 15, category: "Document", description: "Clinical narrative shows signals of AI generation / fabrication." },
  { key: "high_risk_hospital", label: "High-risk hospital pattern", weight: 10, category: "Fraud", description: "Submitting hospital has an elevated historical anomaly pattern." },
  { key: "stg_non_compliance", label: "STG non-compliance", weight: 18, category: "Medical", description: "Treatment deviates from Standard Treatment Guidelines." },
];

export const MANDATORY_DOCS = [
  { key: "hospital_bill", label: "Hospital bill", mandatory: true },
  { key: "discharge_summary", label: "Discharge summary", mandatory: true },
  { key: "diagnostic_report", label: "Diagnostic report", mandatory: true },
  { key: "patient_identity", label: "Patient identity proof", mandatory: true },
  { key: "admission_proof", label: "Admission proof", mandatory: true },
  { key: "patient_photo", label: "Patient photo / image", mandatory: false },
];

export const AGENT_DESCRIPTIONS = [
  { key: "claim_intake", name: "Claim Intake Agent", desc: "Receives & validates fields" },
  { key: "ocr_document", name: "OCR & Document Agent", desc: "Extracts text from documents" },
  { key: "fhir_nhcx", name: "FHIR/NHCX Normalization Agent", desc: "Standardizes claim data" },
  { key: "identity_eligibility", name: "Identity & Eligibility Agent", desc: "Checks patient identity" },
  { key: "medical_coding", name: "Medical Coding Agent", desc: "Validates ICD/procedure codes" },
  { key: "stg_compliance", name: "STG Compliance Agent", desc: "Checks treatment guidelines" },
  { key: "billing_audit", name: "Billing Audit Agent", desc: "Checks inflated charges" },
  { key: "image_integrity", name: "Image Integrity Agent", desc: "Detects reused photos" },
  { key: "fraud_pattern", name: "Fraud Pattern Agent", desc: "ML anomaly detection" },
  { key: "explainability", name: "Explainability Agent", desc: "Human-readable reasoning" },
];

export const DECISION_ACTIONS = [
  { action: "Approve", tone: "bg-green-600 hover:bg-green-700", feedback: "true_positive" },
  { action: "Query Hospital", tone: "bg-amber-500 hover:bg-amber-600", feedback: "" },
  { action: "Send to Medical Audit", tone: "bg-blue-600 hover:bg-blue-700", feedback: "" },
  { action: "Fraud Hold", tone: "bg-red-600 hover:bg-red-700", feedback: "confirmed_fraud" },
  { action: "Reject", tone: "bg-slate-500 hover:bg-slate-600", feedback: "confirmed_fraud" },
];
