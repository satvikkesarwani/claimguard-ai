def test_benford(client):
    r = client.get("/api/forensics/benford")
    assert r.status_code == 200
    body = r.json()
    assert len(body["digits"]) == 9
    assert body["sample_size"] > 0
    assert body["conformity_band"] in (
        "Close conformity",
        "Acceptable conformity",
        "Marginal conformity",
        "Nonconformity",
    )
    # First-digit expected proportions follow Benford (digit 1 ~30.1%).
    d1 = next(d for d in body["digits"] if d["digit"] == 1)
    assert 29 <= d1["expected"] <= 31


def test_benford_by_hospital(client):
    r = client.get("/api/forensics/benford", params={"hospital": "Metro Multispeciality"})
    assert r.status_code == 200
    assert r.json()["hospital"] == "Metro Multispeciality"


def test_peer_outliers(client):
    r = client.get("/api/forensics/peer-outliers")
    assert r.status_code == 200
    providers = r.json()["providers"]
    assert len(providers) >= 1
    assert all("peak_z" in p for p in providers)


def test_identity_flags(client):
    r = client.get("/api/forensics/identity-flags")
    assert r.status_code == 200
    body = r.json()
    # Seed data shares one fraud phone across 3 beneficiaries.
    assert any(c["count"] >= 3 for c in body["shared_phone_clusters"])
    assert body["total_flags"] >= 1


def test_network(client):
    r = client.get("/api/forensics/network")
    assert r.status_code == 200
    body = r.json()
    assert len(body["nodes"]) > 0
    assert len(body["edges"]) > 0
    assert all("x" in n and "y" in n for n in body["nodes"])
    assert len(body["rings"]) >= 1  # shared-phone ring present


def test_score_attribution(client):
    r = client.get("/api/claims/CLM-2012-CRIT/explanation")
    assert r.status_code == 200
    body = r.json()
    assert body["final_score"] == 100
    assert body["capped"] is True
    assert len(body["contributions"]) >= 5
    # Steps go base -> adds -> total.
    assert body["steps"][0]["kind"] == "base"
    assert body["steps"][-1]["kind"] == "total"


def test_attribution_clean_claim(client):
    r = client.get("/api/claims/CLM-2001-GEN/explanation")
    assert r.status_code == 200
    assert r.json()["final_score"] == 0
    assert r.json()["contributions"] == []
