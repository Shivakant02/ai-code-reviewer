import logging
from fastapi import APIRouter, HTTPException
from app.models.review import ReviewRequest, ReviewResponse
from app.services.reviewer import get_review_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Review"])


@router.post("/review", response_model=ReviewResponse)
async def create_review(request: ReviewRequest) -> ReviewResponse:
    """
    Perform an AI code review on the given pull request.
    
    Accepts PR metadata and file diffs, returns structured review
    with score, summary, and file-level comments.
    """
    try:
        service = get_review_service()
        result = await service.review(request)
        return result
    except Exception as e:
        logger.error(f"Review failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Review generation failed: {str(e)}",
        )
