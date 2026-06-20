# ClaimGuard AI — Backend (FastAPI)

MVP Simulation API for AI health-insurance claims adjudication & fraud defence.
Explainable, rule-based demo logic over anonymized mock data (SQLite).

## Run

```bash
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- Auto-seeds 12 scenario claims on first boot.
- Swagger UI: <http://localhost:8000/docs> · ReDoc: `/redoc`.
- DB file: `backend/claimguard.db` (override with `CLAIMGUARD_DB` env var).

## Test

```bash
pytest -q          # 35 tests: health, claims, risk_engine, reports, forensics
```

## Layout

```
app/
  main.py            FastAPI app, CORS, lifespan auto-seed, /health
  database.py        SQLite engine + session
  models.py          Claim / AuditLog / Feedback ORM
  schemas.py         Pydantic request/response models
  seed_data.py       12 anonymized scenario claims (+ audit/feedback seeds)
  services/
    risk_engine.py       12-signal weighted scoring, bands, derived statuses
    agent_engine.py      10-agent verification + AI summary
    report_engine.py     explainable report JSON
    analytics_engine.py  distributions, hospital scorecards, feedback summary
    forensics_engine.py  Benford, peer z-scores, identity clusters, network, attribution
  routers/
    claims.py  reports.py  forensics.py  analytics.py  audit.py  feedback.py  demo.py
tests/             pytest suite + conftest (isolated temp DB)
```

## Endpoints

See [../docs/API_DOCUMENTATION.md](../docs/API_DOCUMENTATION.md) for the full reference.
Quick list: `GET /health` · `GET|POST /claims` · `GET /claims/{id}` ·
`POST /claims/{id}/analyze` · `GET /claims/{id}/agents` · `GET /claims/{id}/report` ·
`GET /claims/{id}/explanation` · `POST /claims/{id}/decision` ·
`GET /forensics/{benford|peer-outliers|identity-flags|network}` ·
`GET /analytics/{overview|fraud-patterns|hospitals}` · `GET /audit-logs` ·
`GET|POST /feedback` · `GET /demo/seed` · `POST /demo/reset`.

## Notes

- CORS is open (`*`) for the local Vite dev server.
- All risk/agent/forensic logic is deterministic and rule-based — **not** ML, **not**
  certified adjudication. See [../docs/LIMITATIONS.md](../docs/LIMITATIONS.md).
