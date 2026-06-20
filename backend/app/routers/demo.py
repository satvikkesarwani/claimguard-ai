"""
ClaimGuard AI — Demo control router.

  GET  /demo/seed    (re)seed the database with the 12 scenario claims
  POST /demo/reset   reset the database back to seed state
"""
from __future__ import annotations

from fastapi import APIRouter

from ..seed_data import seed_database

router = APIRouter(prefix="/demo", tags=["demo"])


@router.get("/seed")
def demo_seed():
    count = seed_database(reset=True)
    return {"status": "seeded", "claims": count, "note": "MVP Simulation demo data loaded."}


@router.post("/reset")
def demo_reset():
    count = seed_database(reset=True)
    return {"status": "reset", "claims": count, "note": "Database reset to seed state."}
