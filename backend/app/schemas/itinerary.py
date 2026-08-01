from pydantic import BaseModel


class ItineraryRequest(BaseModel):
    destination: str
    budget: float  # In INR (₹)
    days: int
    interests: list[str]


class DayPlan(BaseModel):
    day: int
    title: str
    activities: list[str]
    estimated_cost_inr: float
    estimated_cost_local: float = 0.0


class BudgetBreakdown(BaseModel):
    accommodation: float
    food: float
    transport: float
    activities: float
    miscellaneous: float
    total: float


class ItineraryResponse(BaseModel):
    destination: str
    destination_country: str = "Destination Country"
    currency_code: str = "INR"
    currency_symbol: str = "₹"
    exchange_rate_info: str = "1 INR = 1 INR"
    exchange_rate_to_inr: float = 1.0
    days: int
    itinerary: list[DayPlan]
    budget_breakdown: BudgetBreakdown
    packing_list: list[str]
    travel_tips: list[str]

