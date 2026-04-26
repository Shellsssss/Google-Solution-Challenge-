"""In-memory volunteer profiles + task store with proximity-based smart matching."""
import math
import uuid
from datetime import datetime, timezone
from typing import Optional


# ── In-memory stores ──────────────────────────────────────────────────────────
_volunteers: dict[str, dict] = {}   # volunteer_id → profile
_tasks: dict[str, dict] = {}        # task_id      → task


# ── Haversine ─────────────────────────────────────────────────────────────────

def _haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Return great-circle distance in km."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ── Volunteer CRUD ────────────────────────────────────────────────────────────

def register_volunteer(
    name: str,
    phone: str = "",
    org: str = "Individual",
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    skills: Optional[list[str]] = None,
) -> dict:
    vid = str(uuid.uuid4())
    profile = {
        "volunteer_id": vid,
        "name": name,
        "phone": phone,
        "org": org or "Individual",
        "lat": lat,
        "lng": lng,
        "skills": skills or [],
        "available": True,
        "registered_at": _now(),
        "accepted_task_ids": [],
    }
    _volunteers[vid] = profile
    return profile


def get_volunteer(vid: str) -> Optional[dict]:
    return _volunteers.get(vid)


def get_all_volunteers() -> list[dict]:
    return list(_volunteers.values())


def update_volunteer_availability(vid: str, available: bool) -> bool:
    if vid not in _volunteers:
        return False
    _volunteers[vid]["available"] = available
    return True


# ── Task generation ───────────────────────────────────────────────────────────

def generate_tasks_from_community(community_zones: list[dict]) -> list[dict]:
    """Create tasks for zones with needs_screening_camp=True that don't have an open/assigned task yet."""
    created = []
    existing_cities = {t["city"] for t in _tasks.values() if t["status"] in ("open", "assigned")}

    for zone in community_zones:
        if not zone.get("needs_screening_camp"):
            continue
        city = zone.get("city", "")
        if not city or city in existing_cities:
            continue

        # Determine task type based on scan data
        if zone.get("oral", 0) > zone.get("skin", 0):
            task_type = "screening_camp"
        elif zone.get("total", 0) >= 10:
            task_type = "awareness_drive"
        else:
            task_type = "patient_followup"

        urgency = "HIGH" if zone.get("high_risk_pct", 0) > 60 else "MEDIUM"
        tid = str(uuid.uuid4())
        task = {
            "task_id": tid,
            "city": city,
            "state": zone.get("state", ""),
            "lat": zone.get("lat") or 0.0,
            "lng": zone.get("lng") or 0.0,
            "task_type": task_type,
            "urgency": urgency,
            "status": "open",
            "assigned_to": "",
            "assigned_name": "",
            "created_at": _now(),
            "completed_at": "",
            "notes": "",
            "high_risk_pct": zone.get("high_risk_pct", 0),
            "total_scans": zone.get("total", 0),
        }
        _tasks[tid] = task
        existing_cities.add(city)
        created.append(task)

    return created


# ── Task queries ──────────────────────────────────────────────────────────────

def get_all_tasks() -> list[dict]:
    return sorted(_tasks.values(), key=lambda t: (t["status"] != "open", t["urgency"] != "HIGH"))


def get_open_tasks(volunteer_lat: Optional[float] = None, volunteer_lng: Optional[float] = None) -> list[dict]:
    """Return open tasks, optionally annotated with distance from volunteer location."""
    open_tasks = [t for t in _tasks.values() if t["status"] == "open"]
    if volunteer_lat is not None and volunteer_lng is not None:
        for t in open_tasks:
            if t["lat"] and t["lng"]:
                t = dict(t)
                t["distance_km"] = round(_haversine(volunteer_lat, volunteer_lng, t["lat"], t["lng"]), 1)
        open_tasks = sorted(open_tasks, key=lambda t: t.get("distance_km", 9999))
    else:
        open_tasks = sorted(open_tasks, key=lambda t: t["urgency"] != "HIGH")
    return open_tasks


def get_volunteer_tasks(vid: str) -> dict:
    """Return tasks split by status for a specific volunteer."""
    profile = _volunteers.get(vid)
    if not profile:
        return {"available": [], "accepted": [], "completed": []}

    accepted_ids = set(profile.get("accepted_task_ids", []))

    accepted = [t for t in _tasks.values() if t["task_id"] in accepted_ids and t["status"] == "assigned"]
    completed = [t for t in _tasks.values() if t["task_id"] in accepted_ids and t["status"] == "completed"]

    # Open tasks near the volunteer (top 10 by distance)
    v_lat, v_lng = profile.get("lat"), profile.get("lng")
    open_tasks = get_open_tasks(v_lat, v_lng)[:10]

    return {
        "available": open_tasks,
        "accepted": accepted,
        "completed": completed,
    }


# ── Task assignment ───────────────────────────────────────────────────────────

def accept_task(task_id: str, volunteer_id: str) -> bool:
    task = _tasks.get(task_id)
    volunteer = _volunteers.get(volunteer_id)
    if not task or not volunteer:
        return False
    if task["status"] != "open":
        return False

    task["status"] = "assigned"
    task["assigned_to"] = volunteer_id
    task["assigned_name"] = volunteer["name"]

    if task_id not in volunteer["accepted_task_ids"]:
        volunteer["accepted_task_ids"].append(task_id)

    return True


def decline_task(task_id: str, volunteer_id: str) -> bool:
    task = _tasks.get(task_id)
    volunteer = _volunteers.get(volunteer_id)
    if not task or not volunteer:
        return False

    if task["assigned_to"] == volunteer_id:
        task["status"] = "open"
        task["assigned_to"] = ""
        task["assigned_name"] = ""

    if task_id in volunteer["accepted_task_ids"]:
        volunteer["accepted_task_ids"].remove(task_id)

    return True


def complete_task(task_id: str, volunteer_id: str, notes: str = "") -> bool:
    task = _tasks.get(task_id)
    volunteer = _volunteers.get(volunteer_id)
    if not task or not volunteer:
        return False
    if task.get("assigned_to") != volunteer_id:
        return False

    task["status"] = "completed"
    task["completed_at"] = _now()
    task["notes"] = notes
    return True


# ── Smart matching ────────────────────────────────────────────────────────────

def find_nearby_volunteers(lat: float, lng: float, radius_km: float = 200) -> list[dict]:
    """Return volunteers within radius_km sorted by distance, with distance_km field."""
    results = []
    for v in _volunteers.values():
        if not v.get("lat") or not v.get("lng"):
            continue
        dist = _haversine(lat, lng, v["lat"], v["lng"])
        if dist <= radius_km:
            results.append({**v, "distance_km": round(dist, 1)})
    return sorted(results, key=lambda x: x["distance_km"])
