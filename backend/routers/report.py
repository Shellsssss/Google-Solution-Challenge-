"""PDF report generation and download endpoints."""
import logging
import os
import tempfile
import threading
import time
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from services.gemini_service import generate_pdf_narrative
from services.pdf_service import generate_report

router = APIRouter()
logger = logging.getLogger(__name__)

# In-memory store: report_id → {"path": str, "filename": str, "created": float}
_reports: dict[str, dict] = {}
_CLEANUP_AFTER_SECONDS = 3600  # 1 hour


class QAItem(BaseModel):
    question: str
    answer: str


class NearestCentre(BaseModel):
    name: str
    address: str
    distance_km: float
    phone: Optional[str] = None


class ReportRequest(BaseModel):
    report_id: Optional[str] = None
    user_name: Optional[str] = None
    phone_masked: Optional[str] = None
    scan_date: Optional[str] = None
    scan_time: Optional[str] = None
    scan_type: str = "oral"
    risk_level: str               # "LOW_RISK" | "HIGH_RISK" | "INVALID"
    confidence: float = 0.0
    explanation_en: str = ""      # Gemini's short visual finding (used as context)
    explanation_local: str = ""
    local_language: str = "en"
    concern: str = ""
    symptoms: Optional[dict] = None   # raw symptom answers {question: answer}
    questions_and_answers: list[QAItem] = []
    image_base64: Optional[str] = None
    nearest_centres: list[NearestCentre] = []


@router.post("/report/generate")
async def generate(req: ReportRequest):
    """Generate a Gemini-enriched PDF report and return a download URL."""
    report_id = req.report_id or f"JA-{uuid.uuid4().hex[:8].upper()}"

    now = datetime.now()
    scan_date = req.scan_date or now.strftime("%d/%m/%Y")
    scan_time = req.scan_time or now.strftime("%I:%M %p")

    # Decode image if provided
    image_bytes = None
    if req.image_base64:
        try:
            import base64
            image_bytes = base64.b64decode(req.image_base64)
        except Exception:
            logger.warning("Could not decode image_base64 — PDF will have no image")

    # ── Generate rich Gemini narrative ─────────────────────────────────────────
    narrative = await generate_pdf_narrative(
        scan_type=req.scan_type,
        risk_level=req.risk_level,
        confidence=req.confidence,
        symptoms=req.symptoms,
        gemini_finding=req.explanation_en,
    )

    # ── Build data dict for pdf_service ────────────────────────────────────────
    data = {
        "report_id": report_id,
        "user_name": req.user_name or "Anonymous",
        "phone_masked": req.phone_masked or "XXXXXXXXXX",
        "scan_date": scan_date,
        "scan_time": scan_time,
        "scan_type": req.scan_type,
        "risk_level": req.risk_level,
        "confidence": req.confidence,
        # Gemini narrative fields
        "summary_en": narrative.get("summary_en", req.explanation_en),
        "summary_hi": narrative.get("summary_hi", ""),
        "summary_ta": narrative.get("summary_ta", ""),
        "summary_te": narrative.get("summary_te", ""),
        "next_steps": narrative.get("next_steps", []),
        "tell_doctor": narrative.get("tell_doctor", []),
        "lifestyle_tip": narrative.get("lifestyle_tip", ""),
        "urgency": narrative.get("urgency", "ROUTINE"),
        # Legacy fields kept for compatibility
        "explanation_en": req.explanation_en,
        "explanation_local": req.explanation_local,
        "local_language": req.local_language,
        "concern": req.concern,
        "questions_and_answers": [{"question": q.question, "answer": q.answer}
                                   for q in req.questions_and_answers],
        "image_bytes": image_bytes,
        "nearest_centres": [c.model_dump() for c in req.nearest_centres],
    }

    try:
        pdf_bytes = generate_report(data)
    except Exception as exc:
        logger.error("PDF generation failed: %s", exc)
        raise HTTPException(500, f"PDF generation failed: {exc}")

    # Save to temp file
    date_str = now.strftime("%d-%m-%Y")
    filename = f"JanArogya_Report_{report_id}_{date_str}.pdf"
    tmp_path = os.path.join(tempfile.gettempdir(), f"janarogya_{report_id}.pdf")

    with open(tmp_path, "wb") as f:
        f.write(pdf_bytes)

    _reports[report_id] = {
        "path": tmp_path,
        "filename": filename,
        "created": time.time(),
    }
    _schedule_cleanup(report_id)

    return {
        "success": True,
        "report_id": report_id,
        "download_url": f"/api/v1/report/download/{report_id}",
        "filename": filename,
    }


@router.get("/report/download/{report_id}")
async def download(report_id: str):
    """Download a previously generated PDF report."""
    entry = _reports.get(report_id)
    if not entry:
        raise HTTPException(404, "Report not found or expired")

    path = entry["path"]
    if not os.path.exists(path):
        raise HTTPException(404, "Report file not found")

    return FileResponse(
        path=path,
        media_type="application/pdf",
        filename=entry["filename"],
    )


def _schedule_cleanup(report_id: str) -> None:
    def _cleanup():
        time.sleep(_CLEANUP_AFTER_SECONDS)
        entry = _reports.pop(report_id, None)
        if entry and os.path.exists(entry["path"]):
            try:
                os.remove(entry["path"])
                logger.info("Cleaned up report %s", report_id)
            except Exception as exc:
                logger.warning("Cleanup failed for %s: %s", report_id, exc)

    t = threading.Thread(target=_cleanup, daemon=True)
    t.start()
