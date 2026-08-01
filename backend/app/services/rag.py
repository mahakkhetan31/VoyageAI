def build_rag_prompt(question: str, context_chunks: list[str]) -> str:
    """Construct a prompt augmented with retrieved document context.

    The context chunks are placed before the question so the LLM can
    reference them when generating the answer.
    """
    context_block = "\n\n---\n\n".join(context_chunks)

    return (
        "You are VoyageAI, an expert AI travel assistant. "
        "Use the following document excerpts to answer the user's question. "
        "If the answer is not found in the excerpts, say so clearly.\n\n"
        "DOCUMENT EXCERPTS:\n"
        f"{context_block}\n\n"
        "---\n\n"
        f"QUESTION: {question}\n\n"
        "ANSWER:"
    )
