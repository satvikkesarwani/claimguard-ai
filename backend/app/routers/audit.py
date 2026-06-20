"""
ClaimGuard AI — Audit log router.

  GET /audit-logs              full audit trail (optionally filtered by claim_id)
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import AuditLog

router = APIRouter(tags=["audit"])


@router.get("/audit-logs")
def list_audit_logs(
    db: Session = Depends(get_db),
    claim_id: Optional[str] = Query(None),
):
    q = db.query(AuditLog)
    if claim_id:
        q = q.filter(AuditLog.claim_id == claim_id)
    logs = q.order_by(AuditLog.timestamp.desc(), AuditLog.id.desc()).all()
    return {"count": len(logs), "logs": [l.to_dict() for l in logs]}
