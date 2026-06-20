"""
ClaimGuard AI — FastAPI application entrypoint (MVP Simulation).

A multi-agent AI adjudication & fraud-defence layer for health-insurance claims.
All logic is explainable, rule-based demo logic over anonymized mock data — this
is NOT certified medical adjudication and uses no real PM-JAY/NHCX integration.

Deployment model: a SINGLE service serves both the JSON API (under /api) and the
built React SPA (when a static build is present, e.g. on Railway). In local dev
the Vite server proxies /api -> this backend, so the same paths work everywhere.
"""
from __future__ import annotations

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from .database import Base, SessionLocal, engine
from .models import Claim
from .routers import analytics, audit, claims, demo, feedback, forensics, reports
from .seed_data import seed_database

API_DESCRIPTION = (
    "ClaimGuard AI — AI Health-Insurance Claims Adjudication & Fraud Defence. "
    "MVP Simulation: explainable, rule-based demo logic over anonymized mock data. "
    "No real PM-JAY/NHCX integration, no real patient data, no certified medical decisioning."
)

# Location of the built frontend (set via STATIC_DIR; defaults to ../frontend/dist).
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.environ.get("STATIC_DIR", os.path.join(_BACKEND_DIR, os.pardir, "frontend", "dist"))
INDEX_HTML = os.path.join(STATIC_DIR, "index.html")
SERVE_SPA = os.path.isfile(INDEX_HTML)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist and seed an empty DB on first boot.
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        empty = db.query(Claim).count() == 0
    finally:
        db.close()
    if empty:
        seed_database(reset=True)
    yield


app = FastAPI(
    title="ClaimGuard AI",
    version="1.0.0",
    description=API_DESCRIPTION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # MVP: open CORS (same-origin in prod; Vite dev server in dev)
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# All feature routers live under /api so they never collide with SPA client routes.
API_PREFIX = "/api"
app.include_router(claims.router, prefix=API_PREFIX)
app.include_router(reports.router, prefix=API_PREFIX)
app.include_router(forensics.router, prefix=API_PREFIX)
app.include_router(analytics.router, prefix=API_PREFIX)
app.include_router(audit.router, prefix=API_PREFIX)
app.include_router(feedback.router, prefix=API_PREFIX)
app.include_router(demo.router, prefix=API_PREFIX)


@app.get("/health", tags=["system"])
def health():
    """Health check (also used by the Railway healthcheck)."""
    return {
        "status": "ok",
        "service": "ClaimGuard AI",
        "version": "1.0.0",
        "mode": "MVP Simulation",
        "serving_spa": SERVE_SPA,
    }


@app.get("/api", tags=["system"])
def api_info():
    return {
        "service": "ClaimGuard AI",
        "tagline": "Multi-Agent AI Decision Layer for Faster, Fairer & Fraud-Resistant Health Claims",
        "docs": "/docs",
        "health": "/health",
        "mode": "MVP Simulation",
    }


if SERVE_SPA:
    # --- Production single-service mode: serve the built React app ---
    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa(full_path: str):
        # Serve a real static file if it exists; otherwise the SPA entrypoint
        # (so client-side routes like /claims/CLM-2012-CRIT work on refresh).
        candidate = os.path.normpath(os.path.join(STATIC_DIR, full_path))
        if full_path and candidate.startswith(os.path.abspath(STATIC_DIR)) and os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(INDEX_HTML)

else:
    # --- API-only mode (local backend dev / tests): JSON root ---
    @app.get("/", tags=["system"])
    def root():
        return {
            "service": "ClaimGuard AI",
            "tagline": "Multi-Agent AI Decision Layer for Faster, Fairer & Fraud-Resistant Health Claims",
            "docs": "/docs",
            "health": "/health",
            "api": "/api",
            "mode": "MVP Simulation",
        }
