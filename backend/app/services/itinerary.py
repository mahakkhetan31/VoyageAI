import json
import re

import google.generativeai as genai

from app.config.settings import get_settings
from app.schemas.itinerary import (
    ItineraryResponse, DayPlan, BudgetBreakdown,
)

settings = get_settings()
genai.configure(api_key=settings.GEMINI_API_KEY)

ITINERARY_PROMPT = """You are VoyageAI, an expert travel planner specializing in itineraries for Indian travelers.
Generate a detailed travel itinerary with all financial calculations in Indian Rupees (INR - ₹) as well as the local currency of the destination.

INPUT:
- Destination: {destination}
- Budget: ₹{budget:.0f} INR
- Duration: {days} days
- Interests: {interests}

OUTPUT FORMAT (respond with ONLY valid JSON, no markdown):
{{
  "destination": "{destination}",
  "destination_country": "Country Name",
  "currency_code": "EUR",
  "currency_symbol": "€",
  "exchange_rate_info": "1 EUR ≈ ₹91.50 INR",
  "exchange_rate_to_inr": 91.50,
  "days": {days},
  "itinerary": [
    {{
      "day": 1,
      "title": "Arrival & [Theme]",
      "activities": [
        "Morning: ...",
        "Afternoon: ...",
        "Evening: ..."
      ],
      "estimated_cost_inr": 4500.0,
      "estimated_cost_local": 49.0
    }}
  ],
  "budget_breakdown": {{
    "accommodation": 20000.0,
    "food": 12000.0,
    "transport": 8000.0,
    "activities": 6000.0,
    "miscellaneous": 4000.0,
    "total": 50000.0
  }},
  "packing_list": ["item1", "item2"],
  "travel_tips": ["tip1", "tip2"]
}}

RULES:
- All budget_breakdown amounts MUST be in Indian Rupees (INR - ₹).
- Include accurate exchange rate info for 1 unit of local currency to INR (e.g. 1 USD ≈ ₹83.5 INR, 1 EUR ≈ ₹91.5 INR, 1 JPY ≈ ₹0.56 INR, 1 THB ≈ ₹2.35 INR, 1 AED ≈ ₹22.7 INR, 1 SGD ≈ ₹62.0 INR, 1 GBP ≈ ₹106.0 INR).
- If destination is inside India, set currency_code to "INR", currency_symbol to "₹", exchange_rate_info to "1 INR = 1 INR", and exchange_rate_to_inr to 1.0.
- For each day, estimated_cost_inr is in INR (₹), and estimated_cost_local is the cost in local destination currency.
- Include 3-4 activities per day tailored for Indian travelers (e.g., local food/veg options, iconic sights, transit tips).
- Packing list should have 8-12 relevant items.
- Travel tips should have 5-7 practical advice items including visa/entry guidance for Indian travelers if applicable.
"""


def generate_itinerary(
    destination: str,
    budget: float,
    days: int,
    interests: list[str],
) -> ItineraryResponse:
    """Generate a structured travel itinerary using Gemini with INR & local currency conversion."""
    current_settings = get_settings()
    genai.configure(api_key=current_settings.GEMINI_API_KEY)

    prompt = ITINERARY_PROMPT.format(
        destination=destination,
        budget=budget,
        days=days,
        interests=", ".join(interests),
    )

    model = genai.GenerativeModel(model_name=current_settings.GEMINI_MODEL)
    response = model.generate_content(prompt)

    # Parse JSON from response (strip markdown fences if present)
    text = response.text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        # Try extracting JSON object using regex search
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            data = json.loads(match.group(0))
        else:
            raise ValueError(f"Failed to parse JSON response from Gemini model: {text[:200]}")

    budget_raw = data.get("budget_breakdown", {})
    budget_breakdown = BudgetBreakdown(
        accommodation=float(budget_raw.get("accommodation", 0.0)),
        food=float(budget_raw.get("food", 0.0)),
        transport=float(budget_raw.get("transport", 0.0)),
        activities=float(budget_raw.get("activities", 0.0)),
        miscellaneous=float(budget_raw.get("miscellaneous", 0.0)),
        total=float(budget_raw.get("total", budget)),
    )

    day_plans = []
    for day in data.get("itinerary", []):
        cost_inr = float(day.get("estimated_cost_inr", day.get("estimated_cost", 0.0)))
        cost_local = float(day.get("estimated_cost_local", 0.0))
        day_plans.append(DayPlan(
            day=int(day.get("day", len(day_plans) + 1)),
            title=str(day.get("title", f"Day {len(day_plans) + 1}")),
            activities=[str(a) for a in day.get("activities", [])],
            estimated_cost_inr=cost_inr,
            estimated_cost_local=cost_local,
        ))

    rate_to_inr = float(data.get("exchange_rate_to_inr", 1.0))
    if rate_to_inr <= 0:
        rate_to_inr = 1.0

    return ItineraryResponse(
        destination=str(data.get("destination", destination)),
        destination_country=str(data.get("destination_country", "Destination Country")),
        currency_code=str(data.get("currency_code", "INR")),
        currency_symbol=str(data.get("currency_symbol", "₹")),
        exchange_rate_info=str(data.get("exchange_rate_info", "1 INR = 1 INR")),
        exchange_rate_to_inr=rate_to_inr,
        days=int(data.get("days", days)),
        itinerary=day_plans,
        budget_breakdown=budget_breakdown,
        packing_list=[str(i) for i in data.get("packing_list", [])],
        travel_tips=[str(t) for t in data.get("travel_tips", [])],
    )


