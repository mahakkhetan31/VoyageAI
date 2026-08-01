from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.schemas.document import DocumentRead, DocumentAskRequest, DocumentAskResponse
from app.services.document import DocumentService

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload", response_model=DocumentRead, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a PDF, extract text, generate embeddings, and store in ChromaDB."""
    service = DocumentService(db)
    return service.upload(current_user.id, file)


@router.get("/", response_model=list[DocumentRead])
async def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = DocumentService(db)
    return service.list_documents(current_user.id)


@router.post("/{document_id}/ask", response_model=DocumentAskResponse)
async def ask_question(
    document_id: int,
    body: DocumentAskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ask a question about a document using RAG."""
    service = DocumentService(db)
    answer, chunks = service.ask(current_user.id, document_id, body.question)
    return DocumentAskResponse(answer=answer, source_chunks=chunks)


@router.delete("/{document_id}", status_code=204)
async def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a document, its ChromaDB collection, and file from disk."""
    service = DocumentService(db)
    service.delete_document(current_user.id, document_id)
