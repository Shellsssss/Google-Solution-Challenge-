"""WhatsApp conversation handler with full state machine.

Flow per user:
  IDLE → TYPE_SELECT → SYMPTOM_1 → SYMPTOM_2 → SYMPTOM_3 → AWAIT_IMAGE → DONE
"""
import hashlib
import logging
import os
from datetime import datetime

from config.disclaimers import check_for_banned_words
from services.firebase_service import save_screening, upload_pdf
from services.gemini_service import (
    DISCLAIMER,
    SYMPTOM_QUESTIONS,
    analyze_image_with_gemini,
    check_image_quality,
    generate_pdf_narrative,
)
from services.maps_service import get_maps_link
from services.ml_service import run_inference
from services.pdf_service import generate_report
from services.whatsapp_service import download_media, send_buttons, send_document, send_message

logger = logging.getLogger(__name__)

_DEFAULT_MAPS_LINK = get_maps_link("cancer screening hospital")

# ── Per-user conversation state ───────────────────────────────────────────────
# {phone: {state, scan_type, symptoms, report_data}}
_sessions: dict[str, dict] = {}

# States
IDLE         = "IDLE"
TYPE_SELECT  = "TYPE_SELECT"
SYMPTOM_1    = "SYMPTOM_1"
SYMPTOM_2    = "SYMPTOM_2"
SYMPTOM_3    = "SYMPTOM_3"
AWAIT_IMAGE  = "AWAIT_IMAGE"
DONE         = "DONE"


# ── Static messages ───────────────────────────────────────────────────────────

_WELCOME = (
    "नमस्ते! JanArogya में आपका स्वागत है 🙏\n"
    "हम मुँह या त्वचा की AI जांच करते हैं।\n\n"
    "Hello! Welcome to JanArogya.\n"
    "We provide AI screening for oral and skin health.\n\n"
    "कृपया चुनें / Please choose:"
)

_TYPE_BUTTONS = [
    {"id": "oral", "title": "👄 Oral (मुँह)"},
    {"id": "skin", "title": "🖐 Skin (त्वचा)"},
]

_PDF_OFFER = (
    "📄 रिपोर्ट PDF चाहिए? *YES* भेजें।\n"
    "Want a PDF report? Reply *YES*."
)

_AWAIT_PHOTO = {
    "oral": (
        "✅ लक्षण नोट किए गए।\n\n"
        "अब *मुँह के अंदर की साफ तस्वीर* भेजें —\n"
        "अच्छी रोशनी में, सीधे कैमरे से।\n\n"
        "Now please send a *clear photo inside your mouth* in good lighting."
    ),
    "skin": (
        "✅ लक्षण नोट किए गए।\n\n"
        "अब *त्वचा के घाव/धब्बे की साफ तस्वीर* भेजें —\n"
        "अच्छी रोशनी में, पास से।\n\n"
        "Now please send a *clear close-up photo of the skin area* in good lighting."
    ),
}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _session(sender: str) -> dict:
    if sender not in _sessions:
        _sessions[sender] = {
            "state":       IDLE,
            "scan_type":   None,
            "symptoms":    {},
            "report_data": None,
        }
    return _sessions[sender]


def _reset(sender: str):
    _sessions.pop(sender, None)


def _urgency(risk_level: str, action_required: bool) -> str:
    if risk_level == "HIGH_RISK":
        return "urgent"
    if action_required:
        return "within_week"
    return "monitor"

def _sanitize_text(text: str) -> str:
    import re

    replacements = {
        r"cancer": "serious condition",
        r"tumor": "abnormal growth",
        r"malignant": "high-risk condition",
        r"कैंसर": "गंभीर बीमारी",
    }

    for pattern, replacement in replacements.items():
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)

    return text

async def _ask_symptom(sender: str, scan_type: str, step: int) -> None:
    """Send one symptom question with quick-reply buttons."""
    q = SYMPTOM_QUESTIONS[scan_type][step]
    hi_opts = q["options_hi"]
    en_opts = q["options_en"]

    # Build buttons (max 3 per WhatsApp limitation)
    buttons = [
        {"id": f"sym_{q['id']}_{i}", "title": f"{hi_opts[i]} / {en_opts[i]}"[:20]}
        for i in range(min(3, len(hi_opts)))
    ]

    text = f"❓ {q['hi']}\n{q['en']}"
    await send_buttons(sender, text, buttons)


async def _deliver_pdf(sender: str) -> None:
    """Generate and send PDF for a completed screening."""
    sess = _session(sender)
    report_data = sess.get("report_data")
    if not report_data:
        await send_message(sender, "कोई pending रिपोर्ट नहीं। / No pending report.")
        return

    phone_hash = report_data["phone_hash"]
    patient_id = sender[-4:] if len(sender) >= 4 else sender
    tmp_path   = f"/tmp/report_{phone_hash[:8]}.pdf"

    try:
        # Generate Gemini narrative for the PDF
        narrative = await generate_pdf_narrative(
            scan_type=report_data["scan_type"],
            risk_level=report_data["risk_level"],
            confidence=report_data["confidence"],
            symptoms=report_data.get("symptoms"),
            gemini_finding=report_data.get("explanation_en", ""),
        )
        pdf_data = {
            **report_data,
            "report_id":       f"WA-{report_data['phone_hash'][:8].upper()}",
            "user_name":       "WhatsApp User",
            "phone_masked":    "XXXXXXXXXX",
            "explanation_local": report_data.get("explanation_hi", ""),
            **narrative,
        }

        pdf_bytes = generate_report(pdf_data)
        with open(tmp_path, "wb") as f:
            f.write(pdf_bytes)

        await send_document(
            sender,
            pdf_bytes,
            filename=f"JanArogya_Report_{patient_id}.pdf",
            caption="📄 आपकी AI स्क्रीनिंग रिपोर्ट / Your AI screening report",
        )

        doc_id = await save_screening(
            phone=sender,
            risk_level=report_data["risk_level"],
            confidence=report_data["confidence"],
            hindi_message=report_data.get("explanation_hi", ""),
            english_message=report_data.get("explanation_en", ""),
        )
        if doc_id:
            pdf_url = await upload_pdf(pdf_bytes, sender, doc_id)
            if pdf_url:
                from services.firebase_service import _db
                db = _db()
                if db:
                    db.collection("screenings").document(doc_id).update(
                        {"pdf_url": pdf_url, "pdf_sent": True}
                    )

        _reset(sender)

    except Exception as exc:
        logger.error("PDF delivery failed for %s: %s", sender, exc)
        await send_message(sender, "रिपोर्ट बनाने में समस्या हुई। / Error generating report.")
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


# ── Main handlers ──────────────────────────────────────────────────────────────

async def handle_text(sender: str, text: str) -> None:
    sess  = _session(sender)
    state = sess["state"]
    t     = text.strip().lower()

    logger.info("handle_text: sender=%s state=%s text=%r", sender, state, text[:60])

    # YES → deliver PDF
    if t in ("yes", "हाँ", "han", "haan", "y") and state == DONE:
        await _deliver_pdf(sender)
        return

    # User selected scan type via text (or button callback)
    if t in ("oral", "skin", "👄 oral (मुँह)", "🖐 skin (त्वचा)") or state == TYPE_SELECT:
        scan_type = None
        if "oral" in t or "मुँह" in t or "👄" in t:
            scan_type = "oral"
        elif "skin" in t or "त्वचा" in t or "🖐" in t:
            scan_type = "skin"

        if scan_type:
            sess["scan_type"] = scan_type
            sess["state"]     = SYMPTOM_1
            await _ask_symptom(sender, scan_type, 0)
            return

    # Symptom answers
    if state == SYMPTOM_1:
        q_id = SYMPTOM_QUESTIONS[sess["scan_type"]][0]["id"]
        sess["symptoms"][q_id] = text
        sess["state"] = SYMPTOM_2
        await _ask_symptom(sender, sess["scan_type"], 1)
        return

    if state == SYMPTOM_2:
        q_id = SYMPTOM_QUESTIONS[sess["scan_type"]][1]["id"]
        sess["symptoms"][q_id] = text
        sess["state"] = SYMPTOM_3
        await _ask_symptom(sender, sess["scan_type"], 2)
        return

    if state == SYMPTOM_3:
        q_id = SYMPTOM_QUESTIONS[sess["scan_type"]][2]["id"]
        sess["symptoms"][q_id] = text
        sess["state"] = AWAIT_IMAGE
        await send_message(sender, _AWAIT_PHOTO[sess["scan_type"]])
        return

    # Default: restart flow
    _reset(sender)
    await send_message(sender, _WELCOME)
    await send_buttons(sender, "कृपया चुनें / Please choose:", _TYPE_BUTTONS)
    _session(sender)["state"] = TYPE_SELECT


async def handle_image(sender: str, image_id: str) -> None:
    sess = _session(sender)
    logger.info("handle_image: sender=%s state=%s media=%s", sender, sess["state"], image_id)

    # If user sends image before going through the flow, prompt them
    if sess["state"] not in (AWAIT_IMAGE, IDLE):
        await send_message(
            sender,
            "पहले लक्षण बताएं, फिर तस्वीर भेजें। / Please answer the symptom questions first."
        )
        return

    # If IDLE and image comes in — accept it (old behaviour, no symptoms)
    scan_type = sess.get("scan_type") or "oral"

    # 1. Download
    image_bytes = await download_media(image_id)

    # 2. Quality check
    quality = await check_image_quality(image_bytes)
    if quality["quality"] != "GOOD":
        reason = quality.get("reason", "तस्वीर साफ नहीं है")
        await send_message(
            sender,
            f"📷 तस्वीर ठीक नहीं: {reason}\n"
            "अच्छी रोशनी में दोबारा लें।\n\n"
            f"Photo issue: {reason}\nPlease retake in good lighting.",
        )
        return

    # 3. TFLite inference
    risk_level, confidence = run_inference(image_bytes, scan_type)

    # 4. Gemini with symptoms context
    symptoms  = sess.get("symptoms") or {}
    analysis  = await analyze_image_with_gemini(
        image_bytes=image_bytes,
        risk_level=risk_level,
        confidence=confidence,
        scan_type=scan_type,
        symptoms=symptoms,
    )

    # 5. Nearest center
    nearest_center = {
        "name":     "Nearest Screening Center",
        "address":  "Search hospitals near you",
        "maps_link": _DEFAULT_MAPS_LINK,
        "distance": "",
    }

    # 6. Build WhatsApp reply
    risk_emoji = "🔴" if risk_level == "HIGH_RISK" else "🟢" if risk_level == "LOW_RISK" else "⚠️"
    reply = (
        f"{risk_emoji} *JanArogya स्क्रीनिंग रिपोर्ट*\n\n"
        f"🧠 *AI Model:* {risk_level.replace('_', ' ')} ({round(confidence*100)}%)\n\n"
        f"{analysis['hi']}\n\n"
        f"📍 *नजदीकी केंद्र:* {_DEFAULT_MAPS_LINK}\n\n"
        f"_{DISCLAIMER['hi']}_"
    )
    reply = _sanitize_text(reply)
    check_for_banned_words(reply)
    await send_message(sender, reply)

    # 7. Store report + move to DONE
    phone_hash = hashlib.sha256(sender.encode()).hexdigest()
    now = datetime.now()
    sess["report_data"] = {
        "phone_hash":     phone_hash,
        "scan_date":      now.strftime("%d/%m/%Y"),
        "scan_time":      now.strftime("%I:%M %p"),
        "scan_type":      scan_type,
        "risk_level":     risk_level,
        "confidence":     confidence,
        "explanation_en": analysis["en"],
        "explanation_hi": analysis["hi"],
        "local_language": "hi",
        "symptoms":       symptoms,
        "centers":        [nearest_center],
    }
    sess["state"] = DONE

    await send_message(sender, _PDF_OFFER)
    logger.info("handle_image done: sender=%s risk=%s conf=%.2f", sender, risk_level, confidence)


async def handle_audio(sender: str, audio_id: str) -> None:
    logger.info("handle_audio: sender=%s", sender)
    await send_message(
        sender,
        "कृपया तस्वीर भेजें 📷 / Please send a photo for screening."
    )
