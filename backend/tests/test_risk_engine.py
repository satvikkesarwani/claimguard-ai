from app.services.agent_engine import run_agents
from app.services.risk_engine import RISK_FACTORS, categorize, derive_signals, score_claim


def _claim(signals=None, documents=None, amount=10000, rate=10000):
    full_docs = {
        "hospital_bill": True,
        "discharge_summary": True,
        "diagnostic_report": True,
        "patient_identity": True,
        "admission_proof": True,
        "patient_photo": True,
    }
    return {
        "claim_id": "CLM-TEST",
        "beneficiary_id": "BEN-9999",
        "hospital_name": "Test Hospital",
        "diagnosis": "Test Dx",
        "procedure_code": "PROC-TEST",
        "treatment_package": "Test Package",
        "claim_amount": amount,
        "claimed_package_rate": rate,
        "documents": documents if documents is not None else full_docs,
        "signals": {f["key"]: (signals or {}).get(f["key"], False) for f in RISK_FACTORS},
    }


def test_clean_claim_is_low_risk():
    a = score_claim(_claim())
    assert a["score"] == 0
    assert a["category"] == "Low Risk"
    assert a["recommended_action"] == "Auto-approve / Fast-track"


def test_band_boundaries():
    assert categorize(0)["category"] == "Low Risk"
    assert categorize(25)["category"] == "Low Risk"
    assert categorize(26)["category"] == "Medium Risk"
    assert categorize(50)["category"] == "Medium Risk"
    assert categorize(51)["category"] == "High Risk"
    assert categorize(75)["category"] == "High Risk"
    assert categorize(76)["category"] == "Critical Risk"
    assert categorize(100)["category"] == "Critical Risk"


def test_score_is_capped_at_100():
    all_on = {f["key"]: True for f in RISK_FACTORS}
    a = score_claim(_claim(signals=all_on))
    assert a["raw_total"] > 100
    assert a["score"] == 100
    assert a["category"] == "Critical Risk"


def test_identity_issue_weight():
    a = score_claim(_claim(signals={"identity_issue": True}))
    assert a["score"] == 25
    assert "identity_issue" in a["active_signals"]


def test_missing_document_is_derived_from_checklist():
    docs = {
        "hospital_bill": True,
        "discharge_summary": False,  # missing mandatory doc
        "diagnostic_report": True,
        "patient_identity": True,
        "admission_proof": True,
        "patient_photo": True,
    }
    signals = derive_signals(_claim(documents=docs))
    assert signals["missing_document"] is True


def test_inflated_billing_is_derived_from_amount():
    signals = derive_signals(_claim(amount=15000, rate=10000))  # +50%
    assert signals["inflated_billing"] is True


def test_top_factors_sorted_desc():
    a = score_claim(_claim(signals={"identity_issue": True, "high_risk_hospital": True}))
    contribs = [f["contribution"] for f in a["top_factors"]]
    assert contribs == sorted(contribs, reverse=True)
    assert a["top_factors"][0]["key"] == "identity_issue"


def test_derived_statuses():
    a = score_claim(_claim(signals={"identity_issue": True}))
    assert a["document_completeness"] == "Suspicious"
    b = score_claim(_claim(signals={"diagnosis_treatment_mismatch": True}))
    assert b["medical_necessity"] == "Not Supported"
    c = score_claim(_claim(signals={"stg_non_compliance": True}))
    assert c["stg_compliance"] == "Violates guideline"


def test_run_agents_returns_ten_agents():
    agents = run_agents(_claim(signals={"reused_image": True}))
    assert len(agents) == 10
    by_name = {a["name"]: a for a in agents}
    assert by_name["Image Integrity Agent"]["status"] == "Failed"  # reused_image weight 22 >= 18
    assert by_name["Claim Intake Agent"]["status"] == "Passed"
    for a in agents:
        assert 0 <= a["confidence"] <= 100
        assert isinstance(a["evidence"], list) and a["evidence"]
