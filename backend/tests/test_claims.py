def test_list_claims_seeded(client):
    r = client.get("/api/claims")
    assert r.status_code == 200
    body = r.json()
    assert body["count"] >= 12
    assert len(body["claims"]) == body["count"]


def test_get_single_claim(client):
    r = client.get("/api/claims/CLM-2001-GEN")
    assert r.status_code == 200
    assert r.json()["risk_category"] == "Low Risk"


def test_get_missing_claim_404(client):
    assert client.get("/api/claims/NOPE").status_code == 404


def test_filter_by_risk_category(client):
    r = client.get("/api/claims", params={"risk_category": "Critical Risk"})
    assert r.status_code == 200
    for c in r.json()["claims"]:
        assert c["risk_category"] == "Critical Risk"


def test_search_filter(client):
    r = client.get("/api/claims", params={"search": "dialysis"})
    assert r.status_code == 200
    assert r.json()["count"] >= 1


def test_create_and_analyze_claim(client):
    payload = {
        "beneficiary_id": "BEN-7777",
        "hospital_name": "New Test Hospital",
        "hospital_id": "HOSP-777",
        "diagnosis": "Test Diagnosis",
        "procedure_code": "PROC-X",
        "treatment_package": "Test Package",
        "claim_amount": 50000,
        "claimed_package_rate": 30000,  # +66% -> inflated billing derived
        "documents": {
            "hospital_bill": True,
            "discharge_summary": True,
            "diagnostic_report": True,
            "patient_identity": True,
            "admission_proof": True,
            "patient_photo": True,
        },
        "signals": {"identity_issue": True},
    }
    r = client.post("/api/claims", json=payload)
    assert r.status_code == 201
    created = r.json()
    cid = created["claim_id"]
    # identity_issue (25) + inflated_billing derived (14) = 39 -> Medium
    assert created["risk_score"] == 39
    assert created["risk_category"] == "Medium Risk"

    a = client.post(f"/api/claims/{cid}/analyze")
    assert a.status_code == 200
    assert a.json()["risk_score"] == 39
    assert len(a.json()["agents"]) == 10


def test_agents_endpoint(client):
    r = client.get("/api/claims/CLM-2012-CRIT/agents")
    assert r.status_code == 200
    assert len(r.json()["agents"]) == 10
    assert r.json()["risk_score"] == 100


def test_decision_updates_status_and_audit(client):
    r = client.post(
        "/api/claims/CLM-2003-CARD/decision",
        json={"action": "Query Hospital", "note": "Need clarification on package.", "user_role": "Claim Adjudicator"},
    )
    assert r.status_code == 200
    assert r.json()["claim"]["status"] == "Queried"

    logs = client.get("/api/audit-logs", params={"claim_id": "CLM-2003-CARD"}).json()
    assert any(l["action"] == "Query Hospital" for l in logs["logs"])


def test_invalid_decision_action(client):
    r = client.post("/api/claims/CLM-2001-GEN/decision", json={"action": "Explode"})
    assert r.status_code == 400
