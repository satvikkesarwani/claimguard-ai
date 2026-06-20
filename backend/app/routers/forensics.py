"""
ClaimGuard AI — Forensic analytics router (MVP Simulation).

  GET /forensics/benford?hospital=     Benford's Law first-digit billing test
  GET /forensics/peer-outliers         provider peer z-score outliers
  GET /forensics/identity-flags        ghost-beneficiary / identity clusters
  GET /forensics/network               collusion network graph
  GET /claims/{claim_id}/explanation   deterministic score-attribution waterfall
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Claim
from ..services.forensics_engine import (
    benford_analysis,
    collusion_network,
    identity_flags,
    peer_outliers,
    score_attribution,
)

router = APIRouter(tags=["forensics"])


def _claims(db: Session):
    return [c.to_dict() for c in db.query(Claim).all()]


@router.get("/forensics/benford")
def forensics_benford(hospital: Optional[str] = Query(None), db: Session = Depends(get_db)):
    return benford_analysis(_claims(db), hospital)


@router.get("/forensics/peer-outliers")
def forensics_peer_outliers(db: Session = Depends(get_db)):
    return peer_outliers(_claims(db))


@router.get("/forensics/identity-flags")
def forensics_identity_flags(db: Session = Depends(get_db)):
    return identity_flags(_claims(db))


@router.get("/forensics/network")
def forensics_network(db: Session = Depends(get_db)):
    return collusion_network(_claims(db))


@router.get("/claims/{claim_id}/explanation")
def claim_explanation(claim_id: str, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail=f"Claim {claim_id} not found")
    return score_attribution(claim.to_dict())
