def test_report_structure(client):
    r = client.get("/api/claims/CLM-2012-CRIT/report")
    assert r.status_code == 200
    report = r.json()
    assert report["claim_id"] == "CLM-2012-CRIT"
    assert report["risk_score"] == 100
    assert report["claim_trust_score"] == 0
    assert report["fraud_risk_level"] == "Critical"
    assert len(report["agents"]) == 10
    assert len(report["top_risk_reasons"]) >= 1
    assert "MVP Simulation" in report["disclaimer"]
    assert report["output_hash"].startswith("sha256:")


def test_report_clean_claim_high_trust(client):
    report = client.get("/api/claims/CLM-2001-GEN/report").json()
    assert report["claim_trust_score"] == 100
    assert report["risk_category"] == "Low Risk"


def test_analytics_overview(client):
    r = client.get("/api/analytics/overview")
    assert r.status_code == 200
    body = r.json()
    assert body["total_claims"] >= 12
    assert body["audit_trail_coverage"] == 100
    assert len(body["risk_distribution"]) == 4
    assert any(d["value"] > 0 for d in body["risk_distribution"])


def test_fraud_patterns(client):
    r = client.get("/api/analytics/fraud-patterns")
    assert r.status_code == 200
    body = r.json()
    assert len(body["pattern_counts"]) == 12
    assert len(body["critical_queue"]) >= 1


def test_hospital_scorecards(client):
    r = client.get("/api/analytics/hospitals")
    assert r.status_code == 200
    hospitals = r.json()["hospitals"]
    assert len(hospitals) >= 1
    assert all("avg_risk_score" in h for h in hospitals)


def test_feedback_endpoint(client):
    r = client.get("/api/feedback")
    assert r.status_code == 200
    body = r.json()
    assert "summary" in body
    assert len(body["model_monitoring_queue"]) == 4
    assert body["drift_warning"] is True


def test_post_feedback(client):
    r = client.post(
        "/api/feedback",
        json={
            "claim_id": "CLM-2005-OPHTH",
            "feedback_type": "false_positive",
            "auditor_decision": "Approve",
            "ai_recommendation": "Medical Auditor Review",
            "note": "Genuine on review.",
        },
    )
    assert r.status_code == 201
    assert r.json()["feedback_type"] == "false_positive"


def test_demo_reset(client):
    r = client.post("/api/demo/reset")
    assert r.status_code == 200
    assert r.json()["claims"] == 12
