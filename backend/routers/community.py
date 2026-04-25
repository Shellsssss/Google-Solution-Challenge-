"""Community data endpoints — public heatmap, zone insights, volunteer actions."""
import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.scan_store import get_community_data, get_heatmap_data, mark_zone_handled

router = APIRouter(prefix="/community", tags=["community"])
logger = logging.getLogger(__name__)


@router.get("/data")
def community_data():
    """Return city-level aggregated risk data with resource suggestions (public)."""
    return get_community_data()


@router.get("/heatmap")
def community_heatmap():
    """Return raw lat/lng cluster points for map rendering (public)."""
    return get_heatmap_data()


class HandleZoneRequest(BaseModel):
    volunteer_name: str = ""
    action: str = "handled"   # "handled" | "assigned"


@router.post("/zone/{city}/handle")
def handle_zone(city: str, req: HandleZoneRequest):
    """Volunteer marks a zone as handled / team assigned."""
    ok = mark_zone_handled(city, req.volunteer_name)
    if not ok:
        raise HTTPException(500, "Could not update zone")
    return {"success": True, "city": city, "action": req.action, "volunteer": req.volunteer_name}
