"""Reverse-geocode lat/lng to city/state using Google Maps Geocoding API."""
import logging
import os
from typing import Tuple

import httpx

logger = logging.getLogger(__name__)

# Known city lookup by approximate bounding boxes as a fast offline fallback
_CITY_BOUNDS = [
    ("Mumbai", "Maharashtra", 18.89, 72.77, 19.27, 72.98),
    ("Delhi", "Delhi", 28.40, 76.85, 28.88, 77.35),
    ("Bengaluru", "Karnataka", 12.83, 77.46, 13.14, 77.75),
    ("Chennai", "Tamil Nadu", 12.91, 80.16, 13.22, 80.33),
    ("Hyderabad", "Telangana", 17.22, 78.33, 17.56, 78.62),
    ("Kolkata", "West Bengal", 22.42, 88.21, 22.72, 88.48),
    ("Pune", "Maharashtra", 18.43, 73.73, 18.62, 73.98),
    ("Ahmedabad", "Gujarat", 22.95, 72.49, 23.11, 72.65),
    ("Jaipur", "Rajasthan", 26.78, 75.68, 27.03, 75.89),
    ("Lucknow", "Uttar Pradesh", 26.74, 80.84, 26.97, 81.07),
    ("Surat", "Gujarat", 21.11, 72.76, 21.25, 72.91),
    ("Kanpur", "Uttar Pradesh", 26.36, 80.25, 26.53, 80.43),
    ("Nagpur", "Maharashtra", 21.06, 79.01, 21.22, 79.17),
    ("Patna", "Bihar", 25.55, 85.07, 25.66, 85.23),
    ("Indore", "Madhya Pradesh", 22.63, 75.78, 22.79, 75.95),
    ("Bhopal", "Madhya Pradesh", 23.17, 77.33, 23.33, 77.49),
    ("Visakhapatnam", "Andhra Pradesh", 17.64, 83.16, 17.80, 83.31),
    ("Coimbatore", "Tamil Nadu", 10.98, 76.91, 11.09, 77.07),
    ("Vadodara", "Gujarat", 22.27, 73.12, 22.36, 73.24),
    ("Agra", "Uttar Pradesh", 27.12, 78.03, 27.24, 78.10),
]


def _offline_geocode(lat: float, lng: float) -> Tuple[str, str]:
    """Match lat/lng to the nearest known city bounding box."""
    for city, state, lat_min, lng_min, lat_max, lng_max in _CITY_BOUNDS:
        if lat_min <= lat <= lat_max and lng_min <= lng <= lng_max:
            return city, state
    return "Unknown", "Unknown"


async def reverse_geocode(lat: float, lng: float) -> Tuple[str, str]:
    """Return (city, state) for the given coordinates.
    Uses Google Geocoding API if key is available, else offline bounding-box lookup.
    """
    api_key = os.getenv("GOOGLE_MAPS_API_KEY", "")
    if api_key:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    "https://maps.googleapis.com/maps/api/geocode/json",
                    params={"latlng": f"{lat},{lng}", "key": api_key, "result_type": "locality|administrative_area_level_1"},
                )
                data = resp.json()
                if data.get("status") == "OK" and data.get("results"):
                    city, state = "", ""
                    for comp in data["results"][0].get("address_components", []):
                        types = comp.get("types", [])
                        if "locality" in types:
                            city = comp["long_name"]
                        if "administrative_area_level_1" in types:
                            state = comp["long_name"]
                    if city:
                        return city, state
        except Exception as exc:
            logger.debug("Geocoding API failed: %s", exc)

    return _offline_geocode(lat, lng)
