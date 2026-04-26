"""Volunteer coordination endpoints — registration, tasks, smart matching."""
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services import volunteer_store

router = APIRouter(prefix="/volunteer", tags=["volunteer"])
logger = logging.getLogger(__name__)


# ── Request models ────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    phone: str = ""
    org: str = "Individual"
    lat: Optional[float] = None
    lng: Optional[float] = None
    skills: list[str] = []


class TaskActionRequest(BaseModel):
    notes: str = ""


# ── Registration ──────────────────────────────────────────────────────────────

@router.post("/register")
def register(req: RegisterRequest):
    """Register a new volunteer. Returns profile with volunteer_id."""
    if not req.name.strip():
        raise HTTPException(400, "name is required")
    profile = volunteer_store.register_volunteer(
        name=req.name.strip(),
        phone=req.phone,
        org=req.org,
        lat=req.lat,
        lng=req.lng,
        skills=req.skills,
    )
    logger.info("Volunteer registered: %s id=%s", profile["name"], profile["volunteer_id"])
    return profile


@router.get("/{vid}")
def get_volunteer(vid: str):
    """Get a volunteer profile."""
    v = volunteer_store.get_volunteer(vid)
    if not v:
        raise HTTPException(404, "Volunteer not found")
    return v


@router.get("/all/list")
def all_volunteers():
    """Return all registered volunteers (NGO view)."""
    return volunteer_store.get_all_volunteers()


# ── Task views ────────────────────────────────────────────────────────────────

@router.get("/tasks/all")
def all_tasks():
    """All tasks — NGO overview."""
    return volunteer_store.get_all_tasks()


@router.get("/tasks/open")
def open_tasks(lat: Optional[float] = None, lng: Optional[float] = None):
    """Open tasks, sorted by distance if lat/lng provided."""
    return volunteer_store.get_open_tasks(lat, lng)


@router.get("/{vid}/tasks")
def volunteer_tasks(vid: str):
    """Tasks split into available/accepted/completed for a specific volunteer."""
    if not volunteer_store.get_volunteer(vid):
        raise HTTPException(404, "Volunteer not found")
    return volunteer_store.get_volunteer_tasks(vid)


# ── Task actions ──────────────────────────────────────────────────────────────

@router.post("/{vid}/tasks/{tid}/accept")
def accept(vid: str, tid: str):
    """Volunteer accepts a task."""
    ok = volunteer_store.accept_task(tid, vid)
    if not ok:
        raise HTTPException(400, "Task could not be accepted — it may already be assigned or not exist")
    return {"success": True}


@router.post("/{vid}/tasks/{tid}/decline")
def decline(vid: str, tid: str):
    """Volunteer declines / unassigns a task."""
    volunteer_store.decline_task(tid, vid)
    return {"success": True}


@router.post("/{vid}/tasks/{tid}/complete")
def complete(vid: str, tid: str, req: TaskActionRequest):
    """Volunteer marks task complete."""
    ok = volunteer_store.complete_task(tid, vid, req.notes)
    if not ok:
        raise HTTPException(400, "Task could not be completed — check task_id and volunteer_id")
    return {"success": True}


# ── Smart matching ────────────────────────────────────────────────────────────

@router.get("/match/{city}")
def smart_match(city: str):
    """Return top 5 nearest available volunteers to a city.
    Requires volunteers to have registered with lat/lng.
    """
    from services.scan_store import get_community_data
    zones = get_community_data()
    zone = next((z for z in zones if z["city"].lower() == city.lower()), None)
    if not zone or not zone.get("lat") or not zone.get("lng"):
        raise HTTPException(404, f"City '{city}' not found in community data or has no coordinates")

    matches = volunteer_store.find_nearby_volunteers(zone["lat"], zone["lng"])
    return {
        "city": city,
        "lat": zone["lat"],
        "lng": zone["lng"],
        "nearest_volunteers": matches[:5],
    }
