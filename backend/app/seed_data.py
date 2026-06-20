"""
ClaimGuard AI — Seed data (MVP Simulation, anonymized mock claims only).

12 scenario claims spanning every risk band and fraud pattern from the source PDF.
No real patient PII — all identifiers are synthetic (BEN-xxxx, HOSP-xxx, CLM-xxxx).
Risk analysis is computed by the live risk engine at seed time so the stored values
always match the engine logic.
"""
from __future__ import annotations

from .database import Base, SessionLocal, engine
from .models import AuditLog, Claim, Feedback
from .services.agent_engine import generate_summary
from .services.risk_engine import score_claim

_ALL_DOCS = {
    "hospital_bill": True,
    "discharge_summary": True,
    "diagnostic_report": True,
    "patient_identity": True,
    "admission_proof": True,
    "patient_photo": True,
}


def _docs(missing=None):
    d = dict(_ALL_DOCS)
    for m in missing or []:
        d[m] = False
    return d


# Each entry: scenario claim. `signals` lists only the active risk keys.
SEED_CLAIMS = [
    {
        "claim_id": "CLM-2001-GEN",
        "beneficiary_id": "BEN-1001",
        "hospital_name": "Sunrise Care Hospital",
        "hospital_id": "HOSP-201",
        "admission_date": "2026-06-10",
        "discharge_date": "2026-06-13",
        "diagnosis": "Acute Gastroenteritis",
        "procedure_code": "PROC-GEN-118",
        "treatment_package": "General Medicine",
        "claim_amount": 18000,
        "claimed_package_rate": 18000,
        "submission_date": "2026-06-14",
        "documents": _docs(),
        "signals": [],
        "ocr_text": "Discharge summary: 3-day admission for acute gastroenteritis, IV fluids, recovered.",
        "status": "Approved",
        "scenario": "Clean low-risk claim",
    },
    {
        "claim_id": "CLM-2002-NEPHRO",
        "beneficiary_id": "BEN-1002",
        "hospital_name": "Sunrise Care Hospital",
        "hospital_id": "HOSP-201",
        "admission_date": "2026-06-11",
        "discharge_date": "2026-06-11",
        "diagnosis": "Chronic Kidney Disease — Maintenance Dialysis",
        "procedure_code": "PROC-DIAL-009",
        "treatment_package": "Dialysis",
        "claim_amount": 2200,
        "claimed_package_rate": 2200,
        "submission_date": "2026-06-12",
        "documents": _docs(missing=["diagnostic_report"]),
        "signals": ["missing_document"],
        "ocr_text": "Dialysis session record. Diagnostic report not attached.",
        "status": "Approved",
        "scenario": "Missing document claim",
    },
    {
        "claim_id": "CLM-2003-CARD",
        "beneficiary_id": "BEN-1003",
        "hospital_name": "Metro Multispeciality",
        "hospital_id": "HOSP-202",
        "admission_date": "2026-06-09",
        "discharge_date": "2026-06-14",
        "diagnosis": "Stable Angina",
        "procedure_code": "PROC-CARD-204",
        "treatment_package": "Cardiac Care — Angioplasty",
        "claim_amount": 165000,
        "claimed_package_rate": 165000,
        "submission_date": "2026-06-15",
        "documents": _docs(),
        "signals": ["package_mismatch", "diagnosis_treatment_mismatch"],
        "ocr_text": "Stable angina managed medically; angioplasty package claimed.",
        "status": "Pending Review",
        "scenario": "Package mismatch claim",
    },
    {
        "claim_id": "CLM-2004-ORTHO",
        "beneficiary_id": "BEN-1004",
        "hospital_name": "Metro Multispeciality",
        "hospital_id": "HOSP-202",
        "admission_date": "2026-06-08",
        "discharge_date": "2026-06-12",
        "diagnosis": "Closed Fracture — Femur",
        "procedure_code": "PROC-ORTH-076",
        "treatment_package": "Orthopaedics — Fracture Fixation",
        "claim_amount": 96000,
        "claimed_package_rate": 70000,
        "submission_date": "2026-06-13",
        "documents": _docs(),
        "signals": ["inflated_billing", "package_mismatch"],
        "ocr_text": "Implant + consumables + room charges billed well above package benchmark.",
        "status": "Pending Review",
        "scenario": "Inflated billing claim",
    },
    {
        "claim_id": "CLM-2005-OPHTH",
        "beneficiary_id": "BEN-1005",
        "hospital_name": "Lakeview Eye Centre",
        "hospital_id": "HOSP-203",
        "admission_date": "2026-06-07",
        "discharge_date": "2026-06-07",
        "diagnosis": "Senile Cataract",
        "procedure_code": "PROC-CAT-051",
        "treatment_package": "Cataract Surgery",
        "claim_amount": 16500,
        "claimed_package_rate": 16500,
        "submission_date": "2026-06-09",
        "documents": _docs(),
        "signals": ["duplicate_procedure", "repeat_admission", "high_risk_hospital"],
        "ocr_text": "Cataract surgery — same eye procedure code appears in prior claims for this beneficiary.",
        "status": "Pending Review",
        "scenario": "Duplicate procedure claim",
    },
    {
        "claim_id": "CLM-2006-GEN",
        "beneficiary_id": "BEN-1006",
        "hospital_name": "Greenfield Hospital",
        "hospital_id": "HOSP-204",
        "admission_date": "2026-06-05",
        "discharge_date": "2026-06-08",
        "diagnosis": "Recurrent Fever — Observation",
        "procedure_code": "PROC-GEN-118",
        "treatment_package": "General Medicine",
        "claim_amount": 21000,
        "claimed_package_rate": 21000,
        "submission_date": "2026-06-09",
        "documents": _docs(missing=["admission_proof"]),
        "signals": ["repeat_admission", "missing_document"],
        "ocr_text": "Fourth admission this quarter for similar febrile illness; admission proof absent.",
        "status": "Pending Review",
        "scenario": "Repeat admission claim",
    },
    {
        "claim_id": "CLM-2007-RAD",
        "beneficiary_id": "BEN-1007",
        "hospital_name": "Greenfield Hospital",
        "hospital_id": "HOSP-204",
        "admission_date": "2026-06-04",
        "discharge_date": "2026-06-07",
        "diagnosis": "Lower Respiratory Tract Infection",
        "procedure_code": "PROC-GEN-120",
        "treatment_package": "General Medicine — Pneumonia",
        "claim_amount": 27000,
        "claimed_package_rate": 27000,
        "submission_date": "2026-06-08",
        "documents": _docs(),
        "signals": ["reused_image", "suspicious_document", "high_risk_hospital"],
        "ocr_text": "Chest X-ray image hash matches an image in another beneficiary's claim; report edited.",
        "status": "Pending Review",
        "scenario": "Reused image signal claim",
    },
    {
        "claim_id": "CLM-2008-GASTRO",
        "beneficiary_id": "BEN-1008",
        "hospital_name": "City Trust Hospital",
        "hospital_id": "HOSP-205",
        "admission_date": "2026-06-03",
        "discharge_date": "2026-06-06",
        "diagnosis": "Acute Appendicitis",
        "procedure_code": "PROC-SURG-310",
        "treatment_package": "General Surgery — Appendectomy",
        "claim_amount": 42000,
        "claimed_package_rate": 42000,
        "submission_date": "2026-06-07",
        "documents": _docs(),
        "signals": ["suspicious_document", "ai_generated_note", "diagnosis_treatment_mismatch"],
        "ocr_text": "Discharge summary phrasing flagged as AI-generated; altered watermark on bill.",
        "status": "Pending Review",
        "scenario": "Suspicious document claim",
    },
    {
        "claim_id": "CLM-2009-MAT",
        "beneficiary_id": "BEN-1009",
        "hospital_name": "City Trust Hospital",
        "hospital_id": "HOSP-205",
        "admission_date": "2026-06-02",
        "discharge_date": "2026-06-05",
        "diagnosis": "Normal Delivery",
        "procedure_code": "PROC-MAT-401",
        "treatment_package": "Maternity Care",
        "claim_amount": 25000,
        "claimed_package_rate": 25000,
        "submission_date": "2026-06-06",
        "documents": _docs(),
        "signals": ["identity_issue", "suspicious_document", "repeat_admission", "reused_image"],
        "ocr_text": "Beneficiary identity could not be verified against scheme records; patient photo reused.",
        "status": "Fraud Hold",
        "scenario": "Identity issue claim",
    },
    {
        "claim_id": "CLM-2010-NEURO",
        "beneficiary_id": "BEN-1010",
        "hospital_name": "Metro Multispeciality",
        "hospital_id": "HOSP-202",
        "admission_date": "2026-06-01",
        "discharge_date": "2026-06-04",
        "diagnosis": "Seizure Disorder — Evaluation",
        "procedure_code": "PROC-NEU-512",
        "treatment_package": "Neurology — Evaluation",
        "claim_amount": 38000,
        "claimed_package_rate": 38000,
        "submission_date": "2026-06-05",
        "documents": _docs(),
        "signals": ["ai_generated_note", "suspicious_document"],
        "ocr_text": "Clinical narrative consistency check flags possible AI-generated fabrication.",
        "status": "Pending Review",
        "scenario": "AI-generated clinical note suspicion claim",
    },
    {
        "claim_id": "CLM-2011-DIAB",
        "beneficiary_id": "BEN-1011",
        "hospital_name": "Lakeview Eye Centre",
        "hospital_id": "HOSP-203",
        "admission_date": "2026-05-30",
        "discharge_date": "2026-06-02",
        "diagnosis": "Type 2 Diabetes — Foot Ulcer",
        "procedure_code": "PROC-GEN-145",
        "treatment_package": "General Medicine — Wound Care",
        "claim_amount": 31000,
        "claimed_package_rate": 31000,
        "submission_date": "2026-06-03",
        "documents": _docs(),
        "signals": ["diagnosis_treatment_mismatch", "package_mismatch"],
        "ocr_text": "Treatment plan partially deviates from STG; package not aligned with wound-care protocol.",
        "status": "Pending Review",
        "scenario": "STG partial compliance claim",
    },
    {
        "claim_id": "CLM-2012-CRIT",
        "beneficiary_id": "BEN-1012",
        "hospital_name": "Horizon Speciality Hospital",
        "hospital_id": "HOSP-206",
        "admission_date": "2026-05-28",
        "discharge_date": "2026-06-01",
        "diagnosis": "Coronary Artery Disease",
        "procedure_code": "PROC-CARD-208",
        "treatment_package": "Cardiac Care — Stent",
        "claim_amount": 240000,
        "claimed_package_rate": 150000,
        "submission_date": "2026-06-02",
        "documents": _docs(missing=["patient_identity"]),
        "signals": [
            "identity_issue",
            "reused_image",
            "suspicious_document",
            "duplicate_procedure",
            "inflated_billing",
            "ai_generated_note",
        ],
        "ocr_text": "Multiple fraud indicators: ghost identity, reused angiography image, forged + AI-generated notes, inflated stent billing.",
        "status": "Fraud Hold",
        "scenario": "Critical multi-signal fraud claim",
    },
]


def _signals_dict(active_keys):
    from .services.risk_engine import RISK_FACTORS

    return {f["key"]: (f["key"] in active_keys) for f in RISK_FACTORS}


def build_claim_row(spec: dict) -> Claim:
    payload = {
        **spec,
        "signals": _signals_dict(spec["signals"]),
    }
    analysis = score_claim(payload)
    return Claim(
        claim_id=spec["claim_id"],
        beneficiary_id=spec["beneficiary_id"],
        hospital_name=spec["hospital_name"],
        hospital_id=spec["hospital_id"],
        admission_date=spec["admission_date"],
        discharge_date=spec["discharge_date"],
        diagnosis=spec["diagnosis"],
        procedure_code=spec["procedure_code"],
        treatment_package=spec["treatment_package"],
        claim_amount=spec["claim_amount"],
        claimed_package_rate=spec["claimed_package_rate"],
        submission_date=spec["submission_date"],
        documents=spec["documents"],
        signals=payload["signals"],
        ocr_text=spec["ocr_text"],
        risk_score=analysis["score"],
        risk_category=analysis["category"],
        recommended_action=analysis["recommended_action"],
        fraud_risk=analysis["fraud_risk"],
        medical_necessity=analysis["medical_necessity"],
        document_completeness=analysis["document_completeness"],
        stg_compliance=analysis["stg_compliance"],
        ai_summary=generate_summary(payload),
        status=spec["status"],
    )


def seed_database(reset: bool = True) -> int:
    """(Re)create tables and load the seed claims + a few audit/feedback events."""
    if reset:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if reset:
            db.query(Claim).delete()
            db.query(AuditLog).delete()
            db.query(Feedback).delete()
            db.commit()

        for spec in SEED_CLAIMS:
            db.add(build_claim_row(spec))
        db.commit()

        # A couple of seed audit logs + feedback so analytics/feedback pages have data.
        db.add_all(
            [
                AuditLog(
                    claim_id="CLM-2001-GEN",
                    action="Approve",
                    user_role="Claim Adjudicator",
                    previous_status="Pending Review",
                    new_status="Approved",
                    note="Clean claim, complete documents, guideline compliant. Auto-approved.",
                    reason="Low Risk (score 0/100)",
                    evidence_id="EVD-2001",
                    output_hash="sha256:seed-2001",
                ),
                AuditLog(
                    claim_id="CLM-2002-NEPHRO",
                    action="Approve",
                    user_role="Claim Adjudicator",
                    previous_status="Pending Review",
                    new_status="Approved",
                    note="Routine dialysis; missing diagnostic report waived for maintenance session.",
                    reason="Low Risk (score 12/100)",
                    evidence_id="EVD-2002",
                    output_hash="sha256:seed-2002",
                ),
                AuditLog(
                    claim_id="CLM-2009-MAT",
                    action="Fraud Hold",
                    user_role="Fraud Investigator",
                    previous_status="Pending Review",
                    new_status="Fraud Hold",
                    note="Identity unverifiable + reused patient photo. Escalated to fraud investigation.",
                    reason="Critical Risk — ghost identity indicators",
                    evidence_id="EVD-2009",
                    output_hash="sha256:seed-2009",
                ),
                AuditLog(
                    claim_id="CLM-2012-CRIT",
                    action="Fraud Hold",
                    user_role="Fraud Investigator",
                    previous_status="Pending Review",
                    new_status="Fraud Hold",
                    note="Six concurrent fraud indicators. Payment blocked pending investigation.",
                    reason="Critical Risk (score 100/100)",
                    evidence_id="EVD-2012",
                    output_hash="sha256:seed-2012",
                ),
            ]
        )
        db.add_all(
            [
                Feedback(
                    claim_id="CLM-2001-GEN",
                    feedback_type="true_positive",
                    auditor_decision="Approve",
                    ai_recommendation="Auto-approve / Fast-track",
                    note="AI low-risk call confirmed correct by auditor.",
                    user_role="Claim Adjudicator",
                ),
                Feedback(
                    claim_id="CLM-2012-CRIT",
                    feedback_type="confirmed_fraud",
                    auditor_decision="Fraud Hold",
                    ai_recommendation="Fraud Investigation Hold",
                    note="Investigator confirmed ghost identity + reused image fraud.",
                    user_role="Fraud Investigator",
                ),
                Feedback(
                    claim_id="CLM-2009-MAT",
                    feedback_type="confirmed_fraud",
                    auditor_decision="Fraud Hold",
                    ai_recommendation="Fraud Investigation Hold",
                    note="Identity fraud confirmed against scheme records.",
                    user_role="Fraud Investigator",
                ),
            ]
        )
        db.commit()
        return db.query(Claim).count()
    finally:
        db.close()


if __name__ == "__main__":
    count = seed_database(reset=True)
    print(f"Seeded {count} claims into the ClaimGuard AI database.")
