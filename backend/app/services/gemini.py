import google.generativeai as genai

from app.config.settings import get_settings

settings = get_settings()
genai.configure(api_key=settings.GEMINI_API_KEY)

SYSTEM_PROMPT = (
    "You are VoyageAI, an expert AI travel planning assistant. "
    "You help users plan trips, create itineraries, suggest destinations, "
    "estimate budgets, and answer travel-related questions. "
    "Be concise, helpful, and enthusiastic about travel."
)


def generate_response(prompt: str, history: list[dict] | None = None) -> str:
    """Send a prompt to Gemini with optional conversation history.

    Args:
        prompt: The current user message.
        history: Previous messages as [{"role": "user"|"model", "content": "..."}].
                 Gemini uses "model" instead of "assistant" for its role.
    """
    model = genai.GenerativeModel(
        model_name=settings.GEMINI_MODEL,
        system_instruction=SYSTEM_PROMPT,
    )

    if history:
        # Convert to Gemini's expected format and start a chat
        gemini_history = []
        for msg in history:
            # Map our "assistant" role to Gemini's "model" role
            role = "model" if msg["role"] == "assistant" else msg["role"]
            gemini_history.append({"role": role, "parts": [msg["content"]]})

        chat = model.start_chat(history=gemini_history)
        response = chat.send_message(prompt)
    else:
        response = model.generate_content(prompt)

    return response.text
