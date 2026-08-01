from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.chat_session import ChatSession
from app.models.message import Message


class ChatService:
    """Handles chat session CRUD and conversation history building."""

    def __init__(self, db: Session):
        self.db = db

    def create_session(self, user_id: int, title: str = "New Chat") -> ChatSession:
        session = ChatSession(user_id=user_id, title=title)
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def list_sessions(self, user_id: int) -> list[ChatSession]:
        return (
            self.db.query(ChatSession)
            .filter(ChatSession.user_id == user_id)
            .order_by(ChatSession.updated_at.desc())
            .all()
        )

    def get_session(self, user_id: int, session_id: int) -> ChatSession:
        session = (
            self.db.query(ChatSession)
            .filter(ChatSession.id == session_id, ChatSession.user_id == user_id)
            .first()
        )
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found",
            )
        return session

    def delete_session(self, user_id: int, session_id: int) -> None:
        session = self.get_session(user_id, session_id)
        self.db.delete(session)
        self.db.commit()

    def add_message(self, session_id: int, role: str, content: str) -> Message:
        message = Message(session_id=session_id, role=role, content=content)
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message

    def get_messages(self, session_id: int) -> list[Message]:
        return (
            self.db.query(Message)
            .filter(Message.session_id == session_id)
            .order_by(Message.created_at.asc())
            .all()
        )

    def build_conversation_context(self, session_id: int) -> list[dict]:
        """Build the full conversation history for the AI.

        Returns a list of {"role": "user"|"assistant", "content": "..."} dicts
        ordered chronologically. This is what gets sent to the LLM so it
        understands the full conversation when answering follow-ups.
        """
        messages = self.get_messages(session_id)
        return [{"role": m.role, "content": m.content} for m in messages]

    def update_session_title(self, session: ChatSession, title: str) -> None:
        session.title = title
        self.db.commit()

    def send_message(self, user_id: int, session_id: int, content: str) -> tuple[Message, list[dict]]:
        """Process a user message: store it, build context, return both.

        Returns:
            (user_message, conversation_context) — the context includes all
            previous messages plus the new user message, ready to send to AI.
        """
        session = self.get_session(user_id, session_id)

        # Auto-title from first message
        existing_messages = self.get_messages(session_id)
        if len(existing_messages) == 0:
            self.update_session_title(session, content[:50])

        # Store the user message
        user_message = self.add_message(session_id, "user", content)

        # Build full conversation context including this new message
        context = self.build_conversation_context(session_id)

        return user_message, context
