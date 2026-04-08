"""Doctor endpoints — patient list, case review, review queue."""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Path, status
from pydantic import BaseModel

from middleware.auth import require_role
from services.doctor_service import (
    add_review,
    get_patients_for_doctor,
    get_pending_reviews,
    get_reviewed_cases,
)

router = APIRouter(prefix="/doctor", tags=["doctor"])
logger = logging.getLogger(__name__)

_doctor_or_admin = require_role("doctor", "admin")


class ReviewRequest(BaseModel):
    notes: str
    recommendation: str
    follow_up_date: Optional[str] = None


@router.get("/patients")
def list_patients(user: dict = Depends(_doctor_or_admin)):
    """Return unique patients visible to doctors."""
    return get_patients_for_doctor(user["id"])


@router.post("/review/{scan_id}", status_code=status.HTTP_201_CREATED)
def submit_review(
    scan_id: str = Path(...),
    req: ReviewRequest = ...,
    user: dict = Depends(_doctor_or_admin),
):
    """Submit a doctor review for a scan."""
    try:
        review_id = add_review(
            scan_id=scan_id,
            doctor_id=user["id"],
            notes=req.notes,
            recommendation=req.recommendation,
            follow_up_date=req.follow_up_date,
        )
    except Exception as exc:
        logger.error("Review submission failed: %s", exc)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not save review.")
    return {"review_id": review_id, "success": True}


@router.get("/queue")
def review_queue(user: dict = Depends(_doctor_or_admin)):
    """Return scans pending doctor review — HIGH_RISK first."""
    return get_pending_reviews(limit=20)


@router.get("/reviewed")
def reviewed_cases(user: dict = Depends(_doctor_or_admin)):
    """Return cases that have already been reviewed."""
    return get_reviewed_cases(doctor_id=user["id"])
