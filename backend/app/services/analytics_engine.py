"""
ClaimGuard AI — Analytics engine (MVP Simulation).

Aggregates claims, audit logs and feedback into the figures shown on the
Analytics, Fraud Workspace and Feedback pages. All computation is deterministic
over the local SQLite data.
"""
from __future__ import annotations

from collections import Counter, defaultdict
from typing import List

from .risk_engine import FACTORS_BY_KEY, RISK_FACTORS, score_claim

RISK_ORDER = ["Low Risk", "Medium Risk", "High Risk", "Critical Risk"]


def overview(claims: List[dict], audit_logs: List[dict]) -> dict:
    total = len(claims)
    risk_dist = Counter(c["risk_category"] for c in claims)
    status_dist = Counter(c["status"] for c in claims)

    high_critical = sum(1 for c in claims if c["risk_category"] in ("High Risk", "Critical Risk"))
    low = sum(1 for c in claims if c["risk_category"] == "Low Risk")
    avg_score = round(sum(c["risk_score"] for c in claims) / total, 1) if total else 0

    # Fast-track rate = share of low-risk (auto-approve) claims.
    fast_track_rate = round((low / total) * 100, 1) if total else 0

    # Simulated average review time (deterministic, scales with risk band).
    band_minutes = {"Low Risk": 4, "Medium Risk": 9, "High Risk": 18, "Critical Risk": 26}
    avg_review_time = (
        round(sum(band_minutes[c["risk_category"]] for c in claims) / total, 1) if total else 0
    )

    action_dist = Counter(a["action"] for a in audit_logs)

    # High-risk packages: average score per treatment package.
    pkg_scores = defaultdict(list)
    for c in claims:
        pkg_scores[c["treatment_package"]].append(c["risk_score"])
    high_risk_packages = sorted(
        (
            {
                "package": pkg,
                "avg_risk": round(sum(scores) / len(scores), 1),
                "claims": len(scores),
            }
            for pkg, scores in pkg_scores.items()
        ),
        key=lambda x: x["avg_risk"],
        reverse=True,
    )[:6]

    return {
        "total_claims": total,
        "high_risk_flagged": high_critical,
        "low_risk_claims": low,
        "avg_risk_score": avg_score,
        "avg_review_time_min": avg_review_time,
        "fast_track_rate": fast_track_rate,
        "audit_trail_coverage": 100,  # every claim carries an audit trail in this MVP
        "risk_distribution": [
            {"name": cat, "value": risk_dist.get(cat, 0)} for cat in RISK_ORDER
        ],
        "status_distribution": [
            {"name": k, "value": v} for k, v in sorted(status_dist.items())
        ],
        "audit_action_distribution": [
            {"name": k, "value": v} for k, v in sorted(action_dist.items())
        ],
        "high_risk_packages": high_risk_packages,
    }


def fraud_patterns(claims: List[dict]) -> dict:
    """Counts of each fraud/risk signal across all claims + critical queue."""
    counts = Counter()
    for c in claims:
        analysis = score_claim(c)
        for key in analysis["active_signals"]:
            counts[key] += 1

    pattern_counts = [
        {
            "key": f["key"],
            "label": f["label"],
            "category": f["category"],
            "count": counts.get(f["key"], 0),
            "weight": f["weight"],
        }
        for f in RISK_FACTORS
    ]
    pattern_counts.sort(key=lambda x: x["count"], reverse=True)

    critical_queue = sorted(
        (
            c
            for c in claims
            if c["risk_category"] in ("High Risk", "Critical Risk")
        ),
        key=lambda x: x["risk_score"],
        reverse=True,
    )

    # Specific signal queues for the fraud workspace.
    def claims_with(signal: str):
        return [
            {
                "claim_id": c["claim_id"],
                "hospital_name": c["hospital_name"],
                "beneficiary_id": c["beneficiary_id"],
                "risk_score": c["risk_score"],
            }
            for c in claims
            if signal in score_claim(c)["active_signals"]
        ]

    return {
        "pattern_counts": pattern_counts,
        "critical_queue": critical_queue,
        "duplicate_procedure_signals": claims_with("duplicate_procedure"),
        "repeat_admission_signals": claims_with("repeat_admission"),
        "reused_image_signals": claims_with("reused_image"),
        "suspicious_document_signals": claims_with("suspicious_document"),
        "identity_signals": claims_with("identity_issue"),
    }


def hospital_scorecards(claims: List[dict]) -> List[dict]:
    """Per-hospital anomaly scorecards (leaderboard ordered by avg risk)."""
    by_hospital = defaultdict(list)
    for c in claims:
        by_hospital[(c["hospital_name"], c.get("hospital_id", ""))].append(c)

    cards = []
    for (name, hid), hclaims in by_hospital.items():
        scores = [c["risk_score"] for c in hclaims]
        flagged = sum(1 for c in hclaims if c["risk_category"] in ("High Risk", "Critical Risk"))
        total_amount = sum(c["claim_amount"] for c in hclaims)
        signal_total = sum(len(score_claim(c)["active_signals"]) for c in hclaims)
        avg = round(sum(scores) / len(scores), 1)
        cards.append(
            {
                "hospital_name": name,
                "hospital_id": hid,
                "claims": len(hclaims),
                "avg_risk_score": avg,
                "flagged_claims": flagged,
                "total_claim_amount": total_amount,
                "signal_count": signal_total,
                "anomaly_level": (
                    "Critical" if avg > 70 else "High" if avg > 50 else "Medium" if avg > 25 else "Low"
                ),
            }
        )
    cards.sort(key=lambda x: x["avg_risk_score"], reverse=True)
    return cards


def feedback_summary(feedback: List[dict]) -> dict:
    counts = Counter(f["feedback_type"] for f in feedback)
    return {
        "confirmed_fraud": counts.get("confirmed_fraud", 0),
        "false_positive": counts.get("false_positive", 0),
        "false_negative": counts.get("false_negative", 0),
        "true_positive": counts.get("true_positive", 0),
        "total_events": len(feedback),
        "by_type": [{"name": k, "value": v} for k, v in counts.items()],
    }
