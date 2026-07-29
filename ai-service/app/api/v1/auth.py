"""
QAZGOST AI Service - Telegram Auth Verification

Validates Telegram Login Widget data using HMAC-SHA256,
creates/finds user, and returns a session token.
"""

import hashlib
import hmac
import time
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from loguru import logger

from app.config import settings


router = APIRouter()


# ========== MODELS ==========

class TelegramAuthData(BaseModel):
    """Data from Telegram Login Widget callback."""
    id: int
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None
    auth_date: int
    hash: str


class TelegramAuthResponse(BaseModel):
    """Response after successful Telegram auth verification."""
    success: bool
    accessToken: Optional[str] = None
    refreshToken: Optional[str] = None
    expiresIn: int = 3600
    uid: Optional[str] = None
    role: str = "customer"
    firebaseToken: Optional[str] = None
    error: Optional[str] = None


# ========== HMAC VERIFICATION ==========

def verify_telegram_hash(data: TelegramAuthData, bot_token: str) -> bool:
    """
    Verify Telegram Login Widget data integrity using HMAC-SHA256.
    
    Algorithm (from Telegram docs):
    1. Create data-check-string from all fields except 'hash', sorted alphabetically
    2. secret_key = SHA256(bot_token)
    3. hmac = HMAC-SHA256(secret_key, data-check-string)
    4. Compare hmac hex with provided hash
    
    See: https://core.telegram.org/widgets/login#checking-authorization
    """
    # Build data-check-string
    check_dict = {
        "id": str(data.id),
        "first_name": data.first_name,
        "auth_date": str(data.auth_date),
    }
    if data.last_name:
        check_dict["last_name"] = data.last_name
    if data.username:
        check_dict["username"] = data.username
    if data.photo_url:
        check_dict["photo_url"] = data.photo_url

    # Sort alphabetically and join with newlines
    data_check_string = "\n".join(
        f"{k}={v}" for k, v in sorted(check_dict.items())
    )

    # secret_key = SHA256(bot_token)
    secret_key = hashlib.sha256(bot_token.encode("utf-8")).digest()

    # Calculate HMAC
    calculated_hash = hmac.new(
        secret_key,
        data_check_string.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(calculated_hash, data.hash)


def is_auth_data_fresh(auth_date: int, max_age_seconds: int = 86400) -> bool:
    """Check that auth_date is not too old (default: 24 hours)."""
    return (time.time() - auth_date) < max_age_seconds


# ========== ROUTE ==========

@router.post(
    "/auth/telegram/verify",
    response_model=TelegramAuthResponse,
    summary="Verify Telegram Login Widget data",
    description=(
        "Validates the HMAC hash from Telegram Login Widget, "
        "checks data freshness, and returns a session token."
    ),
)
async def verify_telegram_auth(data: TelegramAuthData):
    """
    POST /api/auth/telegram/verify
    
    Accepts Telegram Login Widget callback data, verifies HMAC signature,
    and returns an access token for the authenticated user.
    """
    logger.info(f"📱 Telegram auth request: id={data.id}, username={data.username}")

    # 1. Get bot token from settings
    bot_token = getattr(settings, "TELEGRAM_BOT_TOKEN", None)
    
    if not bot_token:
        # No bot token configured — accept in demo mode with warning
        logger.warning("⚠️ TELEGRAM_BOT_TOKEN not set — skipping HMAC verification (demo mode)")
    else:
        # 2. Verify HMAC hash
        if not verify_telegram_hash(data, bot_token):
            logger.warning(f"❌ Telegram auth HMAC mismatch for id={data.id}")
            raise HTTPException(
                status_code=403,
                detail="Invalid Telegram auth data: HMAC verification failed"
            )

        # 3. Check freshness (reject data older than 24 hours)
        if not is_auth_data_fresh(data.auth_date):
            logger.warning(f"❌ Telegram auth data expired for id={data.id}")
            raise HTTPException(
                status_code=403,
                detail="Telegram auth data expired. Please try again."
            )

    # 4. Build user identity
    tg_uid = f"tg_{data.id}"
    name = " ".join(filter(None, [data.first_name, data.last_name]))
    email = f"tg_{data.id}@telegram.qazgost.kz"

    logger.info(f"✅ Telegram auth verified: {name} (@{data.username}) → {tg_uid}")

    # 5. Try to create Firebase custom token (if firebase-admin is configured)
    firebase_token = None
    try:
        import firebase_admin
        from firebase_admin import auth as fb_auth

        # Initialize if not already
        if not firebase_admin._apps:
            cred_path = getattr(settings, "FIREBASE_SERVICE_ACCOUNT", None)
            if cred_path:
                cred = firebase_admin.credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)

        if firebase_admin._apps:
            raw_token = fb_auth.create_custom_token(
                tg_uid,
                {
                    "provider": "telegram",
                    "telegram_id": data.id,
                    "username": data.username or "",
                    "name": name,
                }
            )
            firebase_token = raw_token.decode("utf-8") if isinstance(raw_token, bytes) else str(raw_token)
            
            logger.info(f"🔥 Firebase custom token created for {tg_uid}")
    except ImportError:
        logger.debug("firebase-admin not installed — skipping Firebase token")
    except Exception as e:
        logger.warning(f"Firebase custom token creation failed: {e}")

    # 6. Generate JWT tokens
    from app.api.v1.jwt_auth import create_token

    token_payload = {
        "uid": tg_uid,
        "role": "customer",
        "name": name,
        "telegram_id": data.id,
        "username": data.username or "",
    }

    access_token = create_token(
        payload=token_payload,
        expires_in=settings.JWT_ACCESS_EXPIRY,
        token_type="access",
    )
    refresh_token = create_token(
        payload={"uid": tg_uid, "role": "customer"},
        expires_in=settings.JWT_REFRESH_EXPIRY,
        token_type="refresh",
    )

    return TelegramAuthResponse(
        success=True,
        accessToken=access_token,
        refreshToken=refresh_token,
        expiresIn=settings.JWT_ACCESS_EXPIRY,
        uid=tg_uid,
        role="customer",
        firebaseToken=firebase_token,
    )


# ── Token Refresh ────────────────────────────────────────────────────

class RefreshRequest(BaseModel):
    refreshToken: str

class RefreshResponse(BaseModel):
    success: bool
    accessToken: str
    expiresIn: int

@router.post("/auth/refresh", response_model=RefreshResponse)
async def refresh_token(data: RefreshRequest):
    """Exchange a valid refresh token for a new access token."""
    from app.api.v1.jwt_auth import verify_token, create_token

    try:
        payload = verify_token(data.refreshToken)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=f"Невалидный refresh-токен: {e}")

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Ожидается refresh-токен, получен access-токен")

    # Issue a new access token with the same identity
    new_access = create_token(
        payload={
            "uid": payload["uid"],
            "role": payload.get("role", "customer"),
        },
        expires_in=settings.JWT_ACCESS_EXPIRY,
        token_type="access",
    )

    return RefreshResponse(
        success=True,
        accessToken=new_access,
        expiresIn=settings.JWT_ACCESS_EXPIRY,
    )

