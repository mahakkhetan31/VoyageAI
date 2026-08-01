from datetime import datetime

from pydantic import BaseModel


class MessageCreate(BaseModel):
    content: str


class MessageRead(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatSessionCreate(BaseModel):
    title: str = "New Chat"


class ChatSessionRead(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ChatSessionDetail(ChatSessionRead):
    """Session with its full message history."""
    messages: list[MessageRead] = []


class ConversationContext(BaseModel):
    """The conversation context sent to the AI — all previous messages."""
    messages: list[dict]  # [{"role": "user"|"assistant", "content": "..."}]
