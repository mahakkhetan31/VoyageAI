from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.schemas.chat import (
    ChatSessionCreate, ChatSessionRead, ChatSessionDetail,
    MessageCreate, MessageRead,
)
from app.services.chat import ChatService
from app.services.gemini import generate_response

router = APIRouter(prefix="/chat", tags=["Chat"])


# --- Sessions ---

@router.post("/sessions", response_model=ChatSessionRead, status_code=201)
async def create_session(
    body: ChatSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ChatService(db)
    session = service.create_session(current_user.id, body.title)
    return session


@router.get("/sessions", response_model=list[ChatSessionRead])
async def list_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ChatService(db)
    return service.list_sessions(current_user.id)


@router.get("/sessions/{session_id}", response_model=ChatSessionDetail)
async def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ChatService(db)
    session = service.get_session(current_user.id, session_id)
    return session


@router.delete("/sessions/{session_id}", status_code=204)
async def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ChatService(db)
    service.delete_session(current_user.id, session_id)


# --- Messages ---

@router.post("/sessions/{session_id}/messages", response_model=MessageRead, status_code=201)
async def send_message(
    session_id: int,
    body: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Store a user message, call Gemini with conversation history, store and return the AI response."""
    service = ChatService(db)
    _user_msg, context = service.send_message(current_user.id, session_id, body.content)

    # context = all messages in this session including the new one
    # Pass previous messages as history (everything except the last user message)
    previous = context[:-1] if len(context) > 1 else None
    ai_reply = generate_response(body.content, history=previous)
    assistant_message = service.add_message(session_id, "assistant", ai_reply)

    return assistant_message


@router.get("/sessions/{session_id}/messages", response_model=list[MessageRead])
async def get_messages(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ChatService(db)
    # Verify ownership
    service.get_session(current_user.id, session_id)
    return service.get_messages(session_id)
