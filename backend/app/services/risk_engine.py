"""
ClaimGuard AI — Risk scoring engine (MVP Simulation).

This is *explainable demo logic*, NOT certified adjudication. It applies a
deterministic, rule-based weighting over a fixed catalogue of risk signals and
maps the capped 0-100 score onto the four risk bands defined in the source PDF:

    0-25   Low Risk      -> Auto-approve / Fast-track
    26-50  Medium Risk   -> Query Hospital
    51-75  High Risk     -> Medical Auditor Review
    76-100 Critical Risk -> Fraud Investigation Hold

Signals can be set explicitly (hospital "simulate risk signal" toggles) or
derived from the submitted claim data (missing mandatory documents, billing that
exceeds the claimed package rate). Everything is transparent and reproducible.
"""
from __future__ import annotations

from typing import Dict, List, TypedDict

# ---------------------------------------------------------------------------
# Signal catalogue — single source of truth for weights + human-readable copy.
# Weights are taken directly from the project brief / PDF risk framework.
# ---------------------------------------------------------------------------


class RiskFactor(TypedDict):
    key: str
    label: str
    weight: int
    category: str
    description: str
    agent: str


RISK_FACTORS: List[RiskFactor] = [
    {
        "key": "missing_document",
        "label": "Missing mandatory document",
        "weight": 12,
        "category": "Document",
        "description": "One or more mandatory claim documents are absent.",
        "agent": "OCR & Document Agent",
    },
    {
        "key": "package_mismatch",
        "label": "Treatment package mismatch",
        "weight": 18,
        "category": "Billing",
        "description": "Claim filed under a package that does not match the diagnosis/procedure.",
        "agent": "Billing Audit Agent",
    },
    {
        "key": "diagnosis_treatment_mismatch",
        "label": "Diagnosis-treatment mismatch",
        "weight": 16,
        "category": "Medical",
        "description": "Procedure/treatment is not clinically aligned with the stated diagnosis.",
        "agent": "Medical Coding Agent",
    },
    {
        "key": "inflated_billing",
        "label": "Inflated billing",
        "weight": 14,
        "category": "Billing",
        "description": "Claimed amount exceeds the expected package rate benchmark.",
        "agent": "Billing Audit Agent",
    },
    {
        "key": "duplicate_procedure",
        "label": "Duplicate procedure",
        "weight": 18,
        "category": "Fraud",
        "description": "Same procedure appears to be claimed multiple times.",
        "agent": "Fraud Pattern Agent",
    },
    {
        "key": "repeat_admission",
        "label": "Repeat admission pattern",
        "weight": 15,
        "category": "Fraud",
        "description": "Same beneficiary repeatedly admitted for a similar issue.",
        "agent": "Fraud Pattern Agent",
    },
    {
        "key": "reused_image",
        "label": "Reused image signal",
        "weight": 22,
        "category": "Image",
        "description": "Diagnostic image / patient photo matches an image used in other claims.",
        "agent": "Image Integrity Agent",
    },
    {
        "key": "suspicious_document",
        "label": "Suspicious document authenticity",
        "weight": 20,
        "category": "Document",
        "description": "Document shows edits, altered watermark or forgery indicators.",
        "agent": "OCR & Document Agent",
    },
    {
        "key": "identity_issue",
        "label": "Identity / eligibility issue",
        "weight": 25,
        "category": "Identity",
        "description": "Beneficiary identity or scheme eligibility could not be verified.",
        "agent": "Identity & Eligibility Agent",
    },
    {
        "key": "ai_generated_note",
        "label": "AI-generated clinical note suspicion",
        "weight": 15,
        "category": "Document",
        "description": "Clinical narrative shows signals of AI generation / fabrication.",
        "agent": "OCR & Document Agent",
    },
    {
        "key": "high_risk_hospital",
        "label": "High-risk hospital pattern",
        "weight": 10,
        "category": "Fraud",
        "description": "Submitting hospital has an elevated historical anomaly pattern.",
        "agent": "Fraud Pattern Agent",
    },
    {
        "key": "stg_non_compliance",
        "label": "STG non-compliance",
        "weight": 18,
        "category": "Medical",
        "description": "Treatment deviates from Standard Treatment Guidelines.",
        "agent": "STG Compliance Agent",
    },
]

FACTORS_BY_KEY: Dict[str, RiskFactor] = {f["key"]: f for f in RISK_FACTORS}

# Documents considered mandatory for a complete claim file.
MANDATORY_DOCUMENTS = [
    "hospital_bill",
    "discharge_summary",
    "diagnostic_report",
    "patient_identity",
    "admission_proof",
]

# Billing is flagged as inflated when it exceeds the claimed package rate by >15%.
INFLATED_BILLING_THRESHOLD = 1.15


def categorize(score: int) -> Dict[str, str]:
    """Map a 0-100 score to its risk band + recommended action."""
    if score <= 25:
        return {"category": "Low Risk", "action": "Auto-approve / Fast-track", "fraud_risk": "Low"}
    if score <= 50:
        return {"category": "Medium Risk", "action": "Query Hospital", "fraud_risk": "Medium"}
    if score <= 75:
        return {"category": "High Risk", "action": "Medical Auditor Review", "fraud_risk": "High"}
    return {"category": "Critical Risk", "action": "Fraud Investigation Hold", "fraud_risk": "Critical"}


def derive_signals(claim: dict) -> Dict[str, bool]:
    """
    Combine explicit signal toggles with signals derived from claim data.

    Derived rules (deterministic):
      - missing_document  -> any mandatory document checkbox is False/absent
      - inflated_billing  -> claim_amount > claimed_package_rate * 1.15
    Explicit toggles always win when set to True.
    """
    raw = dict(claim.get("signals") or {})
    signals: Dict[str, bool] = {f["key"]: bool(raw.get(f["key"], False)) for f in RISK_FACTORS}

    documents = claim.get("documents") or {}
    if any(not documents.get(doc, False) for doc in MANDATORY_DOCUMENTS):
        signals["missing_document"] = True

    rate = float(claim.get("claimed_package_rate") or 0)
    amount = float(claim.get("claim_amount") or 0)
    if rate > 0 and amount > rate * INFLATED_BILLING_THRESHOLD:
        signals["inflated_billing"] = True

    return signals


def score_claim(claim: dict) -> dict:
    """
    Compute the full risk analysis for a claim.

    Returns a dict with:
      score, category, recommended_action, fraud_risk,
      medical_necessity, document_completeness, stg_compliance,
      active_signals, factors (per-signal contribution breakdown),
      top_factors (5 highest contributors).
    """
    signals = derive_signals(claim)

    factors = []
    total = 0
    for f in RISK_FACTORS:
        active = signals.get(f["key"], False)
        contribution = f["weight"] if active else 0
        total += contribution
        factors.append(
            {
                "key": f["key"],
                "label": f["label"],
                "category": f["category"],
                "weight": f["weight"],
                "active": active,
                "contribution": contribution,
                "description": f["description"],
                "agent": f["agent"],
            }
        )

    score = min(total, 100)
    band = categorize(score)

    # --- Derived qualitative statuses (PDF "Decision Outputs") ---
    if signals.get("identity_issue") or signals.get("suspicious_document") or signals.get("reused_image"):
        document_completeness = "Suspicious"
    elif signals.get("missing_document"):
        document_completeness = "Missing"
    else:
        document_completeness = "Complete"

    if signals.get("diagnosis_treatment_mismatch") or signals.get("package_mismatch"):
        medical_necessity = "Not Supported"
    elif signals.get("stg_non_compliance"):
        medical_necessity = "Weak"
    else:
        medical_necessity = "Supported"

    if signals.get("stg_non_compliance"):
        stg_compliance = "Violates guideline"
    elif signals.get("diagnosis_treatment_mismatch") or signals.get("package_mismatch"):
        stg_compliance = "Partial"
    else:
        stg_compliance = "Follows guideline"

    active_factors = [f for f in factors if f["active"]]
    top_factors = sorted(active_factors, key=lambda x: x["contribution"], reverse=True)[:5]

    return {
        "score": score,
        "raw_total": total,
        "category": band["category"],
        "recommended_action": band["action"],
        "fraud_risk": band["fraud_risk"],
        "medical_necessity": medical_necessity,
        "document_completeness": document_completeness,
        "stg_compliance": stg_compliance,
        "active_signals": [k for k, v in signals.items() if v],
        "signals": signals,
        "factors": factors,
        "top_factors": top_factors,
    }
