// ClaimGuard AI — shared TypeScript types (mirror backend schemas).

export interface DocumentChecklist {
  hospital_bill: boolean;
  discharge_summary: boolean;
  diagnostic_report: boolean;
  patient_identity: boolean;
  admission_proof: boolean;
  patient_photo: boolean;
}

export interface RiskSignals {
  missing_document: boolean;
  package_mismatch: boolean;
  diagnosis_treatment_mismatch: boolean;
  inflated_billing: boolean;
  duplicate_procedure: boolean;
  repeat_admission: boolean;
  reused_image: boolean;
  suspicious_document: boolean;
  identity_issue: boolean;
  ai_generated_note: boolean;
  high_risk_hospital: boolean;
  stg_non_compliance: boolean;
}

export interface Claim {
  id: number;
  claim_id: string;
  beneficiary_id: string;
  hospital_name: string;
  hospital_id: string;
  admission_date: string;
  discharge_date: string;
  diagnosis: string;
  procedure_code: string;
  treatment_package: string;
  claim_amount: number;
  claimed_package_rate: number;
  submission_date: string;
  documents: Partial<DocumentChecklist>;
  signals: Partial<RiskSignals>;
  ocr_text: string;
  risk_score: number;
  risk_category: string;
  recommended_action: string;
  fraud_risk: string;
  medical_necessity: string;
  document_completeness: string;
  stg_compliance: string;
  ai_summary: string;
  status: string;
  created_at: string | null;
}

export interface RiskFactor {
  key: string;
  label: string;
  category: string;
  weight: number;
  active: boolean;
  contribution: number;
  description: string;
  agent: string;
}

export interface AgentResult {
  key: string;
  name: string;
  status: "Passed" | "Warning" | "Failed";
  confidence: number;
  input_checked: string;
  output: string;
  evidence: string[];
  risk_contribution: number;
  explanation: string;
  purpose: string;
}

export interface AnalyzeResponse {
  claim_id: string;
  risk_score: number;
  risk_category: string;
  recommended_action: string;
  fraud_risk: string;
  medical_necessity: string;
  document_completeness: string;
  stg_compliance: string;
  active_signals: string[];
  top_factors: RiskFactor[];
  factors: RiskFactor[];
  agents: AgentResult[];
  ai_summary: string;
}

export interface AuditLog {
  id: number;
  claim_id: string;
  action: string;
  user_role: string;
  previous_status: string;
  new_status: string;
  note: string;
  reason: string;
  evidence_id: string;
  output_hash: string;
  timestamp: string | null;
}

export interface ReportReason {
  reason: string;
  contribution: number;
  detail: string;
}

export interface EvidenceRow {
  signal: string;
  category: string;
  agent: string;
  risk_contribution: number;
  detail: string;
}

export interface Report {
  claim_id: string;
  generated_for: string;
  hospital: string;
  treatment_package: string;
  claim_amount: number;
  summary: string;
  claim_trust_score: number;
  risk_score: number;
  risk_category: string;
  fraud_risk_level: string;
  medical_necessity: string;
  document_completeness: string;
  stg_compliance: string;
  recommended_action: string;
  status: string;
  evidence_table: EvidenceRow[];
  top_risk_reasons: ReportReason[];
  agents: AgentResult[];
  auditor_notes: { action: string; note: string; role: string; timestamp: string }[];
  audit_trail: AuditLog[];
  model_rule_explanation: string;
  output_hash: string;
  human_in_loop_note: string;
  disclaimer: string;
}

export interface AnalyticsOverview {
  total_claims: number;
  high_risk_flagged: number;
  low_risk_claims: number;
  avg_risk_score: number;
  avg_review_time_min: number;
  fast_track_rate: number;
  audit_trail_coverage: number;
  risk_distribution: { name: string; value: number }[];
  status_distribution: { name: string; value: number }[];
  audit_action_distribution: { name: string; value: number }[];
  high_risk_packages: { package: string; avg_risk: number; claims: number }[];
}

export interface PatternCount {
  key: string;
  label: string;
  category: string;
  count: number;
  weight: number;
}

export interface FraudPatterns {
  pattern_counts: PatternCount[];
  critical_queue: Claim[];
  duplicate_procedure_signals: SignalClaim[];
  repeat_admission_signals: SignalClaim[];
  reused_image_signals: SignalClaim[];
  suspicious_document_signals: SignalClaim[];
  identity_signals: SignalClaim[];
}

export interface SignalClaim {
  claim_id: string;
  hospital_name: string;
  beneficiary_id: string;
  risk_score: number;
}

export interface HospitalScorecard {
  hospital_name: string;
  hospital_id: string;
  claims: number;
  avg_risk_score: number;
  flagged_claims: number;
  total_claim_amount: number;
  signal_count: number;
  anomaly_level: string;
}

export interface FeedbackEvent {
  id: number;
  claim_id: string;
  feedback_type: string;
  auditor_decision: string;
  ai_recommendation: string;
  note: string;
  user_role: string;
  timestamp: string | null;
}

export interface BenfordAnalysis {
  hospital: string;
  sample_size: number;
  digits: { digit: number; observed: number; expected: number; count: number }[];
  mad: number;
  conformity_band: string;
  verdict: string;
  thresholds: { close: number; acceptable: number; marginal: number };
  note: string;
}

export interface PeerOutlier {
  hospital: string;
  claims: number;
  avg_claim_value: number;
  z_claim_value: number;
  z_signal_density: number;
  z_risk_score: number;
  peak_z: number;
  outlier: boolean;
}

export interface IdentityFlags {
  shared_phone_clusters: { phone: string; beneficiaries: string[]; count: number }[];
  deceased_patient_claims: {
    claim_id: string;
    beneficiary_id: string;
    deceased_on: string;
    admission_date: string;
    hospital_name: string;
  }[];
  double_admissions: {
    beneficiary_id: string;
    claim_a: string;
    hospital_a: string;
    claim_b: string;
    hospital_b: string;
  }[];
  total_flags: number;
  note: string;
}

export interface NetworkNode {
  id: string;
  label: string;
  type: "hospital" | "beneficiary" | "broker";
  risk: number;
  x: number;
  y: number;
}

export interface NetworkEdge {
  source: string;
  target: string;
  type: string;
  weight: number;
  claim_id?: string;
}

export interface CollusionNetwork {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  rings: { phone: string; members: string[]; ring_strength: number }[];
  note: string;
}

export interface ScoreAttribution {
  claim_id: string;
  base: number;
  final_score: number;
  raw_total: number;
  capped: boolean;
  category: string;
  contributions: { feature: string; agent: string; delta: number }[];
  steps: { label: string; value: number; cumulative: number; kind: string }[];
  note: string;
}

export interface FeedbackResponse {
  summary: {
    confirmed_fraud: number;
    false_positive: number;
    false_negative: number;
    true_positive: number;
    total_events: number;
    by_type: { name: string; value: number }[];
  };
  events: FeedbackEvent[];
  rule_improvement_queue: { rule: string; observation: string; status: string }[];
  model_monitoring_queue: {
    metric: string;
    target: string;
    simulated_value: string;
    status: string;
  }[];
  drift_warning: boolean;
  note: string;
}
