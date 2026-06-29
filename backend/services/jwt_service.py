from __future__ import annotations

import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Tuple

from fastapi import HTTPException
from jose import jwt
from passlib.context import CryptContext


# JWT settings
# Allow overriding secret via environment variable, keep safe default for local dev.
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "CHANGE_ME_PLEASE_SET_SECRET")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 8

pwd_context = CryptContext(schemes=["bcrypt"], bcrypt__rounds=12)


def create_access_token(
    user_id: str,
    email: str,
    role: str,
    name: str,
    remember: bool = False,
) -> Tuple[str, int]:
    """Create a JWT access token.

    Returns:
        (token_string, expires_in_seconds)
    """

    now = datetime.now(timezone.utc)

    if remember:
        exp = now + timedelta(days=30)
    else:
        exp = now + timedelta(hours=JWT_EXPIRY_HOURS)

    iat = int(now.timestamp())
    exp_ts = int(exp.timestamp())

    jti = str(uuid.uuid4())

    payload: Dict[str, Any] = {
        "id": str(user_id),
        "email": email,
        "role": role,
        "name": name,
        "exp": exp_ts,
        "iat": iat,
        "jti": jti,
    }

    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    expires_in_seconds = exp_ts - iat

    return token, int(expires_in_seconds)


def decode_token(token: str) -> Dict[str, Any]:
    """Decode and verify JWT.

    Raises:
        HTTPException(401) on invalid or expired token.
    """

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_iat": False,
            },
        )
        # Ensure required keys exist
        for key in ("id", "email", "role", "name", "exp", "iat", "jti"):
            if key not in payload:
                raise HTTPException(status_code=401, detail="Invalid token payload")
        return payload
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(plain, hashed)
    except Exception:
        return False

