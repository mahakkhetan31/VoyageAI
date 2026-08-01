import chromadb

from app.config.settings import get_settings

settings = get_settings()

from typing import Any

_client: Any = None


def _get_client():
    """Lazy-init the ChromaDB client with persistence."""
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
    return _client


def get_collection(document_id: int) -> chromadb.Collection:
    """Get or create a ChromaDB collection for a specific document."""
    client = _get_client()
    return client.get_or_create_collection(
        name=f"doc_{document_id}",
        metadata={"hnsw:space": "cosine"},
    )


def store_chunks(
    document_id: int,
    chunks: list[str],
    embeddings: list[list[float]],
) -> None:
    """Store text chunks and their embeddings in ChromaDB."""
    collection = get_collection(document_id)
    ids = [f"chunk_{i}" for i in range(len(chunks))]
    collection.add(
        ids=ids,
        documents=chunks,
        embeddings=embeddings,
    )


def query_chunks(
    document_id: int,
    query_embedding: list[float],
    top_k: int = 5,
) -> list[str]:
    """Retrieve the most relevant chunks for a query."""
    collection = get_collection(document_id)
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(top_k, collection.count()),
    )
    return results["documents"][0] if results["documents"] else []


def delete_collection(document_id: int) -> None:
    """Delete a document's ChromaDB collection."""
    client = _get_client()
    try:
        client.delete_collection(name=f"doc_{document_id}")
    except ValueError:
        pass  # Collection doesn't exist
