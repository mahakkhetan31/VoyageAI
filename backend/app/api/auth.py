from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.user import UserCreate, UserLogin, UserRead, Token
from app.services.auth import AuthService
from app.utils.security import create_access_token
from app.api.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=Token, status_code=201)
async def register(body: UserCreate, db: Session = Depends(get_db)):
    service = AuthService(db)
    user = service.register(body.email, body.password, body.full_name)
    access_token = create_access_token({"sub": user.id})
    return Token(access_token=access_token)


@router.post("/login", response_model=Token)
async def login(body: UserLogin, db: Session = Depends(get_db)):
    service = AuthService(db)
    user = service.authenticate(body.email, body.password)
    access_token = create_access_token({"sub": user.id})
    return Token(access_token=access_token)


@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
