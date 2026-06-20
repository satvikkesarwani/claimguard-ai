"""
ClaimGuard AI — Reports router.

  GET /claims/{claim_id}/report   explainable decision report JSON
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import AuditLog, Claim
from ..services.report_engine import build_report

router = APIRouter(tags=["reports"])


@router.get("/claims/{claim_id}/report")
def get_report(claim_id: str, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail=f"Claim {claim_id} not found")
    history = (
        db.query(AuditLog)
        .filter(AuditLog.claim_id == claim_id)
        .order_by(AuditLog.timestamp.asc(), AuditLog.id.asc())
        .all()
    )
    return build_report(claim.to_dict(), [h.to_dict() for h in history])
