from fastapi import APIRouter

router = APIRouter(prefix="/budget", tags=["Budget"])


@router.post("/")
async def create_budget():
    return {"message": "create budget endpoint"}


@router.get("/{trip_id}")
async def get_budget(trip_id: int):
    return {"message": f"get budget for trip {trip_id} endpoint"}


@router.post("/{budget_id}/expense")
async def add_expense(budget_id: int):
    return {"message": f"add expense to budget {budget_id} endpoint"}
