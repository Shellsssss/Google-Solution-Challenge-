"""In-memory doctor review store."""
import uuid
from datetime import datetime, timezone
from typing import Optional

from services.scan_store import _scans

# In-memory review store: review_id -> review dict
_reviews: dict[str, dict] = {}


def add_review(
    scan_id: str,
    doctor_id: str,
    notes: str,
    recommendation: str,
    follow_up_date: Optional[str] = None,
) -> str:
    """Add a doctor review for a scan. Returns the review_id."""
    review_id = str(uuid.uuid4())
    _reviews[review_id] = {
        "id": review_id,
        "scan_id": scan_id,
        "doctor_id": doctor_id,
        "notes": notes,
        "recommendation": recommendation,
        "follow_up_date": follow_up_date,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    # Mark the scan as reviewed
    for s in _scans:
        if s["id"] == scan_id:
            s["review_id"] = review_id
            s["reviewed_by"] = doctor_id
            break
    return review_id


def get_pending_reviews(limit: int = 20) -> list[dict]:
    """Return scans without a doctor review, HIGH_RISK first."""
    reviewed_scan_ids = {r["scan_id"] for r in _reviews.values()}
    pending = [
        s for s in _scans
        if not s.get("deleted")
        and s["id"] not in reviewed_scan_ids
    ]
    # HIGH_RISK first
    pending.sort(
        key=lambda s: (
            0 if s.get("risk_level") == "HIGH_RISK" else
            1 if s.get("risk_level") == "LOW_RISK" else 2,
            s.get("created_at", ""),
        )
    )
    return pending[:limit]


def get_reviewed_cases(doctor_id: Optional[str] = None) -> list[dict]:
    """Return scans that have doctor reviews, optionally filtered by doctor."""
    reviews = list(_reviews.values())
    if doctor_id:
        reviews = [r for r in reviews if r["doctor_id"] == doctor_id]

    reviewed_scan_ids = {r["scan_id"] for r in reviews}
    reviewed_scans = [s for s in _scans if s["id"] in reviewed_scan_ids and not s.get("deleted")]

    # Attach review data
    scan_map = {s["id"]: s for s in reviewed_scans}
    result = []
    for r in reviews:
        scan = scan_map.get(r["scan_id"])
        if scan:
            entry = dict(scan)
            entry["review"] = r
            result.append(entry)

    result.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return result


def get_patients_for_doctor(doctor_id: Optional[str] = None) -> list[dict]:
    """Return unique users who have scans (visible to doctors)."""
    seen_users: set[str] = set()
    patients = []
    for s in _scans:
        if s.get("deleted"):
            continue
        uid = s.get("user_id", "")
        if uid and uid not in seen_users:
            seen_users.add(uid)
            patients.append({
                "user_id": uid,
                "scan_count": sum(1 for x in _scans if x.get("user_id") == uid and not x.get("deleted")),
                "last_scan": s.get("created_at"),
                "last_risk": s.get("risk_level"),
            })
    return patients
