import logging
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from routers import analyze, whatsapp, report, chat
from routers import auth, dashboard, scan_mgmt, doctor, notify, centres, analytics, admin
from routers import community, volunteer

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# ── Rate limiter ───────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="JanArogya API",
    version="1.0.0",
    description="AI-powered cancer screening platform for rural India.",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ───────────────────────────────────────────────────────────────────────
import os as _os

_extra_origins = [o.strip() for o in _os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://janarogya.health",
        "https://*.vercel.app",
        *_extra_origins,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Startup time tracking ──────────────────────────────────────────────────────
_startup_time: float = time.time()


@app.on_event("startup")
async def on_startup():
    global _startup_time
    _startup_time = time.time()
    from routers.admin import set_startup_time
    set_startup_time(_startup_time)
    logger.info("JanArogya API started at %.2f", _startup_time)
    _validate_env()


def _validate_env():
    import os
    issues = []
    gemini = os.getenv("GEMINI_API_KEY", "")
    if not gemini:
        issues.append("GEMINI_API_KEY is not set — Gemini analysis will fail")
    maps = os.getenv("GOOGLE_MAPS_API_KEY", "")
    if not maps:
        issues.append("GOOGLE_MAPS_API_KEY is not set — nearest centres disabled")
    elif len(maps) < 39:
        issues.append(
            f"GOOGLE_MAPS_API_KEY looks truncated ({len(maps)} chars, expected 39) "
            "— nearest centres will fail. Get a fresh key from Google Cloud Console."
        )
    for issue in issues:
        logger.warning("ENV CHECK: %s", issue)
    if not issues:
        logger.info("ENV CHECK: all required keys present")


# ── Request logging middleware ─────────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = round((time.time() - start) * 1000, 2)
    logger.info(
        "%s %s — %s (%sms)",
        request.method, request.url.path, response.status_code, duration,
    )
    return response

# ── Existing routers (unchanged) ───────────────────────────────────────────────
app.include_router(whatsapp.router, prefix="/api/v1")
app.include_router(analyze.router,  prefix="/api/v1")
app.include_router(report.router,   prefix="/api/v1")
app.include_router(chat.router,     prefix="/api/v1")

# ── New Phase-1 routers ────────────────────────────────────────────────────────
app.include_router(auth.router,      prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(scan_mgmt.router, prefix="/api/v1")
app.include_router(doctor.router,    prefix="/api/v1")
app.include_router(notify.router,    prefix="/api/v1")
app.include_router(centres.router,   prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(admin.router,     prefix="/api/v1")
app.include_router(community.router,  prefix="/api/v1")
app.include_router(volunteer.router,  prefix="/api/v1")

# ── Core routes ────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    uptime = round(time.time() - _startup_time, 1)
    # Count registered routes (excluding HEAD duplicates)
    endpoint_count = len(
        [r for r in app.routes if hasattr(r, "methods") and "GET" in r.methods or
         (hasattr(r, "methods") and bool(r.methods))]
    )
    return {
        "status": "ok",
        "project": "JanArogya",
        "version": "1.0.0",
        "uptime_seconds": uptime,
        "endpoints_count": endpoint_count,
    }


@app.get("/stats")
async def stats():
    try:
        from services.firebase_service import get_stats
        live = await get_stats()
        return {
            "total_screenings": live.get("total_screenings", 0),
            "positive_detections": live.get("positive_detections", 0),
            "unique_patients": live.get("unique_patients", 0),
            "reports_generated": live.get("total_screenings", 0),
        }
    except Exception as exc:
        logger.warning("Stats fetch failed: %s", exc)
        return {
            "total_screenings": 0,
            "positive_detections": 0,
            "unique_patients": 0,
            "reports_generated": 0,
        }


@app.get("/api/v1/openapi.json", include_in_schema=False)
async def openapi_alias():
    """Alias to the auto-generated OpenAPI schema."""
    return JSONResponse(app.openapi())
