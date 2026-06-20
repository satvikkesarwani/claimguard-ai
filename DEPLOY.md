# Deploying ClaimGuard AI to Railway

ClaimGuard AI deploys as a **single Railway service**: one Dockerfile builds the React app and
serves it together with the FastAPI API from one process. One URL, no CORS, no env wiring.

## How it works
- The API is served under **`/api/*`** (e.g. `/api/claims`, `/api/analytics/overview`).
- The built React SPA is served at **`/`**, with client-side routes (`/claims/...`, `/forensics`, …)
  falling back to `index.html`.
- `/health` is the healthcheck endpoint (returns `200`).
- The frontend calls the API at the same origin (`/api`), so nothing needs to be configured.

## Deploy in one go

### Option A — Railway dashboard (recommended)
1. Push this repo to GitHub.
2. In Railway: **New Project → Deploy from GitHub repo** and pick this repo.
3. Railway detects `railway.json` + the root `Dockerfile` and builds automatically.
4. When the build finishes, open **Settings → Networking → Generate Domain**.
5. Visit the domain — the app is live. (The database auto-seeds 12 demo claims on first boot.)

No environment variables are required. `PORT` is provided by Railway automatically.

### Option B — Railway CLI
```bash
npm i -g @railway/cli
railway login
railway init          # create/link a project
railway up            # build & deploy using the root Dockerfile
railway domain        # generate a public URL
```

## Configuration (all optional)
| Variable | Default | Purpose |
|---|---|---|
| `PORT` | provided by Railway | Port uvicorn binds to |
| `CLAIMGUARD_DB` | `/app/data/claimguard.db` | SQLite file path |
| `STATIC_DIR` | `/app/static` | Built SPA directory (set in the image) |

## Data persistence (optional)
SQLite lives at `/app/data/claimguard.db`. Without a volume it is **ephemeral** — the app simply
re-seeds the 12 demo claims on each cold start, which is fine for a demo. To persist data, add a
Railway **Volume** mounted at `/app/data`.

## Verify locally with Docker (same as Railway)
```bash
docker compose up --build      # → http://localhost:8000
```

## Verify locally without Docker
```bash
# build the frontend, then serve it via the backend
cd frontend && npm install && npm run build && cd ../backend
python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
STATIC_DIR="$(cd ../frontend/dist && pwd)" uvicorn app.main:app --port 8000
# open http://localhost:8000
```

## Local development (hot reload)
Run the two dev servers separately; Vite proxies `/api` → the backend:
```bash
# terminal 1
cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000
# terminal 2
cd frontend && npm run dev        # → http://localhost:5173
```

## Troubleshooting
- **Build fails on `npm ci`** — the Dockerfile falls back to `npm install`; ensure `frontend/package-lock.json` is committed.
- **Healthcheck failing** — confirm the service is binding `0.0.0.0:$PORT` (it is, via the Dockerfile `CMD`).
- **Blank page / 404 on refresh** — already handled: unknown non-`/api` routes return `index.html`.
- **API 404s from the UI** — the UI calls `/api/...`; make sure you didn't set `VITE_API_BASE` to a stripped path.
