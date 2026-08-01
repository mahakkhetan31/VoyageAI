from sqlalchemy.orm import Session


class BudgetService:
    """Handles trip budget planning and expense tracking."""

    def __init__(self, db: Session):
        self.db = db

    def create_budget(self, user_id: int, trip_id: int, total: float):
        raise NotImplementedError

    def get_budget(self, user_id: int, trip_id: int):
        raise NotImplementedError

    def add_expense(self, budget_id: int, category: str, amount: float):
        raise NotImplementedError
