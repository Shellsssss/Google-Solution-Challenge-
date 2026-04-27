"""Authentication endpoints — register, login, refresh, logout, me, google."""
import logging
import re
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, field_validator

from middleware.auth import get_current_user
from services.auth_service import (
    get_user_from_token,
    login_user,
    logout_user,
    refresh_token,
    register_user,
)

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)
_bearer = HTTPBearer(auto_error=False)

_EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$")


# ── Pydantic models ────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    role: str = "patient"

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not _EMAIL_RE.match(v):
            raise ValueError("Invalid email format.")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters.")
        return v

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in ("patient", "doctor", "admin"):
            raise ValueError("role must be 'patient', 'doctor', or 'admin'.")
        return v


class LoginRequest(BaseModel):
    email: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class GoogleAuthRequest(BaseModel):
    id_token: str


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest):
    """Register a new user. Returns tokens."""
    try:
        result = register_user(req.email, req.password, req.name, req.role)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return result


@router.post("/login")
def login(req: LoginRequest):
    """Authenticate and return tokens + profile."""
    try:
        result = login_user(req.email.strip().lower(), req.password)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))
    return result


@router.post("/refresh")
def token_refresh(req: RefreshRequest):
    """Exchange a refresh token for a new access token."""
    try:
        result = refresh_token(req.refresh_token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))
    return result


@router.post("/logout")
def logout(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
):
    """Blacklist the current access token."""
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No token provided.")
    logout_user(credentials.credentials)
    return {"success": True}


@router.get("/me")
def me(user: dict = Depends(get_current_user)):
    """Return current user profile (no password)."""
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "scan_count": user.get("scan_count", 0),
        "created_at": user.get("created_at"),
    }


@router.post("/firebase")
def firebase_auth(req: GoogleAuthRequest):
    """
    Verify a Firebase ID token and return a JanArogya JWT.
    Works for Google, GitHub, Email/Password — any Firebase provider.
    """
    import os
    import firebase_admin
    from firebase_admin import auth as fb_auth, credentials as fb_creds

    # Initialise Firebase Admin SDK once
    if not firebase_admin._apps:
        sa_path = os.path.join(
            os.path.dirname(__file__), "..", "config", "firebase-service-account.json"
        )
        try:
            cred = fb_creds.Certificate(sa_path)
            firebase_admin.initialize_app(cred)
        except Exception as exc:
            logger.error("Firebase Admin init failed: %s", exc)
            raise HTTPException(500, "Firebase not configured on server")

    # Verify the token — try with max allowed skew, fall back to manual decode on clock drift
    try:
        decoded = fb_auth.verify_id_token(req.id_token, clock_skew_seconds=60)
    except Exception as exc:
        exc_str = str(exc)
        if "used too early" in exc_str or "clock" in exc_str.lower():
            # Clock skew > 60s: verify signature via google.auth directly (no iat limit)
            try:
                import google.auth.jwt as _gjwt
                import google.oauth2.id_token as _gid
                import google.auth.transport.requests as _gtr
                import requests as _req
                _session = _req.Session()
                _request = _gtr.Request(session=_session)
                decoded = _gid.verify_firebase_token(
                    req.id_token, _request,
                    audience=firebase_admin.get_app().project_id,
                    clock_skew_in_seconds=300,
                )
                decoded["uid"] = decoded.get("sub", "")
                logger.warning("Firebase token accepted with extended clock skew tolerance")
            except Exception as exc2:
                logger.warning("Firebase token invalid (fallback): %s", exc2)
                raise HTTPException(status_code=401, detail="Invalid Firebase token")
        else:
            logger.warning("Firebase token invalid: %s", exc)
            raise HTTPException(status_code=401, detail="Invalid Firebase token")

    uid   = decoded.get("uid", "")
    email = decoded.get("email") or f"{uid}@firebase.janarogya.health"
    name  = decoded.get("name") or decoded.get("email", "User").split("@")[0].title()

    # Create or log in the user
    stable_password = f"fb_{uid}_secure"
    try:
        result = register_user(email, stable_password, name, "patient")
    except ValueError:
        # User already exists — log in
        try:
            result = login_user(email, stable_password)
        except ValueError:
            raise HTTPException(400, "Account exists with a different sign-in method")

    logger.info("Firebase auth: user %s (%s)", email, decoded.get("firebase", {}).get("sign_in_provider", "unknown"))
    return {
        "user_id": result["user_id"],
        "token": result["token"],
        "refresh_token": result.get("refresh_token", ""),
        "user_profile": {
            "user_id": result["user_id"],
            "email": email,
            "name": name,
            "role": "patient",
        },
    }


@router.post("/google")
def google_auth(req: GoogleAuthRequest):
    """Legacy alias — forwards to /firebase."""
    return firebase_auth(req)
