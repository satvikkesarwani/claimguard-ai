"""
ClaimGuard AI — Analytics router.

  GET /analytics/overview         KPIs, distributions, package risk
  GET /analytics/fraud-patterns   signal counts + fraud-workspace queues
  GET /analytics/hospitals        hospital anomaly scorecards
"""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import AuditLog, Claim
from ..services.analytics_engine import fraud_patterns, hospital_scorecards, overview

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/overview")
def analytics_overview(db: Session = Depends(get_db)):
    claims = [c.to_dict() for c in db.query(Claim).all()]
    logs = [a.to_dict() for a in db.query(AuditLog).all()]
    return overview(claims, logs)


@router.get("/fraud-patterns")
def analytics_fraud_patterns(db: Session = Depends(get_db)):
    claims = [c.to_dict() for c in db.query(Claim).all()]
    return fraud_patterns(claims)


@router.get("/hospitals")
def analytics_hospitals(db: Session = Depends(get_db)):
    claims = [c.to_dict() for c in db.query(Claim).all()]
    return {"hospitals": hospital_scorecards(claims)}
