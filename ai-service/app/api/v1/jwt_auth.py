"""
QAZGOST AI — JWT Authentication Module

Provides:
  - JWT token generation (access + refresh)
  - JWT token verification via FastAPI Dependency
  - Bearer token extraction from Authorization header
  - Optional auth (returns None if no token, raises 401 on bad token)

Uses HMAC-SHA256 for signing. Secret key is read from settings.JWT_SECRET.
"""

import time
import json
import hmac
import hashlib
import base64
from typing import Optional, Dict, Any

from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from loguru import logger

from app.config import settings


# ═══════════════════════════════════════════════════════════════════════
# JWT Token Generation & Verification (no external dependency)
# ═══════════════════════════════════════════════════════════════════════

def _b64url_encode(data: bytes) -> str:
    """Base64url encode without padding."""
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(s: str) -> bytes:
    """Base64url decode with padding fix."""
    s += "=" * (4 - len(s) % 4)
    return base64.urlsafe_b64decode(s)


def _get_secret() -> str:
    """Get JWT secret from settings, with a fallback warning."""
    secret = getattr(settings, "JWT_SECRET", None)
    if not secret:
        logger.warning("⚠️ JWT_SECRET not set! Using insecure default. Set JWT_SECRET in .env for production.")
        return "qazgost-dev-secret-change-me-in-production"
    return secret


def create_token(
    payload: Dict[str, Any],
    expires_in: int = 3600,
    token_type: str = "access",
) -> str:
    """
    Create a signed JWT token (HMAC-SHA256).

    Args:
        payload: Claims to embed (uid, role, etc.)
        expires_in: Token lifetime in seconds (default 1 hour)
        token_type: "access" or "refresh"

    Returns:
        Signed JWT string (header.payload.signature)
    """
    secret = _get_secret()

    # Header
    header = {"alg": "HS256", "typ": "JWT"}

    # Payload with standard claims
    now = int(time.time())
    full_payload = {
        **payload,
        "type": token_type,
        "iat": now,
        "exp": now + expires_in,
    }

    # Encode
    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode())
    payload_b64 = _b64url_encode(json.dumps(full_payload, separators=(",", ":")).encode())

    # Sign
    signing_input = f"{header_b64}.{payload_b64}"
    signature = hmac.new(
        secret.encode("utf-8"),
        signing_input.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    signature_b64 = _b64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{signature_b64}"


def verify_token(token: str) -> Dict[str, Any]:
    """
    Verify and decode a JWT token.

    Args:
        token: JWT string

    Returns:
        Decoded payload dict

    Raises:
        ValueError: If token is invalid, expired, or signature mismatch
    """
    secret = _get_secret()

    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Invalid token format")

    header_b64, payload_b64, signature_b64 = parts

    # Verify signature
    signing_input = f"{header_b64}.{payload_b64}"
    expected_sig = hmac.new(
        secret.encode("utf-8"),
        signing_input.encode("utf-8"),
        hashlib.sha256,
    ).digest()

    actual_sig = _b64url_decode(signature_b64)

    if not hmac.compare_digest(expected_sig, actual_sig):
        raise ValueError("Invalid signature")

    # Decode payload
    try:
        payload = json.loads(_b64url_decode(payload_b64))
    except (json.JSONDecodeError, Exception) as e:
        raise ValueError(f"Invalid payload: {e}")

    # Check expiration
    exp = payload.get("exp", 0)
    if exp and time.time() > exp:
        raise ValueError("Token expired")

    return payload


# ═══════════════════════════════════════════════════════════════════════
# FastAPI Dependencies
# ═══════════════════════════════════════════════════════════════════════

_bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
) -> Dict[str, Any]:
    """
    FastAPI dependency: extract and verify JWT from Authorization header.

    Usage:
        @router.post("/analyze")
        async def analyze(user: dict = Depends(get_current_user)):
            uid = user["uid"]

    Raises:
        HTTPException 401 if token is missing or invalid
    """
    if not credentials:
        raise HTTPException(
            status_code=401,
            detail="Требуется авторизация. Передайте Bearer токен.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = verify_token(credentials.credentials)
    except ValueError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Невалидный токен: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify it's an access token
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=401,
            detail="Требуется access-токен (передан refresh-токен)",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
) -> Optional[Dict[str, Any]]:
    """
    FastAPI dependency: optional auth — returns None if no token,
    raises 401 only if token is present but invalid.

    Usage for endpoints that work both with and without auth:
        @router.get("/prices")
        async def prices(user: dict | None = Depends(get_optional_user)):
            if user:
                # personalized pricing
            else:
                # public pricing
    """
    if not credentials:
        return None

    try:
        payload = verify_token(credentials.credentials)
        if payload.get("type") != "access":
            raise ValueError("Expected access token")
        return payload
    except ValueError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Невалидный токен: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )
