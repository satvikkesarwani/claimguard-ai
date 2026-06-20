"""
ClaimGuard AI — Claims router.

Endpoints:
  GET    /claims                       list + filter claims
  GET    /claims/{claim_id}            single claim
  POST   /claims                       create + analyze a claim
  POST   /claims/{claim_id}/analyze    re-run analysis
  GET    /claims/{claim_id}/agents     multi-agent results
  POST   /claims/{claim_id}/decision   record auditor decision
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import AuditLog, Claim, Feedback
from ..schemas import AnalyzeResponse, ClaimCreate, DecisionRequest
from ..services.agent_engine import generate_summary, run_agents
from ..services.risk_engine import score_claim

router = APIRouter(tags=["claims"])

# Map auditor action -> resulting claim status.
ACTION_TO_STATUS = {
    "Approve": "Approved",
    "Query Hospital": "Queried",
    "Send to Medical Audit": "In Medical Audit",
    "Fraud Hold": "Fraud Hold",
    "Reject": "Rejected",
}


def apply_analysis(claim: Claim) -> None:
    """Recompute the risk analysis from the claim's current data and persist it."""
    payload = claim.to_dict()
    analysis = score_claim(payload)
    claim.risk_score = analysis["score"]
    claim.risk_category = analysis["category"]
    claim.recommended_action = analysis["recommended_action"]
    claim.fraud_risk = analysis["fraud_risk"]
    claim.medical_necessity = analysis["medical_necessity"]
    claim.document_completeness = analysis["document_completeness"]
    claim.stg_compliance = analysis["stg_compliance"]
    claim.signals = analysis["signals"]
    claim.ai_summary = generate_summary(payload)


def _next_claim_id(db: Session) -> str:
    count = db.query(Claim).count()
    return f"CLM-{3000 + count + 1}-NEW"


@router.get("/claims")
def list_claims(
    db: Session = Depends(get_db),
    risk_category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    hospital: Optional[str] = Query(None),
    package: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
):
    q = db.query(Claim)
    if risk_category:
        q = q.filter(Claim.risk_category == risk_category)
    if status:
        q = q.filter(Claim.status == status)
    if hospital:
        q = q.filter(Claim.hospital_name == hospital)
    if package:
        q = q.filter(Claim.treatment_package == package)
    claims = q.order_by(Claim.created_at.desc(), Claim.id.desc()).all()

    rows = [c.to_dict() for c in claims]
    if search:
        s = search.lower()
        rows = [
            r
            for r in rows
            if s in r["claim_id"].lower()
            or s in r["beneficiary_id"].lower()
            or s in r["hospital_name"].lower()
            or s in r["diagnosis"].lower()
            or s in r["treatment_package"].lower()
        ]
    return {"count": len(rows), "claims": rows}


@router.get("/claims/{claim_id}")
def get_claim(claim_id: str, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail=f"Claim {claim_id} not found")
    return claim.to_dict()


@router.post("/claims", status_code=201)
def create_claim(payload: ClaimCreate, db: Session = Depends(get_db)):
    claim_id = payload.claim_id or _next_claim_id(db)
    if db.query(Claim).filter(Claim.claim_id == claim_id).first():
        raise HTTPException(status_code=409, detail=f"Claim {claim_id} already exists")

    claim = Claim(
        claim_id=claim_id,
        beneficiary_id=payload.beneficiary_id,
        hospital_name=payload.hospital_name,
        hospital_id=payload.hospital_id or "",
        admission_date=payload.admission_date or "",
        discharge_date=payload.discharge_date or "",
        diagnosis=payload.diagnosis,
        procedure_code=payload.procedure_code or "",
        treatment_package=payload.treatment_package,
        claim_amount=payload.claim_amount,
        claimed_package_rate=payload.claimed_package_rate,
        submission_date=payload.submission_date or "",
        documents=payload.documents.model_dump(),
        signals=payload.signals.model_dump(),
        ocr_text=payload.ocr_text or "",
        status="Pending Review",
    )
    apply_analysis(claim)
    db.add(claim)

    db.add(
        AuditLog(
            claim_id=claim_id,
            action="Submitted",
            user_role="Hospital Portal",
            previous_status="",
            new_status="Pending Review",
            note="Claim submitted via hospital portal and analyzed by ClaimGuard AI.",
            reason=f"{claim.risk_category} (score {claim.risk_score}/100)",
            evidence_id=f"EVD-{claim_id}",
            output_hash=f"sha256:{claim_id.lower()}",
        )
    )
    db.commit()
    db.refresh(claim)
    return claim.to_dict()


@router.post("/claims/{claim_id}/analyze", response_model=AnalyzeResponse)
def analyze_claim(claim_id: str, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail=f"Claim {claim_id} not found")

    apply_analysis(claim)
    db.commit()
    db.refresh(claim)

    payload = claim.to_dict()
    analysis = score_claim(payload)
    return AnalyzeResponse(
        claim_id=claim.claim_id,
        risk_score=analysis["score"],
        risk_category=analysis["category"],
        recommended_action=analysis["recommended_action"],
        fraud_risk=analysis["fraud_risk"],
        medical_necessity=analysis["medical_necessity"],
        document_completeness=analysis["document_completeness"],
        stg_compliance=analysis["stg_compliance"],
        active_signals=analysis["active_signals"],
        top_factors=analysis["top_factors"],
        factors=analysis["factors"],
        agents=run_agents(payload),
        ai_summary=claim.ai_summary,
    )


@router.get("/claims/{claim_id}/agents")
def get_agents(claim_id: str, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail=f"Claim {claim_id} not found")
    payload = claim.to_dict()
    analysis = score_claim(payload)
    return {
        "claim_id": claim_id,
        "agents": run_agents(payload),
        "risk_score": analysis["score"],
        "risk_category": analysis["category"],
        "recommended_action": analysis["recommended_action"],
    }


@router.post("/claims/{claim_id}/decision")
def record_decision(claim_id: str, body: DecisionRequest, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter(Claim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail=f"Claim {claim_id} not found")
    if body.action not in ACTION_TO_STATUS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown action '{body.action}'. Allowed: {list(ACTION_TO_STATUS)}",
        )

    previous_status = claim.status
    new_status = ACTION_TO_STATUS[body.action]
    claim.status = new_status

    audit = AuditLog(
        claim_id=claim_id,
        action=body.action,
        user_role=body.user_role,
        previous_status=previous_status,
        new_status=new_status,
        note=body.note,
        reason=f"{claim.risk_category} (score {claim.risk_score}/100)",
        evidence_id=f"EVD-{claim_id}",
        output_hash=f"sha256:{claim_id.lower()}-{claim.risk_score}",
    )
    db.add(audit)

    # Record a feedback event for the learning-loop simulation.
    fb_type = body.feedback_type
    if not fb_type:
        if body.action in ("Fraud Hold", "Reject"):
            fb_type = "confirmed_fraud"
        elif body.action == "Approve":
            fb_type = "true_positive"
    if fb_type:
        db.add(
            Feedback(
                claim_id=claim_id,
                feedback_type=fb_type,
                auditor_decision=body.action,
                ai_recommendation=claim.recommended_action,
                note=body.note,
                user_role=body.user_role,
            )
        )

    db.commit()
    db.refresh(claim)
    return {"claim": claim.to_dict(), "audit_log": audit.to_dict()}
