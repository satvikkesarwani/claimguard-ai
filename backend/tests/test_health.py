def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["mode"] == "MVP Simulation"


def test_root(client):
    r = client.get("/")
    assert r.status_code == 200
    assert "ClaimGuard AI" in r.json()["service"]
