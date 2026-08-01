from fastapi import APIRouter

from . import auth, chat, trips, documents, budget

api_router = APIRouter(prefix="/api")

api_router.include_router(auth.router)
api_router.include_router(chat.router)
api_router.include_router(trips.router)
api_router.include_router(documents.router)
api_router.include_router(budget.router)
