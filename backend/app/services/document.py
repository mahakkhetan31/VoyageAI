import os
import uuid

from fastapi import HTTPException, UploadFile, status
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sqlalchemy.orm import Session

from app.config.settings import get_settings
from app.models.document import Document
from app.services.pdf import extract_text
from app.services.embeddings import generate_embeddings, generate_query_embedding
from app.services.vectorstore import store_chunks, query_chunks, delete_collection
from app.services.rag import build_rag_prompt
from app.services.gemini import generate_response

settings = get_settings()

# LangChain used here only — best-in-class text splitter
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=settings.CHUNK_SIZE,
    chunk_overlap=settings.CHUNK_OVERLAP,
    length_function=len,
)


class DocumentService:
    """Orchestrates PDF upload → chunking → embedding → storage, and RAG Q&A."""

    def __init__(self, db: Session):
        self.db = db

    def upload(self, user_id: int, file: UploadFile) -> Document:
        """Save PDF, extract text, chunk, embed, and store in ChromaDB."""
        if not file.filename or not file.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF files are accepted",
            )

        # Save file to disk
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        safe_name = f"{uuid.uuid4().hex}.pdf"
        file_path = os.path.join(settings.UPLOAD_DIR, safe_name)

        content = file.file.read()
        with open(file_path, "wb") as f:
            f.write(content)

        # Create DB record
        doc = Document(
            user_id=user_id,
            filename=safe_name,
            original_name=file.filename,
            file_size=len(content),
            status="processing",
        )
        self.db.add(doc)
        self.db.commit()
        self.db.refresh(doc)

        try:
            # Extract text
            full_text, page_count = extract_text(file_path)
            if not full_text.strip():
                raise ValueError("No text could be extracted from this PDF")

            # Chunk text (LangChain's RecursiveCharacterTextSplitter)
            chunks = text_splitter.split_text(full_text)

            # Generate embeddings via Gemini
            embeddings = generate_embeddings(chunks)

            # Store in ChromaDB
            store_chunks(doc.id, chunks, embeddings)

            # Update document record
            doc.page_count = page_count
            doc.chunk_count = len(chunks)
            doc.status = "ready"
            self.db.commit()

        except Exception as e:
            doc.status = "error"
            doc.error_message = str(e)
            self.db.commit()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to process document: {e}",
            )

        return doc

    def ask(self, user_id: int, document_id: int, question: str) -> tuple[str, list[str]]:
        """Answer a question using RAG against a specific document.

        Returns:
            (answer, source_chunks)
        """
        doc = self._get_document(user_id, document_id)
        if doc.status != "ready":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Document is not ready (status: {doc.status})",
            )

        # Embed the question
        query_embedding = generate_query_embedding(question)

        # Retrieve relevant chunks from ChromaDB
        relevant_chunks = query_chunks(document_id, query_embedding, top_k=5)

        if not relevant_chunks:
            return "No relevant content found in this document.", []

        # Build augmented prompt and call Gemini
        augmented_prompt = build_rag_prompt(question, relevant_chunks)
        answer = generate_response(augmented_prompt)

        return answer, relevant_chunks

    def list_documents(self, user_id: int) -> list[Document]:
        return (
            self.db.query(Document)
            .filter(Document.user_id == user_id)
            .order_by(Document.created_at.desc())
            .all()
        )

    def delete_document(self, user_id: int, document_id: int) -> None:
        doc = self._get_document(user_id, document_id)

        # Remove ChromaDB collection
        delete_collection(document_id)

        # Remove file from disk
        file_path = os.path.join(settings.UPLOAD_DIR, doc.filename)
        if os.path.exists(file_path):
            os.remove(file_path)

        self.db.delete(doc)
        self.db.commit()

    def _get_document(self, user_id: int, document_id: int) -> Document:
        doc = (
            self.db.query(Document)
            .filter(Document.id == document_id, Document.user_id == user_id)
            .first()
        )
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found",
            )
        return doc
