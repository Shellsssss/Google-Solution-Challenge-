"""REST endpoint — combined TFLite + Gemini vision analysis."""
import base64
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from services.gemini_service import (
    DISCLAIMER,
    SYMPTOM_QUESTIONS,
    analyze_image_with_gemini,
    check_image_quality,
)
from services.ml_service import run_inference, get_all_probabilities
from services.scan_store import save_scan
from services.geo_service import reverse_geocode

router = APIRouter()
logger = logging.getLogger(__name__)

# Conservative mapping — MEDIUM_RISK treated as HIGH_RISK in response
_NORMALISE = {"MEDIUM_RISK": "HIGH_RISK"}

# Max image size: 10 MB
_MAX_IMAGE_BYTES = 10 * 1024 * 1024


class AnalyzeRequest(BaseModel):
    image_base64: str
    scan_type: str = "oral"        # "oral" | "skin"
    symptoms: Optional[dict] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    age_group: Optional[str] = None      # "under_18" | "18-40" | "40-60" | "60+"
    tobacco_habit: Optional[str] = None  # "none" | "smoking" | "chewing" | "both"
    language: str = "en"
    skip_quality_check: bool = False   # set true in testing/demo


@router.post("/analyze")
async def analyze(req: AnalyzeRequest):
    """
    Full analysis pipeline:
    1. Decode + validate image
    2. Gemini image quality check (reject bad photos early)
    3. TFLite model inference (risk + confidence + all probabilities)
    4. Gemini vision analysis (Gemini sees the actual image + model result)
    5. Nearest centres (if lat/lng provided)

    Response:
    {
        "risk_level": "LOW_RISK" | "HIGH_RISK" | "INVALID",
        "confidence": 0.0–1.0,
        "probabilities": {"LOW_RISK": 0.1, "MEDIUM_RISK": 0.3, "HIGH_RISK": 0.6},
        "scan_type": "oral",
        "explanation": {"en": "...", "hi": "...", "ta": "...", "te": "..."},
        "concern": "...",
        "action_required": true,
        "nearest_centers": [],
        "disclaimer": {...}
    }
    """
    scan_type = req.scan_type if req.scan_type in ("oral", "skin") else "oral"

    # ── 1. Decode image ────────────────────────────────────────────────────────
    try:
        image_bytes = base64.b64decode(req.image_base64)
    except Exception:
        return _error_response("Invalid base64 image data.", scan_type)

    if len(image_bytes) < 1000:
        return _error_response("Image is too small or empty.", scan_type)

    if len(image_bytes) > _MAX_IMAGE_BYTES:
        return _error_response(
            f"Image too large ({len(image_bytes)//1024//1024} MB). Maximum is 10 MB.", scan_type
        )

    # ── 2. Image quality check (Gemini) ───────────────────────────────────────
    if not req.skip_quality_check:
        quality = await check_image_quality(image_bytes)
        if quality.get("quality") == "BAD":
            reason = quality.get("reason", "The photo was not clear enough.")
            logger.info("Quality check failed: %s", reason)
            return {
                "risk_level": "INVALID",
                "confidence": 0.0,
                "probabilities": {},
                "scan_type": scan_type,
                "explanation": {
                    "en": f"The photo could not be analysed. {reason} Please retake with good lighting.",
                    "hi": f"तस्वीर की जांच नहीं हो सकी। {reason} कृपया अच्छी रोशनी में दोबारा फोटो लें।",
                    "ta": f"படத்தை பகுப்பாய்வு செய்ய முடியவில்லை. {reason} நல்ல வெளிச்சத்தில் மீண்டும் படம் எடுக்கவும்.",
                    "te": f"ఫోటో విశ్లేషించబడలేదు. {reason} మంచి వెలుతురులో తిరిగి ఫోటో తీయండి.",
                },
                "concern": "Please retake the photo in a well-lit area and try again.",
                "action_required": False,
                "nearest_centers": [],
                "disclaimer": DISCLAIMER,
            }

    # ── 3. TFLite inference ────────────────────────────────────────────────────
    risk_level, confidence = run_inference(image_bytes, scan_type)
    probabilities = get_all_probabilities(image_bytes, scan_type)

    # ── 4. Gemini vision analysis ──────────────────────────────────────────────
    explanation = await analyze_image_with_gemini(
        image_bytes=image_bytes,
        risk_level=risk_level,
        confidence=confidence,
        scan_type=scan_type,
        symptoms=req.symptoms,
    )

    explanation_dict = {
        "en": explanation.get("en", ""),
        "hi": explanation.get("hi", ""),
        "ta": explanation.get("ta", ""),
        "te": explanation.get("te", ""),
    }

    # ── 5. Nearest centres ─────────────────────────────────────────────────────
    nearest_centers = []
    if req.latitude and req.longitude:
        try:
            from services.maps_service import find_nearest_cancer_center
            nearest_centers = await find_nearest_cancer_center(req.latitude, req.longitude)
        except Exception as exc:
            logger.warning("Maps lookup failed: %s", exc)

    # ── 6. Reverse-geocode + persist scan ─────────────────────────────────────
    city, state = "", ""
    if req.latitude and req.longitude:
        try:
            city, state = await reverse_geocode(req.latitude, req.longitude)
        except Exception:
            pass

    save_scan({
        "scan_type": scan_type,
        "risk_level": risk_level,
        "confidence": round(confidence, 4),
        "language": req.language,
        "symptoms": req.symptoms or {},
        "lat": req.latitude,
        "lng": req.longitude,
        "city": city,
        "state": state,
        "age_group": req.age_group or "",
        "tobacco_habit": req.tobacco_habit or "",
        "explanation_en": explanation_dict.get("en", ""),
        "concern": explanation.get("concern", ""),
    })

    return {
        "risk_level": risk_level,
        "confidence": round(confidence, 4),
        "probabilities": probabilities,
        "scan_type": scan_type,
        "explanation": explanation_dict,
        "concern": explanation.get("concern", ""),
        "action_required": explanation.get("action_required", risk_level == "HIGH_RISK"),
        "nearest_centers": nearest_centers,
        "disclaimer": DISCLAIMER,
    }


@router.get("/symptoms/{scan_type}")
def get_symptom_questions(scan_type: str):
    """Return the bilingual symptom questionnaire for a given scan type."""
    if scan_type not in ("oral", "skin"):
        raise HTTPException(400, "scan_type must be 'oral' or 'skin'")
    return {"questions": SYMPTOM_QUESTIONS[scan_type]}


class FollowupRequest(BaseModel):
    scan_type: str
    selected_symptoms: list[str] = []
    duration: str = ""
    pain_level: int = 0
    risk_factors: list[str] = []


@router.post("/symptoms/followup")
async def get_followup_questions(req: FollowupRequest):
    """Use Gemini to generate personalised follow-up questions."""
    import json, re, os
    import google.generativeai as genai

    genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))

    symptoms_str = ", ".join(req.selected_symptoms) if req.selected_symptoms else "none specified"
    risk_str = ", ".join(req.risk_factors) if req.risk_factors else "none"
    pain_desc = "no pain" if req.pain_level == 0 else f"pain level {req.pain_level}/10"

    prompt = f"""You are an expert medical screening assistant specialising in early cancer detection in India.

A patient is undergoing a {req.scan_type} cancer screening:
- Symptoms: {symptoms_str}
- Duration: {req.duration or 'not specified'}
- {pain_desc}
- Risk factors: {risk_str}

Generate exactly 2 highly specific, clinically relevant follow-up questions tailored to THIS patient.
Questions must be in plain English understandable by rural Indian patients.
Return ONLY valid JSON: {{"questions": ["question 1", "question 2"]}}"""

    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        text = response.text.strip()
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            data = json.loads(match.group())
            if isinstance(data.get("questions"), list) and len(data["questions"]) >= 2:
                return {"questions": data["questions"][:2]}
    except Exception as exc:
        logger.warning("Gemini followup failed: %s", exc)

    fallbacks = {
        "oral": [
            "Have you noticed difficulty opening your mouth or moving your tongue freely?",
            "Have any sores or patches been present for more than 3 weeks without healing?",
        ],
        "skin": [
            "Has the lesion changed in size, shape, or colour in the last 4 weeks?",
            "Does the area bleed spontaneously or when touched lightly?",
        ],
    }
    return {"questions": fallbacks.get(req.scan_type, [
        "Have you seen a doctor about these symptoms before?",
        "Are you currently taking any medications?",
    ])}


def _error_response(message: str, scan_type: str = "oral") -> dict:
    return {
        "risk_level": "INVALID",
        "confidence": 0.0,
        "probabilities": {},
        "scan_type": scan_type,
        "explanation": {
            "en": f"Analysis failed: {message} Please retake the photo and try again.",
            "hi": f"जांच विफल: {message} कृपया फोटो दोबारा लें।",
            "ta": f"பகுப்பாய்வு தோல்வியடைந்தது: {message} மீண்டும் புகைப்படம் எடுக்கவும்.",
            "te": f"విశ్లేషణ విఫలమైంది: {message} దయచేసి ఫోటో తిరిగి తీయండి.",
        },
        "concern": "Please retake the photo in good lighting and try again.",
        "action_required": False,
        "nearest_centers": [],
        "disclaimer": DISCLAIMER,
    }
