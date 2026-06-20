// ClaimGuard AI — API client (axios). All calls hit the FastAPI backend via the
// Vite /api proxy (configurable through VITE_API_BASE).
import axios from "axios";
import type {
  AnalyticsOverview,
  AnalyzeResponse,
  AuditLog,
  BenfordAnalysis,
  Claim,
  CollusionNetwork,
  FeedbackResponse,
  FraudPatterns,
  HospitalScorecard,
  IdentityFlags,
  PeerOutlier,
  Report,
  ScoreAttribution,
} from "../types";

const baseURL = import.meta.env.VITE_API_BASE || "/api";

export const api = axios.create({ baseURL, timeout: 15000 });

export interface ClaimFilters {
  risk_category?: string;
  status?: string;
  hospital?: string;
  package?: string;
  search?: string;
}

export async function getClaims(filters: ClaimFilters = {}): Promise<{ count: number; claims: Claim[] }> {
  const { data } = await api.get("/claims", { params: filters });
  return data;
}

export async function getClaim(claimId: string): Promise<Claim> {
  const { data } = await api.get(`/claims/${claimId}`);
  return data;
}

export interface CreateClaimPayload {
  claim_id?: string;
  beneficiary_id: string;
  hospital_name: string;
  hospital_id?: string;
  admission_date?: string;
  discharge_date?: string;
  diagnosis: string;
  procedure_code?: string;
  treatment_package: string;
  claim_amount: number;
  claimed_package_rate: number;
  submission_date?: string;
  documents: Record<string, boolean>;
  signals: Record<string, boolean>;
  ocr_text?: string;
}

export async function createClaim(payload: CreateClaimPayload): Promise<Claim> {
  const { data } = await api.post("/claims", payload);
  return data;
}

export async function analyzeClaim(claimId: string): Promise<AnalyzeResponse> {
  const { data } = await api.post(`/claims/${claimId}/analyze`);
  return data;
}

export async function getAgents(
  claimId: string
): Promise<{ claim_id: string; agents: AnalyzeResponse["agents"]; risk_score: number; risk_category: string; recommended_action: string }> {
  const { data } = await api.get(`/claims/${claimId}/agents`);
  return data;
}

export async function getReport(claimId: string): Promise<Report> {
  const { data } = await api.get(`/claims/${claimId}/report`);
  return data;
}

export interface DecisionPayload {
  action: string;
  note?: string;
  user_role?: string;
  feedback_type?: string | null;
}

export async function postDecision(
  claimId: string,
  payload: DecisionPayload
): Promise<{ claim: Claim; audit_log: AuditLog }> {
  const { data } = await api.post(`/claims/${claimId}/decision`, payload);
  return data;
}

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const { data } = await api.get("/analytics/overview");
  return data;
}

export async function getFraudPatterns(): Promise<FraudPatterns> {
  const { data } = await api.get("/analytics/fraud-patterns");
  return data;
}

export async function getHospitals(): Promise<{ hospitals: HospitalScorecard[] }> {
  const { data } = await api.get("/analytics/hospitals");
  return data;
}

export async function getAuditLogs(claimId?: string): Promise<{ count: number; logs: AuditLog[] }> {
  const { data } = await api.get("/audit-logs", { params: claimId ? { claim_id: claimId } : {} });
  return data;
}

export async function getFeedback(): Promise<FeedbackResponse> {
  const { data } = await api.get("/feedback");
  return data;
}

export async function resetDemo(): Promise<{ status: string; claims: number }> {
  const { data } = await api.post("/demo/reset");
  return data;
}

/* ---------- Forensic analytics ---------- */
export async function getBenford(hospital?: string): Promise<BenfordAnalysis> {
  const { data } = await api.get("/forensics/benford", { params: hospital ? { hospital } : {} });
  return data;
}

export async function getPeerOutliers(): Promise<{ providers: PeerOutlier[]; outlier_threshold: number; note: string }> {
  const { data } = await api.get("/forensics/peer-outliers");
  return data;
}

export async function getIdentityFlags(): Promise<IdentityFlags> {
  const { data } = await api.get("/forensics/identity-flags");
  return data;
}

export async function getNetwork(): Promise<CollusionNetwork> {
  const { data } = await api.get("/forensics/network");
  return data;
}

export async function getExplanation(claimId: string): Promise<ScoreAttribution> {
  const { data } = await api.get(`/claims/${claimId}/explanation`);
  return data;
}
