"""
ClaimGuard AI — Multi-agent verification engine (MVP Simulation).

Generates explainable output for each of the 10 specialized agents described in
the source PDF. This is rule-based demo logic that maps the deterministic risk
signals onto per-agent status / confidence / evidence / explanation. It does NOT
call any external LLM or ML model unless one is explicitly configured later.

Each agent owns a set of signals. Status logic:
    - any severe owned signal active (weight >= 18)  -> Failed
    - any owned signal active                        -> Warning
    - otherwise                                      -> Passed
Confidence is a deterministic function of the active signals (no randomness).
"""
from __future__ import annotations

from typing import Dict, List

from .risk_engine import FACTORS_BY_KEY, MANDATORY_DOCUMENTS, score_claim

SEVERE_WEIGHT = 18

# Ordered agent pipeline. `signals` are the risk keys each agent is responsible for.
AGENT_DEFS = [
    {
        "key": "claim_intake",
        "name": "Claim Intake Agent",
        "input": "Core claim fields (IDs, dates, package, amount)",
        "signals": [],
        "purpose": "Receives and validates that mandatory claim fields are present.",
    },
    {
        "key": "ocr_document",
        "name": "OCR & Document Agent",
        "input": "Hospital bill, discharge summary, diagnostic report, identity proof",
        "signals": ["missing_document", "suspicious_document", "ai_generated_note"],
        "purpose": "Extracts document text and checks completeness + authenticity.",
    },
    {
        "key": "fhir_nhcx",
        "name": "FHIR/NHCX Normalization Agent",
        "input": "Raw claim payload",
        "signals": [],
        "purpose": "Normalizes claim data to a FHIR/NHCX-compatible structure.",
    },
    {
        "key": "identity_eligibility",
        "name": "Identity & Eligibility Agent",
        "input": "Beneficiary ID, scheme eligibility, patient photo",
        "signals": ["identity_issue"],
        "purpose": "Verifies beneficiary identity and scheme eligibility.",
    },
    {
        "key": "medical_coding",
        "name": "Medical Coding Agent",
        "input": "Diagnosis, procedure code, treatment package",
        "signals": ["diagnosis_treatment_mismatch"],
        "purpose": "Validates ICD/procedure codes against the stated diagnosis.",
    },
    {
        "key": "stg_compliance",
        "name": "STG Compliance Agent",
        "input": "Diagnosis + treatment vs Standard Treatment Guidelines",
        "signals": ["stg_non_compliance"],
        "purpose": "Checks treatment against Standard Treatment Guidelines.",
    },
    {
        "key": "billing_audit",
        "name": "Billing Audit Agent",
        "input": "Claim amount, claimed package rate, package mapping",
        "signals": ["inflated_billing", "package_mismatch"],
        "purpose": "Audits billing for inflation and package-rate mismatches.",
    },
    {
        "key": "image_integrity",
        "name": "Image Integrity Agent",
        "input": "Diagnostic images and patient photo",
        "signals": ["reused_image"],
        "purpose": "Detects reused or tampered images via similarity signals.",
    },
    {
        "key": "fraud_pattern",
        "name": "Fraud Pattern Agent",
        "input": "Cross-claim history + hospital behaviour",
        "signals": ["duplicate_procedure", "repeat_admission", "high_risk_hospital"],
        "purpose": "Detects duplicate procedures, repeat admissions and hospital anomalies.",
    },
    {
        "key": "explainability",
        "name": "Explainability Agent",
        "input": "Combined agent outputs + risk score",
        "signals": [],
        "purpose": "Synthesizes a human-readable rationale and recommendation.",
    },
]


def _evidence_for(signal_key: str, claim: dict) -> str:
    """Produce a concrete, claim-specific evidence string for an active signal."""
    amount = claim.get("claim_amount") or 0
    rate = claim.get("claimed_package_rate") or 0
    documents = claim.get("documents") or {}
    mapping = {
        "missing_document": "Missing: "
        + ", ".join(d.replace("_", " ") for d in MANDATORY_DOCUMENTS if not documents.get(d, False))
        if any(not documents.get(d, False) for d in MANDATORY_DOCUMENTS)
        else "Mandatory document checklist incomplete",
        "suspicious_document": "Document forensic check flagged altered watermark / edit traces",
        "ai_generated_note": "Clinical note perplexity + phrasing pattern suggests AI generation",
        "identity_issue": f"Beneficiary {claim.get('beneficiary_id', '')} eligibility could not be confirmed",
        "diagnosis_treatment_mismatch": f"Procedure {claim.get('procedure_code', '')} not aligned with diagnosis '{claim.get('diagnosis', '')}'",
        "stg_non_compliance": "Treatment plan deviates from Standard Treatment Guideline benchmark",
        "inflated_billing": f"Billed ₹{amount:,.0f} vs expected package rate ₹{rate:,.0f}"
        + (f" (+{((amount / rate - 1) * 100):.0f}%)" if rate else ""),
        "package_mismatch": f"Package '{claim.get('treatment_package', '')}' inconsistent with diagnosis/procedure",
        "reused_image": "Perceptual hash matches an image already used in another claim",
        "duplicate_procedure": f"Procedure {claim.get('procedure_code', '')} previously claimed for this beneficiary",
        "repeat_admission": f"Beneficiary {claim.get('beneficiary_id', '')} shows repeated admissions for a similar issue",
        "high_risk_hospital": f"Hospital {claim.get('hospital_name', '')} shows an elevated anomaly pattern",
    }
    return mapping.get(signal_key, FACTORS_BY_KEY.get(signal_key, {}).get("description", ""))


def _intake_status(claim: dict) -> bool:
    """Claim Intake passes when the core fields are present."""
    required = ["claim_id", "beneficiary_id", "hospital_name", "diagnosis", "treatment_package"]
    return all(str(claim.get(field, "")).strip() for field in required)


def run_agents(claim: dict) -> List[dict]:
    """Run all agents for a claim and return a list of agent result cards."""
    analysis = score_claim(claim)
    signals = analysis["signals"]
    results: List[dict] = []

    for adef in AGENT_DEFS:
        owned = adef["signals"]
        active = [k for k in owned if signals.get(k)]
        severe = [k for k in active if FACTORS_BY_KEY[k]["weight"] >= SEVERE_WEIGHT]
        risk_contribution = sum(FACTORS_BY_KEY[k]["weight"] for k in active)

        # --- Per-agent special cases ---
        if adef["key"] == "claim_intake":
            ok = _intake_status(claim)
            status = "Passed" if ok else "Failed"
            confidence = 98 if ok else 70
            evidence = (
                ["All mandatory claim fields received and structurally valid"]
                if ok
                else ["One or more core claim fields are missing or malformed"]
            )
            output = "Claim accepted for processing" if ok else "Claim rejected at intake"
            explanation = (
                "All required identifiers, dates and amounts were received."
                if ok
                else "Core claim fields are incomplete; manual correction required."
            )
        elif adef["key"] == "fhir_nhcx":
            ok = bool(str(claim.get("procedure_code", "")).strip())
            status = "Passed" if ok else "Warning"
            confidence = 96 if ok else 82
            evidence = ["Claim mapped to FHIR/NHCX-compatible resource bundle (MVP Simulation)"]
            if not ok:
                evidence.append("Procedure code absent — coding normalization incomplete")
            output = "Normalized to NHCX-compatible schema"
            explanation = (
                "Claim fields were normalized into a standardized exchange structure."
                if ok
                else "Normalization completed with a gap: procedure code missing."
            )
        elif adef["key"] == "explainability":
            status = (
                "Failed"
                if analysis["score"] > 75
                else "Warning"
                if analysis["score"] > 25
                else "Passed"
            )
            confidence = 94
            top = analysis["top_factors"]
            evidence = [f"{t['label']} (+{t['contribution']})" for t in top] or [
                "No risk signals detected"
            ]
            output = f"{analysis['category']} → {analysis['recommended_action']}"
            explanation = (
                f"Combined risk score {analysis['score']}/100 across {len(analysis['active_signals'])} "
                f"active signal(s). Recommendation: {analysis['recommended_action']}."
            )
        else:
            if severe:
                status = "Failed"
            elif active:
                status = "Warning"
            else:
                status = "Passed"
            # Confidence: high when clean; detection confidence stays high when flagged.
            if status == "Passed":
                confidence = 97
            elif status == "Warning":
                confidence = 88
            else:
                confidence = 91
            evidence = [_evidence_for(k, claim) for k in active] or [
                f"{adef['purpose']} — no anomalies detected"
            ]
            if status == "Passed":
                output = "No issues detected"
            else:
                output = "; ".join(FACTORS_BY_KEY[k]["label"] for k in active)
            if active:
                explanation = (
                    f"{adef['name']} flagged {len(active)} signal(s): "
                    + ", ".join(FACTORS_BY_KEY[k]["label"] for k in active)
                    + f". Risk contribution +{risk_contribution}."
                )
            else:
                explanation = f"{adef['purpose']} Completed with no anomalies."

        results.append(
            {
                "key": adef["key"],
                "name": adef["name"],
                "status": status,
                "confidence": confidence,
                "input_checked": adef["input"],
                "output": output,
                "evidence": evidence,
                "risk_contribution": risk_contribution,
                "explanation": explanation,
                "purpose": adef["purpose"],
            }
        )

    return results


def generate_summary(claim: dict) -> str:
    """One-paragraph AI claim summary (deterministic, MVP Simulation)."""
    analysis = score_claim(claim)
    n = len(analysis["active_signals"])
    flags = (
        ", ".join(FACTORS_BY_KEY[k]["label"] for k in analysis["active_signals"])
        if n
        else "no risk signals"
    )
    return (
        f"Claim {claim.get('claim_id', '')} from {claim.get('hospital_name', '')} for beneficiary "
        f"{claim.get('beneficiary_id', '')} covers '{claim.get('diagnosis', '')}' under the "
        f"'{claim.get('treatment_package', '')}' package (₹{claim.get('claim_amount', 0):,.0f}). "
        f"Document completeness is {analysis['document_completeness'].lower()}, medical necessity is "
        f"{analysis['medical_necessity'].lower()}, and STG compliance {analysis['stg_compliance'].lower()}. "
        f"The multi-agent review detected {n} signal(s): {flags}. Combined risk score "
        f"{analysis['score']}/100 ({analysis['category']}) → recommended action: "
        f"{analysis['recommended_action']}."
    )
