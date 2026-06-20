// ClaimGuard AI — formatting + risk-band helpers.

export function inr(amount: number): string {
  return "₹" + (amount || 0).toLocaleString("en-IN");
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function dateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type RiskBand = "Low Risk" | "Medium Risk" | "High Risk" | "Critical Risk";

export const RISK_COLORS: Record<string, { text: string; bg: string; bar: string; hex: string }> = {
  "Low Risk": { text: "text-risk-low", bg: "bg-green-50", bar: "bg-risk-low", hex: "#16a34a" },
  "Medium Risk": { text: "text-risk-medium", bg: "bg-amber-50", bar: "bg-risk-medium", hex: "#d97706" },
  "High Risk": { text: "text-risk-high", bg: "bg-orange-50", bar: "bg-risk-high", hex: "#ea580c" },
  "Critical Risk": { text: "text-risk-critical", bg: "bg-red-50", bar: "bg-risk-critical", hex: "#dc2626" },
};

export function riskHex(category: string): string {
  return RISK_COLORS[category]?.hex ?? "#64748b";
}

export const STATUS_COLORS: Record<string, string> = {
  Approved: "bg-green-50 text-green-700",
  "Pending Review": "bg-slate-100 text-slate-600",
  Queried: "bg-amber-50 text-amber-700",
  "In Medical Audit": "bg-blue-50 text-blue-700",
  "Fraud Hold": "bg-red-50 text-red-700",
  Rejected: "bg-slate-200 text-slate-700",
  Submitted: "bg-teal-50 text-teal-700",
};

export const CHART_COLORS = ["#0d9488", "#2563eb", "#7c3aed", "#d97706", "#dc2626", "#0891b2", "#16a34a"];
