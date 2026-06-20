"""
ClaimGuard AI — Pydantic schemas (request/response contracts).
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class DocumentChecklist(BaseModel):
    hospital_bill: bool = False
    discharge_summary: bool = False
    diagnostic_report: bool = False
    patient_identity: bool = False
    admission_proof: bool = False
    patient_photo: bool = False


class RiskSignals(BaseModel):
    missing_document: bool = False
    package_mismatch: bool = False
    diagnosis_treatment_mismatch: bool = False
    inflated_billing: bool = False
    duplicate_procedure: bool = False
    repeat_admission: bool = False
    reused_image: bool = False
    suspicious_document: bool = False
    identity_issue: bool = False
    ai_generated_note: bool = False
    high_risk_hospital: bool = False
    stg_non_compliance: bool = False


class ClaimCreate(BaseModel):
    claim_id: Optional[str] = Field(default=None, description="Auto-generated if omitted")
    beneficiary_id: str
    hospital_name: str
    hospital_id: Optional[str] = ""
    admission_date: Optional[str] = ""
    discharge_date: Optional[str] = ""
    diagnosis: str = ""
    procedure_code: Optional[str] = ""
    treatment_package: str = ""
    claim_amount: float = 0.0
    claimed_package_rate: float = 0.0
    submission_date: Optional[str] = ""
    documents: DocumentChecklist = Field(default_factory=DocumentChecklist)
    signals: RiskSignals = Field(default_factory=RiskSignals)
    ocr_text: Optional[str] = ""


class ClaimOut(BaseModel):
    id: int
    claim_id: str
    beneficiary_id: str
    hospital_name: str
    hospital_id: str
    admission_date: str
    discharge_date: str
    diagnosis: str
    procedure_code: str
    treatment_package: str
    claim_amount: float
    claimed_package_rate: float
    submission_date: str
    documents: Dict[str, Any]
    signals: Dict[str, Any]
    ocr_text: str
    risk_score: int
    risk_category: str
    recommended_action: str
    fraud_risk: str
    medical_necessity: str
    document_completeness: str
    stg_compliance: str
    ai_summary: str
    status: str
    created_at: Optional[str]


class DecisionRequest(BaseModel):
    action: str = Field(..., description="Approve | Query Hospital | Send to Medical Audit | Fraud Hold | Reject")
    note: str = ""
    user_role: str = "Claim Adjudicator"
    feedback_type: Optional[str] = None  # confirmed_fraud / false_positive / false_negative / true_positive


class FeedbackCreate(BaseModel):
    claim_id: str
    feedback_type: str
    auditor_decision: str = ""
    ai_recommendation: str = ""
    note: str = ""
    user_role: str = "Claim Adjudicator"


class AnalyzeResponse(BaseModel):
    claim_id: str
    risk_score: int
    risk_category: str
    recommended_action: str
    fraud_risk: str
    medical_necessity: str
    document_completeness: str
    stg_compliance: str
    active_signals: List[str]
    top_factors: List[Dict[str, Any]]
    factors: List[Dict[str, Any]]
    agents: List[Dict[str, Any]]
    ai_summary: str
