"""
ClaimGuard AI — Forensic analytics engine (MVP Simulation).

Deterministic, statistics-based fraud-forensics that strengthen the demo. Each
technique below is a *real* fraud-analytics method, applied here to anonymized
mock data only (no ML training, no live PM-JAY/NHCX data):

  * Benford's Law first-digit test on billing amounts (Nigrini MAD thresholds).
  * Provider peer-outlier detection via z-scores across hospital cohorts.
  * Ghost-beneficiary / identity-cluster detection — replicates patterns from
    real CAG findings on PM-JAY (many beneficiaries sharing one phone number,
    claims on deceased patients, simultaneous double admissions).
  * Collusion network graph (provider <-> beneficiary <-> broker links).
  * Deterministic score attribution (an exact, rule-based "waterfall" — every
    point of the 0-100 score is traceable to a named signal; not estimated SHAP).

Sources that ground these techniques are listed in docs/SOURCE_ALIGNMENT.md.
"""
from __future__ import annotations

import math
from collections import defaultdict
from typing import Dict, List, Optional

from .risk_engine import FACTORS_BY_KEY, score_claim

# ---------------------------------------------------------------------------
# Mock identity relationships (anonymized) — deterministically attached to the
# seed beneficiaries to replicate real CAG-flagged fraud patterns.
# ---------------------------------------------------------------------------
SHARED_FRAUD_PHONE = "99999-99999"  # mirrors the real "single mobile number" finding

MOCK_IDENTITY: Dict[str, dict] = {
    # Ghost-identity ring: three beneficiaries share one phone + a broker.
    "BEN-1009": {"phone": SHARED_FRAUD_PHONE, "deceased_on": None, "broker": "AGT-77"},
    "BEN-1012": {"phone": SHARED_FRAUD_PHONE, "deceased_on": None, "broker": "AGT-77"},
    "BEN-1007": {"phone": SHARED_FRAUD_PHONE, "deceased_on": None, "broker": "AGT-77"},
    # Claim filed on a patient recorded as deceased before admission.
    "BEN-1006": {"phone": "80021-44551", "deceased_on": "2026-05-20", "broker": None},
}


def _identity_for(beneficiary_id: str) -> dict:
    if beneficiary_id in MOCK_IDENTITY:
        return MOCK_IDENTITY[beneficiary_id]
    # Deterministic pseudo-unique phone for everyone else (no randomness).
    digits = abs(hash(beneficiary_id)) % 100000
    return {"phone": f"7{digits:05d}".rjust(10, "0")[:5] + "-" + f"{digits:05d}", "deceased_on": None, "broker": None}


# ---------------------------------------------------------------------------
# 1) Benford's Law
# ---------------------------------------------------------------------------
def _benford_expected() -> Dict[int, float]:
    return {d: math.log10(1 + 1 / d) * 100 for d in range(1, 10)}


def _build_billing_ledger(claims: List[dict]) -> List[float]:
    """
    Expand each claim into deterministic line items (procedure, consumables,
    room, diagnostics, implants) to form a realistic billing ledger for the
    first-digit test. All factors are fixed — fully reproducible.
    """
    factors = [1.0, 0.42, 0.18, 0.27, 0.63, 0.09, 0.51, 0.34]
    ledger: List[float] = []
    for c in claims:
        amount = float(c.get("claim_amount") or 0)
        rate = float(c.get("claimed_package_rate") or 0)
        for f in factors:
            v = round(amount * f, 0)
            if v >= 1:
                ledger.append(v)
        if rate >= 1:
            ledger.append(round(rate * 0.73, 0))
    return ledger


def benford_analysis(claims: List[dict], hospital: Optional[str] = None) -> dict:
    subset = [c for c in claims if not hospital or c.get("hospital_name") == hospital]
    ledger = _build_billing_ledger(subset)

    counts = defaultdict(int)
    for v in ledger:
        first = int(str(int(abs(v)))[0]) if v >= 1 else 0
        if 1 <= first <= 9:
            counts[first] += 1
    total = sum(counts.values()) or 1

    expected = _benford_expected()
    rows = []
    abs_diffs = []
    for d in range(1, 10):
        observed_pct = counts[d] / total * 100
        abs_diffs.append(abs(observed_pct - expected[d]) / 100)
        rows.append(
            {
                "digit": d,
                "observed": round(observed_pct, 2),
                "expected": round(expected[d], 2),
                "count": counts[d],
            }
        )

    mad = sum(abs_diffs) / 9  # Mean Absolute Deviation (proportion)
    # Nigrini conformity bands.
    if mad < 0.006:
        band, verdict = "Close conformity", "Billing amounts conform to Benford — no fabrication signal."
    elif mad < 0.012:
        band, verdict = "Acceptable conformity", "Acceptable conformity — low fabrication risk."
    elif mad < 0.015:
        band, verdict = "Marginal conformity", "Marginal conformity — review recommended."
    else:
        band, verdict = "Nonconformity", "Nonconformity — possible fabricated / manipulated amounts."

    return {
        "hospital": hospital or "All hospitals",
        "sample_size": total,
        "digits": rows,
        "mad": round(mad, 4),
        "conformity_band": band,
        "verdict": verdict,
        "thresholds": {"close": 0.006, "acceptable": 0.012, "marginal": 0.015},
        "note": "MVP Simulation — first-digit test on a deterministic mock billing ledger. "
        "Production would run across full provider history with chi-square + z-tests.",
    }


# ---------------------------------------------------------------------------
# 2) Provider peer-outlier z-scores
# ---------------------------------------------------------------------------
def _zscores(values: List[float]) -> List[float]:
    n = len(values)
    if n == 0:
        return []
    mean = sum(values) / n
    var = sum((v - mean) ** 2 for v in values) / n
    std = math.sqrt(var)
    if std == 0:
        return [0.0] * n
    return [(v - mean) / std for v in values]


def peer_outliers(claims: List[dict]) -> dict:
    by_hospital: Dict[str, List[dict]] = defaultdict(list)
    for c in claims:
        by_hospital[c.get("hospital_name", "Unknown")].append(c)

    names = list(by_hospital.keys())
    avg_value = [sum(c["claim_amount"] for c in by_hospital[h]) / len(by_hospital[h]) for h in names]
    avg_signals = [
        sum(len(score_claim(c)["active_signals"]) for c in by_hospital[h]) / len(by_hospital[h]) for h in names
    ]
    avg_score = [sum(c["risk_score"] for c in by_hospital[h]) / len(by_hospital[h]) for h in names]

    z_value = _zscores(avg_value)
    z_signals = _zscores(avg_signals)
    z_score = _zscores(avg_score)

    providers = []
    for i, h in enumerate(names):
        peak = max(abs(z_value[i]), abs(z_signals[i]), abs(z_score[i]))
        providers.append(
            {
                "hospital": h,
                "claims": len(by_hospital[h]),
                "avg_claim_value": round(avg_value[i], 0),
                "z_claim_value": round(z_value[i], 2),
                "z_signal_density": round(z_signals[i], 2),
                "z_risk_score": round(z_score[i], 2),
                "peak_z": round(peak, 2),
                "outlier": peak >= 1.5,
            }
        )
    providers.sort(key=lambda x: x["peak_z"], reverse=True)
    return {
        "providers": providers,
        "outlier_threshold": 1.5,
        "note": "MVP Simulation — z-scores over mock provider cohorts. "
        "Production would risk-adjust by case-mix and specialty.",
    }


# ---------------------------------------------------------------------------
# 3) Ghost-beneficiary / identity-cluster detector
# ---------------------------------------------------------------------------
def identity_flags(claims: List[dict]) -> dict:
    by_phone: Dict[str, set] = defaultdict(set)
    deceased_claims = []
    admissions: Dict[str, List[dict]] = defaultdict(list)

    for c in claims:
        ben = c.get("beneficiary_id", "")
        ident = _identity_for(ben)
        by_phone[ident["phone"]].add(ben)
        admissions[ben].append(c)
        if ident["deceased_on"] and c.get("admission_date", "") > ident["deceased_on"]:
            deceased_claims.append(
                {
                    "claim_id": c["claim_id"],
                    "beneficiary_id": ben,
                    "deceased_on": ident["deceased_on"],
                    "admission_date": c.get("admission_date"),
                    "hospital_name": c.get("hospital_name"),
                }
            )

    shared_phone_clusters = [
        {"phone": phone, "beneficiaries": sorted(bens), "count": len(bens)}
        for phone, bens in by_phone.items()
        if len(bens) > 1
    ]
    shared_phone_clusters.sort(key=lambda x: x["count"], reverse=True)

    # Simultaneous double admissions (same beneficiary, overlapping dates, diff hospital).
    double_admissions = []
    for ben, rows in admissions.items():
        for i in range(len(rows)):
            for j in range(i + 1, len(rows)):
                a, b = rows[i], rows[j]
                if a.get("hospital_name") != b.get("hospital_name") and _overlap(a, b):
                    double_admissions.append(
                        {
                            "beneficiary_id": ben,
                            "claim_a": a["claim_id"],
                            "hospital_a": a.get("hospital_name"),
                            "claim_b": b["claim_id"],
                            "hospital_b": b.get("hospital_name"),
                        }
                    )

    return {
        "shared_phone_clusters": shared_phone_clusters,
        "deceased_patient_claims": deceased_claims,
        "double_admissions": double_admissions,
        "total_flags": len(shared_phone_clusters) + len(deceased_claims) + len(double_admissions),
        "note": "MVP Simulation — replicates patterns from real CAG findings on PM-JAY "
        "(beneficiaries sharing a single mobile number, claims on deceased patients) using mock data only.",
    }


def _overlap(a: dict, b: dict) -> bool:
    try:
        return a.get("admission_date", "") <= b.get("discharge_date", "") and b.get("admission_date", "") <= a.get(
            "discharge_date", ""
        )
    except Exception:
        return False


# ---------------------------------------------------------------------------
# 4) Collusion network graph
# ---------------------------------------------------------------------------
def collusion_network(claims: List[dict]) -> dict:
    nodes: Dict[str, dict] = {}
    edges: List[dict] = []

    def add_node(node_id: str, label: str, ntype: str, risk: float = 0.0):
        if node_id not in nodes:
            nodes[node_id] = {"id": node_id, "label": label, "type": ntype, "risk": risk}

    for c in claims:
        hosp = c.get("hospital_id") or c.get("hospital_name")
        ben = c.get("beneficiary_id", "")
        add_node(hosp, c.get("hospital_name", hosp), "hospital", c.get("risk_score", 0))
        add_node(ben, ben, "beneficiary", c.get("risk_score", 0))
        edges.append({"source": hosp, "target": ben, "type": "claim", "weight": 1, "claim_id": c["claim_id"]})
        ident = _identity_for(ben)
        if ident.get("broker"):
            add_node(ident["broker"], ident["broker"], "broker", 80)
            edges.append({"source": ident["broker"], "target": ben, "type": "broker", "weight": 2})

    # Shared-phone edges between beneficiaries (collusion candidate links).
    by_phone: Dict[str, List[str]] = defaultdict(list)
    for c in claims:
        ben = c.get("beneficiary_id", "")
        by_phone[_identity_for(ben)["phone"]].append(ben)
    rings = []
    for phone, bens in by_phone.items():
        uniq = sorted(set(bens))
        if len(uniq) > 1:
            for i in range(len(uniq)):
                for j in range(i + 1, len(uniq)):
                    edges.append({"source": uniq[i], "target": uniq[j], "type": "shared_phone", "weight": 3})
            ring_score = round(len(uniq) * (len(uniq) - 1) / 2 * 10, 0)
            rings.append({"phone": phone, "members": uniq, "ring_strength": ring_score})

    # Deterministic circular layout positions so the frontend can draw SVG.
    node_list = list(nodes.values())
    n = len(node_list) or 1
    for idx, node in enumerate(node_list):
        angle = 2 * math.pi * idx / n
        node["x"] = round(50 + 40 * math.cos(angle), 2)
        node["y"] = round(50 + 40 * math.sin(angle), 2)

    rings.sort(key=lambda r: r["ring_strength"], reverse=True)
    return {
        "nodes": node_list,
        "edges": edges,
        "rings": rings,
        "note": "MVP Simulation — deterministic ring scoring over mock shared-phone/broker links. "
        "Production would use community detection (e.g. Louvain) and graph ML.",
    }


# ---------------------------------------------------------------------------
# 5) Deterministic score attribution (exact rule-based "waterfall")
# ---------------------------------------------------------------------------
def score_attribution(claim: dict) -> dict:
    analysis = score_claim(claim)
    contributions = [
        {
            "feature": FACTORS_BY_KEY[k]["label"],
            "agent": FACTORS_BY_KEY[k]["agent"],
            "delta": FACTORS_BY_KEY[k]["weight"],
        }
        for k in analysis["active_signals"]
    ]
    contributions.sort(key=lambda x: x["delta"], reverse=True)

    # Build cumulative waterfall steps from a clean baseline of 0.
    steps = [{"label": "Clean baseline", "value": 0, "cumulative": 0, "kind": "base"}]
    cum = 0
    for c in contributions:
        cum = min(cum + c["delta"], 100)
        steps.append({"label": c["feature"], "value": c["delta"], "cumulative": cum, "kind": "add"})
    steps.append({"label": "Final risk score", "value": analysis["score"], "cumulative": analysis["score"], "kind": "total"})

    return {
        "claim_id": claim.get("claim_id"),
        "base": 0,
        "final_score": analysis["score"],
        "raw_total": analysis["raw_total"],
        "capped": analysis["raw_total"] > 100,
        "category": analysis["category"],
        "contributions": contributions,
        "steps": steps,
        "note": "Deterministic attribution — every point of the score is traceable to a named rule "
        "(exact, not estimated SHAP).",
    }
