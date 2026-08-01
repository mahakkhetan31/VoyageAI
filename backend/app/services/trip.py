from sqlalchemy.orm import Session


class TripService:
    """Handles trip CRUD and AI itinerary generation."""

    def __init__(self, db: Session):
        self.db = db

    def create_trip(self, user_id: int, destination: str, start_date: str, end_date: str):
        raise NotImplementedError

    def get_trips(self, user_id: int):
        raise NotImplementedError

    def get_trip(self, user_id: int, trip_id: int):
        raise NotImplementedError

    def generate_itinerary(self, trip_id: int):
        raise NotImplementedError
