"""
PDF report generator for JanArogya screening results.
A4 portrait layout with Gemini-generated personalised narrative.
Fonts: Noto Sans Devanagari (HI), Noto Sans Tamil (TA), Noto Sans Telugu (TE).
"""
import io
import logging
import os
import urllib.request
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

logger = logging.getLogger(__name__)

# ── Page geometry ─────────────────────────────────────────────────────────────
PAGE_W, PAGE_H = A4
MARGIN     = 42.5
CONTENT_W  = PAGE_W - 2 * MARGIN

# ── Palette ───────────────────────────────────────────────────────────────────
C_NAVY   = colors.HexColor("#1E3A5F")
C_TEAL   = colors.HexColor("#0D9488")
C_WHITE  = colors.white
C_BLACK  = colors.black
C_GRAY   = colors.HexColor("#616161")
C_LGRAY  = colors.HexColor("#F5F5F5")
C_YELLOW = colors.HexColor("#FFF8E1")
C_YAMBER = colors.HexColor("#F9A825")
C_GREEN  = colors.HexColor("#059669")
C_RED    = colors.HexColor("#DC2626")
C_ORANGE = colors.HexColor("#D97706")

RISK_COLORS = {
    "HIGH_RISK": (C_RED,    colors.HexColor("#FEE2E2")),
    "LOW_RISK":  (C_GREEN,  colors.HexColor("#D1FAE5")),
    "INVALID":   (C_ORANGE, colors.HexColor("#FEF3C7")),
}
RISK_LABELS = {
    "HIGH_RISK": "HIGH RISK — See a Doctor Soon",
    "LOW_RISK":  "LOW RISK — Continue Monitoring",
    "INVALID":   "INVALID — Photo Not Suitable",
}
URGENCY_COLORS = {
    "URGENT":  C_RED,
    "SOON":    C_ORANGE,
    "ROUTINE": C_GREEN,
}
URGENCY_LABELS = {
    "URGENT":  "URGENT — Visit doctor within 48 hours",
    "SOON":    "SOON — Visit doctor within 1 week",
    "ROUTINE": "ROUTINE — Next scheduled check-up",
}

# ── Font setup ────────────────────────────────────────────────────────────────
ASSETS_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "assets"))

FONTS = {
    "hi": {
        "name": "NotoDevanagari",
        "path": os.path.join(ASSETS_DIR, "NotoSansDevanagari.ttf"),
        "url":  "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Regular.ttf",
    },
    "ta": {
        "name": "NotoTamil",
        "path": os.path.join(ASSETS_DIR, "NotoSansTamil.ttf"),
        "url":  "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansTamil/NotoSansTamil-Regular.ttf",
    },
    "te": {
        "name": "NotoTelugu",
        "path": os.path.join(ASSETS_DIR, "NotoSansTelugu.ttf"),
        "url":  "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansTelugu/NotoSansTelugu-Regular.ttf",
    },
}
_font_ready: dict[str, bool] = {}


def _setup_font(lang: str) -> bool:
    if lang in _font_ready:
        return _font_ready[lang]
    if lang not in FONTS:
        return True
    info = FONTS[lang]
    os.makedirs(ASSETS_DIR, exist_ok=True)
    if not os.path.exists(info["path"]):
        try:
            urllib.request.urlretrieve(info["url"], info["path"])
        except Exception as exc:
            logger.warning("Font download failed for %s: %s", lang, exc)
            _font_ready[lang] = False
            return False
    try:
        pdfmetrics.registerFont(TTFont(info["name"], info["path"]))
        _font_ready[lang] = True
    except Exception as exc:
        logger.warning("Font registration failed for %s: %s", lang, exc)
        _font_ready[lang] = False
    return _font_ready[lang]


def _get_font(lang: str) -> str:
    if lang in FONTS and _setup_font(lang):
        return FONTS[lang]["name"]
    return "Helvetica"


# ── Text helpers ──────────────────────────────────────────────────────────────

def _wrap(c: canvas.Canvas, text: str, max_w: float, font: str, size: float) -> list[str]:
    words = text.split()
    lines: list[str] = []
    cur: list[str] = []
    cur_w = 0.0
    for word in words:
        w   = c.stringWidth(word, font, size)
        gap = c.stringWidth(" ", font, size) if cur else 0.0
        if cur and cur_w + gap + w > max_w:
            lines.append(" ".join(cur))
            cur, cur_w = [word], w
        else:
            cur.append(word)
            cur_w += gap + w
    if cur:
        lines.append(" ".join(cur))
    return lines or [""]


def _block(c: canvas.Canvas, text: str, x: float, y: float,
           max_w: float, font: str, size: float,
           leading: float = 13.0, color=colors.black) -> float:
    if not text:
        return y
    c.setFillColor(color)
    c.setFont(font, size)
    for line in _wrap(c, text, max_w, font, size):
        c.drawString(x, y, line)
        y -= leading
    return y


def _section_heading(c: canvas.Canvas, label: str, y: float,
                     x: float = None, width: float = None) -> float:
    x = x or MARGIN
    width = width or CONTENT_W
    c.setFont("Helvetica-Bold", 8.5)
    c.setFillColor(C_NAVY)
    c.drawString(x, y, label)
    y -= 3
    c.setStrokeColor(C_NAVY)
    c.setLineWidth(0.4)
    c.line(x, y, x + width, y)
    return y - 9


def _bullet_list(c: canvas.Canvas, items: list[str], x: float, y: float,
                 max_w: float, font: str = "Helvetica", size: float = 8.0,
                 color=C_BLACK, leading: float = 12.0) -> float:
    for item in items:
        if not item:
            continue
        # Draw bullet
        c.setFillColor(C_TEAL)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(x, y, "\u2022")
        # Draw text
        c.setFillColor(color)
        c.setFont(font, size)
        y = _block(c, item, x + 12, y, max_w - 12, font, size,
                   leading=leading, color=color)
        y -= 3
    return y


# ── Main generator ────────────────────────────────────────────────────────────

def generate_report(data: dict) -> bytes:
    """Build A4 screening report with Gemini narrative. Returns PDF bytes."""
    for lang in ("hi", "ta", "te"):
        _setup_font(lang)

    # Extract
    report_id   = data.get("report_id", "JA-XXXXXXXX")
    user_name   = data.get("user_name", "Anonymous") or "Anonymous"
    phone       = data.get("phone_masked", "XXXXXXXXXX") or "XXXXXXXXXX"
    scan_date   = data.get("scan_date", datetime.now().strftime("%d/%m/%Y"))
    scan_time   = data.get("scan_time", datetime.now().strftime("%I:%M %p"))
    scan_type   = (data.get("scan_type") or "oral").title()
    risk_level  = data.get("risk_level", "INVALID")
    confidence  = float(data.get("confidence", 0.0))
    local_lang  = data.get("local_language", "en")

    # Gemini narrative
    summary_en  = data.get("summary_en") or data.get("explanation_en", "")
    summary_loc = data.get(f"summary_{local_lang}") or data.get("explanation_local", "")
    next_steps  = data.get("next_steps", [])
    tell_doctor = data.get("tell_doctor", [])
    lifestyle   = data.get("lifestyle_tip", "")
    urgency     = data.get("urgency", "ROUTINE")

    qas         = data.get("questions_and_answers", [])
    img_bytes   = data.get("image_bytes")
    centres     = data.get("nearest_centres", []) or []

    risk_border, risk_bg = RISK_COLORS.get(risk_level, RISK_COLORS["INVALID"])
    local_font = _get_font(local_lang)

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    c.setTitle(f"JanArogya Screening Report — {report_id}")

    # ══════════════════════════════════════════════════════════════════════════
    # HEADER
    # ══════════════════════════════════════════════════════════════════════════
    HDR_H = 72.0
    c.setFillColor(C_NAVY)
    c.rect(0, PAGE_H - HDR_H, PAGE_W, HDR_H, fill=1, stroke=0)

    # Teal accent stripe
    c.setFillColor(C_TEAL)
    c.rect(0, PAGE_H - HDR_H, 6, HDR_H, fill=1, stroke=0)

    c.setFillColor(C_WHITE)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(MARGIN, PAGE_H - 26, "JanArogya")
    c.setFont("Helvetica", 10)
    c.drawString(MARGIN, PAGE_H - 40, "\u091C\u0928\u0906\u0930\u094B\u0917\u094D\u092F")
    c.setFont("Helvetica-Oblique", 8)
    c.drawString(MARGIN, PAGE_H - 53, "AI-Powered Cancer Screening  |  Serving Rural India")

    c.setFont("Helvetica", 8)
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 22, f"Report ID: {report_id}")
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 34, f"Date: {scan_date}  {scan_time}")
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 46, f"Scan Type: {scan_type}")
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 58, f"Patient: {user_name}")

    y = PAGE_H - HDR_H - 6
    c.setStrokeColor(colors.HexColor("#E5E7EB"))
    c.setLineWidth(0.4)
    c.line(MARGIN, y, PAGE_W - MARGIN, y)
    y -= 8

    # ══════════════════════════════════════════════════════════════════════════
    # DISCLAIMER
    # ══════════════════════════════════════════════════════════════════════════
    disc = ("IMPORTANT: This report is AI-generated and is NOT a medical diagnosis. "
            "Always consult a qualified doctor before making any health decision.")
    disc_lines = _wrap(c, disc, CONTENT_W - 24, "Helvetica-Oblique", 7.5)
    disc_h = len(disc_lines) * 11 + 14

    c.setFillColor(C_YELLOW)
    c.setStrokeColor(C_YAMBER)
    c.setLineWidth(1.0)
    c.roundRect(MARGIN, y - disc_h, CONTENT_W, disc_h, 4, fill=1, stroke=1)
    c.setFillColor(colors.HexColor("#92400E"))
    c.setFont("Helvetica-Bold", 8)
    c.drawString(MARGIN + 8, y - 10, "\u26a0  IMPORTANT DISCLAIMER")
    ty = y - 21
    c.setFont("Helvetica-Oblique", 7.5)
    for line in disc_lines:
        c.drawString(MARGIN + 8, ty, line)
        ty -= 11
    y -= disc_h + 10

    # ══════════════════════════════════════════════════════════════════════════
    # TWO-COLUMN LAYOUT
    # ══════════════════════════════════════════════════════════════════════════
    COL_L_W = CONTENT_W * 0.57
    COL_R_W = CONTENT_W * 0.43 - 8
    COL_R_X = MARGIN + COL_L_W + 8
    ly = y   # left column y
    ry = y   # right column y

    # ── LEFT: Patient info ────────────────────────────────────────────────────
    detail_lines = [
        f"Name:          {user_name}",
        f"Phone:         {phone}",
        f"Language:      {local_lang.upper()}",
        f"Scan Date:     {scan_date}  {scan_time}",
    ]
    box_h = len(detail_lines) * 13 + 16
    c.setFillColor(C_LGRAY)
    c.setStrokeColor(colors.HexColor("#E5E7EB"))
    c.setLineWidth(0.4)
    c.roundRect(MARGIN, ly - box_h, COL_L_W, box_h, 4, fill=1, stroke=1)
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(C_NAVY)
    c.drawString(MARGIN + 6, ly - 10, "PATIENT DETAILS")
    ty = ly - 22
    c.setFont("Helvetica", 8)
    c.setFillColor(C_BLACK)
    for line in detail_lines:
        c.drawString(MARGIN + 6, ty, line)
        ty -= 13
    ly -= box_h + 8

    # ── LEFT: Risk assessment ─────────────────────────────────────────────────
    risk_box_h = 68.0
    c.setFillColor(risk_bg)
    c.setStrokeColor(risk_border)
    c.setLineWidth(2.0)
    c.roundRect(MARGIN, ly - risk_box_h, COL_L_W, risk_box_h, 4, fill=1, stroke=1)

    c.setFillColor(risk_border)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(MARGIN + 10, ly - 20, RISK_LABELS.get(risk_level, risk_level))

    c.setFont("Helvetica", 8.5)
    c.setFillColor(C_GRAY)
    c.drawString(MARGIN + 10, ly - 34, f"AI Confidence: {confidence * 100:.1f}%")

    # Confidence bar
    bar_x, bar_y, bar_w, bar_h = MARGIN + 10, ly - 47, COL_L_W - 20, 7.0
    c.setFillColor(colors.HexColor("#E5E7EB"))
    c.roundRect(bar_x, bar_y, bar_w, bar_h, 3, fill=1, stroke=0)
    fill_w = bar_w * min(confidence, 1.0)
    if fill_w > 0:
        c.setFillColor(risk_border)
        c.roundRect(bar_x, bar_y, fill_w, bar_h, 3, fill=1, stroke=0)

    # Urgency badge
    urg_color = URGENCY_COLORS.get(urgency, C_ORANGE)
    urg_label = URGENCY_LABELS.get(urgency, urgency)
    c.setFillColor(urg_color)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(MARGIN + 10, ly - 60, f"\u23f0  {urg_label}")

    ly -= risk_box_h + 10

    # ── LEFT: AI Summary (English) ────────────────────────────────────────────
    ly = _section_heading(c, "AI SCREENING SUMMARY", ly)
    if summary_en:
        ly = _block(c, summary_en, MARGIN, ly, COL_L_W, "Helvetica", 8.5,
                    leading=13, color=C_BLACK)
        ly -= 4

    # Local language summary
    if summary_loc and local_lang != "en" and local_font != "Helvetica":
        c.setStrokeColor(colors.HexColor("#E5E7EB"))
        c.setLineWidth(0.4)
        c.line(MARGIN, ly, MARGIN + COL_L_W, ly)
        ly -= 8
        ly = _block(c, summary_loc, MARGIN, ly, COL_L_W, local_font, 8.5,
                    leading=13, color=C_GRAY)
        ly -= 4

    ly -= 4

    # ── LEFT: What to tell your doctor ───────────────────────────────────────
    if tell_doctor:
        ly = _section_heading(c, "WHAT TO TELL YOUR DOCTOR", ly)
        ly = _bullet_list(c, tell_doctor, MARGIN, ly, COL_L_W)
        ly -= 4

    # ── LEFT: Lifestyle tip ───────────────────────────────────────────────────
    if lifestyle:
        tip_lines = _wrap(c, lifestyle, COL_L_W - 20, "Helvetica-Oblique", 8)
        tip_h = len(tip_lines) * 12 + 14
        c.setFillColor(colors.HexColor("#EFF6FF"))
        c.setStrokeColor(colors.HexColor("#BFDBFE"))
        c.setLineWidth(0.5)
        c.roundRect(MARGIN, ly - tip_h, COL_L_W, tip_h, 4, fill=1, stroke=1)
        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(colors.HexColor("#1E40AF"))
        c.drawString(MARGIN + 8, ly - 10, "\U0001f4a1  HEALTH TIP")
        ty = ly - 21
        c.setFont("Helvetica-Oblique", 8)
        c.setFillColor(colors.HexColor("#1E40AF"))
        for line in tip_lines:
            c.drawString(MARGIN + 8, ty, line)
            ty -= 12
        ly -= tip_h + 6

    # ── RIGHT: Scanned image ──────────────────────────────────────────────────
    IMG_H = 115.0
    if img_bytes:
        try:
            img_reader = ImageReader(io.BytesIO(img_bytes))
            iy = ry - IMG_H
            c.setStrokeColor(colors.HexColor("#E5E7EB"))
            c.setLineWidth(0.5)
            c.roundRect(COL_R_X, iy, COL_R_W, IMG_H, 4, fill=0, stroke=1)
            c.drawImage(img_reader, COL_R_X + 2, iy + 2, COL_R_W - 4, IMG_H - 4,
                        preserveAspectRatio=True, mask="auto")
            c.setFont("Helvetica", 7)
            c.setFillColor(C_GRAY)
            c.drawCentredString(COL_R_X + COL_R_W / 2, iy - 8, "Submitted Image")
            ry = iy - 16
        except Exception as exc:
            logger.warning("Could not embed image: %s", exc)
    else:
        ry -= 8

    # ── RIGHT: Next steps ─────────────────────────────────────────────────────
    if next_steps:
        ry = _section_heading(c, "YOUR NEXT STEPS", ry, x=COL_R_X, width=COL_R_W)
        for i, step in enumerate(next_steps[:4], 1):
            if not step:
                continue
            # Numbered badge
            c.setFillColor(C_TEAL)
            c.circle(COL_R_X + 6, ry + 3, 5.5, fill=1, stroke=0)
            c.setFillColor(C_WHITE)
            c.setFont("Helvetica-Bold", 7)
            c.drawCentredString(COL_R_X + 6, ry + 0.5, str(i))
            # Step text
            c.setFillColor(C_BLACK)
            c.setFont("Helvetica", 8)
            ry = _block(c, step, COL_R_X + 16, ry, COL_R_W - 16, "Helvetica", 8,
                        leading=11, color=C_BLACK)
            ry -= 5

    ry -= 4

    # ── RIGHT: Patient Q&A ────────────────────────────────────────────────────
    if qas:
        ry = _section_heading(c, "PATIENT RESPONSES", ry, x=COL_R_X, width=COL_R_W)
        for qa in qas[:3]:
            q = qa.get("question", "")
            a = qa.get("answer", "")
            if q:
                ry = _block(c, f"Q: {q}", COL_R_X, ry, COL_R_W,
                            "Helvetica-Bold", 7.5, leading=10, color=C_NAVY)
            if a:
                ry = _block(c, f"A: {a}", COL_R_X, ry, COL_R_W,
                            "Helvetica", 7.5, leading=10, color=C_GRAY)
            ry -= 4

    # ══════════════════════════════════════════════════════════════════════════
    # NEAREST CENTRES (full width below both columns)
    # ══════════════════════════════════════════════════════════════════════════
    section_y = min(ly, ry) - 12
    if section_y < MARGIN + 70:
        section_y = MARGIN + 70

    if centres:
        section_y = _section_heading(c, "NEAREST CANCER SCREENING CENTRES", section_y)
        cw = (CONTENT_W - 8) / min(len(centres), 2)
        for i, ctr in enumerate(centres[:2]):
            bx = MARGIN + i * (cw + 8)
            bh = 52.0
            c.setFillColor(C_LGRAY)
            c.setStrokeColor(colors.HexColor("#E5E7EB"))
            c.setLineWidth(0.4)
            c.roundRect(bx, section_y - bh, cw, bh, 4, fill=1, stroke=1)

            c.setFont("Helvetica-Bold", 8)
            c.setFillColor(C_NAVY)
            c.drawString(bx + 6, section_y - 12, (ctr.get("name") or "")[:38])

            c.setFont("Helvetica", 7.5)
            c.setFillColor(C_GRAY)
            c.drawString(bx + 6, section_y - 23, (ctr.get("address") or "")[:48])

            dist = ctr.get("distance_km")
            if dist is not None:
                c.drawString(bx + 6, section_y - 34, f"Distance: {dist:.1f} km")
            ph = ctr.get("phone")
            if ph:
                c.drawString(bx + 6, section_y - 45, f"Phone: {ph}")

        section_y -= 52 + 8

    # ══════════════════════════════════════════════════════════════════════════
    # FOOTER
    # ══════════════════════════════════════════════════════════════════════════
    FOOTER_H = 42.0
    c.setFillColor(C_LGRAY)
    c.rect(0, 0, PAGE_W, FOOTER_H, fill=1, stroke=0)
    c.setFillColor(C_TEAL)
    c.rect(0, FOOTER_H, PAGE_W, 1.5, fill=1, stroke=0)

    c.setFont("Helvetica-Bold", 8.5)
    c.setFillColor(C_RED)
    c.drawString(MARGIN, FOOTER_H - 13, "\u260e  Cancer Helpline: 1800-11-2345   (Toll-Free, 24/7)")

    c.setFont("Helvetica-Oblique", 7.5)
    c.setFillColor(C_GRAY)
    c.drawCentredString(PAGE_W / 2, FOOTER_H - 13, "Consult a real doctor before taking any action")

    c.setFont("Helvetica", 7)
    c.setFillColor(C_GRAY)
    c.drawRightString(PAGE_W - MARGIN, FOOTER_H - 13, f"Generated by JanArogya  |  Report {report_id}")

    c.setFont("Helvetica", 6.5)
    c.setFillColor(C_GRAY)
    c.drawCentredString(PAGE_W / 2, FOOTER_H - 27,
                        "For screening purposes only — this is not a clinical diagnosis")

    c.save()
    return buf.getvalue()
