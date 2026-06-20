"""
ClaimGuard AI — Feedback (learning-loop simulation) router.

  GET  /feedback   feedback events + summary (confirmed fraud / false pos / etc.)
  POST /feedback   record a feedback event

MVP Simulation: this captures auditor feedback and surfaces a simulated
rule-improvement / drift-monitoring queue. It does NOT retrain any model.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Feedback
from ..schemas import FeedbackCreate
from ..services.analytics_engine import feedback_summary

router = APIRouter(tags=["feedback"])

# Static, illustrative simulated queues shown on the Feedback page.
RULE_IMPROVEMENT_QUEUE = [
    {
        "rule": "Inflated billing threshold",
        "observation": "Several genuine implant claims flagged at +15%; consider specialty-specific thresholds.",
        "status": "Proposed",
    },
    {
        "rule": "Repeat admission window",
        "observation": "Dialysis maintenance sessions trigger repeat-admission signal; needs package-aware exception.",
        "status": "Under Review",
    },
    {
        "rule": "AI-note detector sensitivity",
        "observation": "Short discharge notes occasionally over-flagged; tune minimum length.",
        "status": "Proposed",
    },
]

MODEL_MONITORING_QUEUE = [
    {"metric": "Fraud recall (high-risk)", "target": "80%+", "simulated_value": "82%", "status": "On Track"},
    {"metric": "False hold rate (genuine)", "target": "Below 5-8%", "simulated_value": "6%", "status": "On Track"},
    {"metric": "Document extraction accuracy", "target": "90%+", "simulated_value": "91%", "status": "On Track"},
    {"metric": "Score drift (7-day)", "target": "< 5 pts", "simulated_value": "7 pts", "status": "Drift Warning"},
]


@router.get("/feedback")
def list_feedback(db: Session = Depends(get_db)):
    events = [f.to_dict() for f in db.query(Feedback).order_by(Feedback.timestamp.desc()).all()]
    summary = feedback_summary(events)
    return {
        "summary": summary,
        "events": events,
        "rule_improvement_queue": RULE_IMPROVEMENT_QUEUE,
        "model_monitoring_queue": MODEL_MONITORING_QUEUE,
        "drift_warning": any(m["status"] == "Drift Warning" for m in MODEL_MONITORING_QUEUE),
        "note": "MVP Simulation — feedback is captured and surfaced but no model is retrained.",
    }


@router.post("/feedback", status_code=201)
def create_feedback(payload: FeedbackCreate, db: Session = Depends(get_db)):
    fb = Feedback(
        claim_id=payload.claim_id,
        feedback_type=payload.feedback_type,
        auditor_decision=payload.auditor_decision,
        ai_recommendation=payload.ai_recommendation,
        note=payload.note,
        user_role=payload.user_role,
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)
    return fb.to_dict()
