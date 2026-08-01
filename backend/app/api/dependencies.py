from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
import jwt

from app.database import get_db
from app.models.user import User
from app.utils.security import decode_access_token

bearer_scheme = HTTPBearer()


def get_current_user() -> User:
    """Mocked user for local testing without database."""
    user = User(
        id=1,
        email="demo@example.com",
        full_name="Demo User",
        is_active=True
    )
    return user
