import logging
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.schemas.itinerary import ItineraryRequest, ItineraryResponse
from app.services.itinerary import generate_itinerary
from app.services.pdf import generate_itinerary_pdf

logger = logging.getLogger("voyageai.trips")

router = APIRouter(prefix="/trips", tags=["Trips"])


@router.post("/generate-itinerary", response_model=ItineraryResponse)
async def create_itinerary(
    body: ItineraryRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate an AI-powered day-wise travel itinerary."""
    try:
        result = generate_itinerary(
            destination=body.destination,
            budget=body.budget,
            days=body.days,
            interests=body.interests,
        )
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate itinerary: {e}",
        )


@router.post("/export-pdf")
async def export_itinerary_pdf(
    body: ItineraryResponse,
    current_user: User = Depends(get_current_user),
):
    """Generate and return a PDF binary buffer for the provided itinerary."""
    logger.info(f"[API Route] Received PDF export request for user '{current_user.id}' and destination '{body.destination}'")
    try:
        pdf_bytes = generate_itinerary_pdf(body)
        safe_destination = "".join(c if c.isalnum() else "_" for c in body.destination)
        filename = f"Itinerary_{safe_destination}.pdf"
        logger.info(f"[API Route] PDF successfully generated ({len(pdf_bytes)} bytes). Returning Response headers.")
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )
    except Exception as e:
        logger.error(f"[API Route ERROR] Failed to export PDF: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export itinerary PDF: {e}",
        )

