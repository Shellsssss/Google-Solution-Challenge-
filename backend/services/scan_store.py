"""In-memory scan history store with pre-seeded realistic data."""
import random
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

# ── In-memory store ───────────────────────────────────────────────────────────
_scans: list[dict] = []

# ── Seed helpers ──────────────────────────────────────────────────────────────

_CITIES = [
    ("Mumbai", "Maharashtra", 19.0760, 72.8777),
    ("Delhi", "Delhi", 28.7041, 77.1025),
    ("Bengaluru", "Karnataka", 12.9716, 77.5946),
    ("Chennai", "Tamil Nadu", 13.0827, 80.2707),
    ("Hyderabad", "Telangana", 17.3850, 78.4867),
    ("Kolkata", "West Bengal", 22.5726, 88.3639),
    ("Pune", "Maharashtra", 18.5204, 73.8567),
    ("Ahmedabad", "Gujarat", 23.0225, 72.5714),
    ("Jaipur", "Rajasthan", 26.9124, 75.7873),
    ("Lucknow", "Uttar Pradesh", 26.8467, 80.9462),
]

_RISK_LEVELS = ["LOW_RISK", "HIGH_RISK", "INVALID"]
_RISK_WEIGHTS = [0.55, 0.35, 0.10]
_SCAN_TYPES = ["oral", "skin", "oral", "skin", "oral"]  # weighted toward oral
_LANGUAGES = ["en", "hi", "ta", "te"]
_LANG_WEIGHTS = [0.30, 0.35, 0.20, 0.15]

_CONCERNS = {
    "LOW_RISK": [
        "The area looks normal. Keep monitoring and visit a doctor if anything changes.",
        "No immediate concern detected. Continue regular self-checks.",
        "Looks healthy. Schedule a routine check-up with your local doctor.",
    ],
    "HIGH_RISK": [
        "We recommend seeing a doctor soon, within the next 1-2 days.",
        "Please visit your nearest health centre as soon as possible.",
        "This area needs attention. Consult a doctor without delay.",
    ],
    "INVALID": [
        "The photo was not clear enough. Please retake with better lighting.",
        "Image quality was poor. Try again in a well-lit area.",
        "Could not analyse the image. Please ensure the photo is in focus.",
    ],
}

_EXPLANATIONS_EN = {
    "LOW_RISK": [
        "Your photo shows a normal-looking area with no obvious signs of concern. The AI noticed no unusual changes.",
        "The area in your photo appears healthy. No alarming features were detected by the AI.",
        "Your photo looks reassuring. The tissue appears normal and no patches of concern were found.",
    ],
    "HIGH_RISK": [
        "Your photo shows some changes in the area that need a doctor's attention soon.",
        "The area in your photo has some features the AI flagged for further evaluation.",
        "Your photo shows something the AI found unusual. Please see a doctor promptly.",
    ],
    "INVALID": [
        "The photo was not clear enough for a proper check. Please retake with better lighting.",
        "The AI could not analyse this image properly due to poor image quality.",
        "Image quality prevented a proper analysis. Try again in natural light.",
    ],
}

# Demo user IDs — will be populated from auth_service at runtime but we seed with known ones
_DEMO_USER_IDS = [
    "demo-patient-001",
    "demo-patient-002",
    "demo-patient-003",
    "demo-doctor-001",
]


def _random_date_in_last_90_days() -> datetime:
    days_ago = random.randint(0, 90)
    hours_ago = random.randint(0, 23)
    return datetime.now(timezone.utc) - timedelta(days=days_ago, hours=hours_ago)


def _seed_scans(n: int = 50) -> None:
    """Pre-seed realistic scan records."""
    for _ in range(n):
        risk = random.choices(_RISK_LEVELS, weights=_RISK_WEIGHTS, k=1)[0]
        scan_type = random.choice(_SCAN_TYPES)
        language = random.choices(_LANGUAGES, weights=_LANG_WEIGHTS, k=1)[0]
        city_data = random.choice(_CITIES)
        city, state, base_lat, base_lng = city_data

        # Jitter coordinates slightly
        lat = base_lat + random.uniform(-0.05, 0.05)
        lng = base_lng + random.uniform(-0.05, 0.05)

        conf_ranges = {
            "LOW_RISK": (0.72, 0.97),
            "HIGH_RISK": (0.65, 0.95),
            "INVALID": (0.50, 0.75),
        }
        lo, hi = conf_ranges[risk]
        confidence = round(random.uniform(lo, hi), 4)

        explanation_en = random.choice(_EXPLANATIONS_EN[risk])
        concern = random.choice(_CONCERNS[risk])
        created_at = _random_date_in_last_90_days()

        scan_id = str(uuid.uuid4())
        _scans.append({
            "id": scan_id,
            "user_id": random.choice(_DEMO_USER_IDS),
            "scan_type": scan_type,
            "risk_level": risk,
            "confidence": confidence,
            "language": language,
            "explanation_en": explanation_en,
            "concern": concern,
            "symptoms": {},
            "lat": round(lat, 6),
            "lng": round(lng, 6),
            "city": city,
            "state": state,
            "created_at": created_at.isoformat(),
            "deleted": False,
        })


_seed_scans(50)


# ── Public API ─────────────────────────────────────────────────────────────────

def save_scan(scan_data: dict) -> str:
    """Append a new scan and return its ID."""
    scan_id = str(uuid.uuid4())
    scan_data["id"] = scan_id
    scan_data.setdefault("deleted", False)
    scan_data.setdefault("created_at", datetime.now(timezone.utc).isoformat())
    _scans.append(scan_data)
    return scan_id


def get_scan(scan_id: str) -> Optional[dict]:
    """Return a single scan by ID, or None."""
    for s in _scans:
        if s["id"] == scan_id and not s.get("deleted"):
            return s
    return None


def get_scans(
    user_id: Optional[str] = None,
    limit: int = 10,
    offset: int = 0,
    risk_level: Optional[str] = None,
    scan_type: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
) -> dict:
    """Return a paginated list of scans with optional filters."""
    items = [s for s in _scans if not s.get("deleted")]

    if user_id:
        items = [s for s in items if s.get("user_id") == user_id]
    if risk_level and risk_level != "all":
        items = [s for s in items if s.get("risk_level") == risk_level]
    if scan_type and scan_type != "all":
        items = [s for s in items if s.get("scan_type") == scan_type]
    if from_date:
        items = [s for s in items if s.get("created_at", "") >= from_date]
    if to_date:
        items = [s for s in items if s.get("created_at", "") <= to_date + "Z"]

    # Sort by created_at descending
    items.sort(key=lambda s: s.get("created_at", ""), reverse=True)
    total = len(items)
    page = items[offset: offset + limit]

    return {"items": page, "total": total, "limit": limit, "offset": offset}


def soft_delete_scan(scan_id: str) -> bool:
    """Mark a scan as deleted. Returns True if found."""
    for s in _scans:
        if s["id"] == scan_id:
            s["deleted"] = True
            return True
    return False


def get_dashboard_stats() -> dict:
    """Compute full dashboard statistics from in-memory scans."""
    from datetime import date

    active = [s for s in _scans if not s.get("deleted")]
    now = datetime.now(timezone.utc)
    today = now.date()
    week_start = today - timedelta(days=7)
    month_start = today - timedelta(days=30)

    total = len(active)
    scans_today = 0
    scans_week = 0
    scans_month = 0
    low_risk = 0
    high_risk = 0
    invalid = 0
    total_confidence = 0.0
    conf_count = 0

    by_type: dict[str, int] = {"oral": 0, "skin": 0, "other": 0}
    by_language: dict[str, int] = {"en": 0, "hi": 0, "ta": 0, "te": 0}
    city_counts: dict[str, int] = {}
    day_data: dict[str, dict] = {}

    for s in active:
        try:
            dt = datetime.fromisoformat(s["created_at"].replace("Z", "+00:00"))
            d = dt.date()
        except Exception:
            continue

        if d == today:
            scans_today += 1
        if d >= week_start:
            scans_week += 1
        if d >= month_start:
            scans_month += 1

        rl = s.get("risk_level", "")
        if rl == "LOW_RISK":
            low_risk += 1
        elif rl == "HIGH_RISK":
            high_risk += 1
        elif rl == "INVALID":
            invalid += 1

        conf = s.get("confidence", 0)
        if conf:
            total_confidence += conf
            conf_count += 1

        st = s.get("scan_type", "other")
        by_type[st] = by_type.get(st, 0) + 1

        lang = s.get("language", "en")
        by_language[lang] = by_language.get(lang, 0) + 1

        city = s.get("city", "Unknown")
        city_counts[city] = city_counts.get(city, 0) + 1

        # Daily data for last 30 days
        if d >= month_start:
            ds = d.isoformat()
            if ds not in day_data:
                day_data[ds] = {"date": ds, "count": 0, "high_risk": 0}
            day_data[ds]["count"] += 1
            if rl == "HIGH_RISK":
                day_data[ds]["high_risk"] += 1

    top_locations = sorted(
        [{"city": c, "count": n} for c, n in city_counts.items()],
        key=lambda x: x["count"],
        reverse=True,
    )[:10]

    scans_by_day = sorted(day_data.values(), key=lambda x: x["date"])

    return {
        "total_scans": total,
        "scans_today": scans_today,
        "scans_this_week": scans_week,
        "scans_this_month": scans_month,
        "low_risk_count": low_risk,
        "high_risk_count": high_risk,
        "invalid_count": invalid,
        "low_risk_percentage": round(low_risk / total * 100, 1) if total else 0.0,
        "high_risk_percentage": round(high_risk / total * 100, 1) if total else 0.0,
        "scans_by_day": scans_by_day,
        "scans_by_type": by_type,
        "scans_by_language": by_language,
        "top_locations": top_locations,
        "average_confidence": round(total_confidence / conf_count, 4) if conf_count else 0.0,
    }


def get_community_data() -> list[dict]:
    """Return city-level community health insights with resource suggestion flags."""
    active = [s for s in _scans if not s.get("deleted") and s.get("city") and s["city"] not in ("", "Unknown")]
    city_agg: dict[str, dict] = {}

    for s in active:
        city = s.get("city", "Unknown")
        state = s.get("state", "")
        if city not in city_agg:
            city_agg[city] = {
                "city": city,
                "state": state,
                "lat": s.get("lat", 0),
                "lng": s.get("lng", 0),
                "total": 0,
                "high_risk": 0,
                "oral": 0,
                "skin": 0,
                "handled": _handled_zones.get(city, False),
                "handled_by": _handled_zones_meta.get(city, {}).get("volunteer", ""),
                "handled_at": _handled_zones_meta.get(city, {}).get("at", ""),
            }
        city_agg[city]["total"] += 1
        if s.get("risk_level") == "HIGH_RISK":
            city_agg[city]["high_risk"] += 1
        st = s.get("scan_type", "other")
        if st in ("oral", "skin"):
            city_agg[city][st] += 1

    result = []
    for city, d in city_agg.items():
        total = d["total"]
        risk_pct = d["high_risk"] / total if total else 0
        risk_zone = "HIGH" if risk_pct > 0.4 else ("MEDIUM" if risk_pct > 0.2 else "LOW")
        needs_camp = risk_pct > 0.4 and total >= 5
        result.append({
            **d,
            "high_risk_pct": round(risk_pct * 100, 1),
            "risk_zone": risk_zone,
            "needs_screening_camp": needs_camp,
        })

    return sorted(result, key=lambda x: x["high_risk_pct"], reverse=True)


# ── Volunteer zone tracking ───────────────────────────────────────────────────
_handled_zones: dict[str, bool] = {}
_handled_zones_meta: dict[str, dict] = {}


def mark_zone_handled(city: str, volunteer_name: str = "") -> bool:
    """Mark a city zone as handled by a volunteer. Returns True."""
    from datetime import datetime, timezone
    _handled_zones[city] = True
    _handled_zones_meta[city] = {
        "volunteer": volunteer_name,
        "at": datetime.now(timezone.utc).isoformat(),
    }
    return True


def get_heatmap_data() -> list[dict]:
    """Return aggregated lat/lng clusters for heatmap rendering."""
    active = [s for s in _scans if not s.get("deleted") and s.get("lat") and s.get("lng")]
    # Group by city
    city_agg: dict[str, dict] = {}
    for s in active:
        city = s.get("city", "Unknown")
        if city not in city_agg:
            city_agg[city] = {
                "lat": s["lat"],
                "lng": s["lng"],
                "count": 0,
                "high_risk": 0,
            }
        city_agg[city]["count"] += 1
        if s.get("risk_level") == "HIGH_RISK":
            city_agg[city]["high_risk"] += 1

    result = []
    for city, data in city_agg.items():
        result.append({
            "lat": data["lat"],
            "lng": data["lng"],
            "count": data["count"],
            "risk_level": "HIGH_RISK" if data["high_risk"] > data["count"] // 2 else "LOW_RISK",
        })
    return result
