from datetime import datetime

from pydantic import BaseModel


class DocumentRead(BaseModel):
    id: int
    filename: str
    original_name: str
    file_size: int
    page_count: int
    chunk_count: int
    status: str
    error_message: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentAskRequest(BaseModel):
    question: str


class DocumentAskResponse(BaseModel):
    answer: str
    source_chunks: list[str]
