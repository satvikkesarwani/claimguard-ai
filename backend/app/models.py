"""
ClaimGuard AI — SQLAlchemy ORM models.

Three tables back the MVP:
  - claims        : a submitted health-insurance claim + computed analysis
  - audit_logs    : immutable-style trail of every action taken on a claim
  - feedback      : auditor feedback events feeding the (simulated) learning loop

All identifiers are anonymized mock values (BEN-xxxx, HOSP-xxx, CLM-xxxx).
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Claim(Base):
    __tablename__ = "claims"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    claim_id: Mapped[str] = mapped_column(String, unique=True, index=True)

    # --- Submission fields (from hospital portal) ---
    beneficiary_id: Mapped[str] = mapped_column(String, index=True)
    hospital_name: Mapped[str] = mapped_column(String, index=True)
    hospital_id: Mapped[str] = mapped_column(String, index=True, default="")
    admission_date: Mapped[str] = mapped_column(String, default="")
    discharge_date: Mapped[str] = mapped_column(String, default="")
    diagnosis: Mapped[str] = mapped_column(String, default="")
    procedure_code: Mapped[str] = mapped_column(String, default="")
    treatment_package: Mapped[str] = mapped_column(String, default="")
    claim_amount: Mapped[float] = mapped_column(Float, default=0.0)
    claimed_package_rate: Mapped[float] = mapped_column(Float, default=0.0)
    submission_date: Mapped[str] = mapped_column(String, default="")

    documents: Mapped[dict] = mapped_column(JSON, default=dict)   # checklist booleans
    signals: Mapped[dict] = mapped_column(JSON, default=dict)     # risk-signal toggles
    ocr_text: Mapped[str] = mapped_column(Text, default="")

    # --- Computed analysis (risk engine output) ---
    risk_score: Mapped[int] = mapped_column(Integer, default=0)
    risk_category: Mapped[str] = mapped_column(String, default="Low Risk")
    recommended_action: Mapped[str] = mapped_column(String, default="Auto-approve")
    fraud_risk: Mapped[str] = mapped_column(String, default="Low")
    medical_necessity: Mapped[str] = mapped_column(String, default="Supported")
    document_completeness: Mapped[str] = mapped_column(String, default="Complete")
    stg_compliance: Mapped[str] = mapped_column(String, default="Follows guideline")
    ai_summary: Mapped[str] = mapped_column(Text, default="")

    status: Mapped[str] = mapped_column(String, default="Pending Review", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "claim_id": self.claim_id,
            "beneficiary_id": self.beneficiary_id,
            "hospital_name": self.hospital_name,
            "hospital_id": self.hospital_id,
            "admission_date": self.admission_date,
            "discharge_date": self.discharge_date,
            "diagnosis": self.diagnosis,
            "procedure_code": self.procedure_code,
            "treatment_package": self.treatment_package,
            "claim_amount": self.claim_amount,
            "claimed_package_rate": self.claimed_package_rate,
            "submission_date": self.submission_date,
            "documents": self.documents or {},
            "signals": self.signals or {},
            "ocr_text": self.ocr_text or "",
            "risk_score": self.risk_score,
            "risk_category": self.risk_category,
            "recommended_action": self.recommended_action,
            "fraud_risk": self.fraud_risk,
            "medical_necessity": self.medical_necessity,
            "document_completeness": self.document_completeness,
            "stg_compliance": self.stg_compliance,
            "ai_summary": self.ai_summary,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    claim_id: Mapped[str] = mapped_column(String, index=True)
    action: Mapped[str] = mapped_column(String)            # e.g. "Approve", "Fraud Hold"
    user_role: Mapped[str] = mapped_column(String, default="Claim Adjudicator")
    previous_status: Mapped[str] = mapped_column(String, default="")
    new_status: Mapped[str] = mapped_column(String, default="")
    note: Mapped[str] = mapped_column(Text, default="")
    reason: Mapped[str] = mapped_column(Text, default="")
    evidence_id: Mapped[str] = mapped_column(String, default="")
    output_hash: Mapped[str] = mapped_column(String, default="")  # MVP placeholder
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "claim_id": self.claim_id,
            "action": self.action,
            "user_role": self.user_role,
            "previous_status": self.previous_status,
            "new_status": self.new_status,
            "note": self.note,
            "reason": self.reason,
            "evidence_id": self.evidence_id,
            "output_hash": self.output_hash,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }


class Feedback(Base):
    __tablename__ = "feedback"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    claim_id: Mapped[str] = mapped_column(String, index=True)
    feedback_type: Mapped[str] = mapped_column(String)   # confirmed_fraud / false_positive / ...
    auditor_decision: Mapped[str] = mapped_column(String, default="")
    ai_recommendation: Mapped[str] = mapped_column(String, default="")
    note: Mapped[str] = mapped_column(Text, default="")
    user_role: Mapped[str] = mapped_column(String, default="Claim Adjudicator")
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "claim_id": self.claim_id,
            "feedback_type": self.feedback_type,
            "auditor_decision": self.auditor_decision,
            "ai_recommendation": self.ai_recommendation,
            "note": self.note,
            "user_role": self.user_role,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }
