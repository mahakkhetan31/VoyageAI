import google.generativeai as genai

from app.config.settings import get_settings

settings = get_settings()
genai.configure(api_key=settings.GEMINI_API_KEY)


def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for a list of texts using Gemini's embedding model.

    Calls the API directly — no LangChain wrapper.
    """
    result = genai.embed_content(
        model=settings.EMBEDDING_MODEL,
        content=texts,
        task_type="retrieval_document",
    )
    return result["embedding"]


def generate_query_embedding(query: str) -> list[float]:
    """Generate a single embedding for a search query."""
    result = genai.embed_content(
        model=settings.EMBEDDING_MODEL,
        content=query,
        task_type="retrieval_query",
    )
    return result["embedding"]
