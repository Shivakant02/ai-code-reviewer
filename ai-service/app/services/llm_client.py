import asyncio
import json
import logging
from google import genai
from app.config import get_settings
from app.models.review import ReviewResponse

logger = logging.getLogger(__name__)


class LLMClient:
    """Client for Google Gemini API with structured output and automatic fallback."""

    def __init__(self):
        settings = get_settings()
        self.client = genai.Client(api_key=settings.google_api_key)
        self.model = settings.gemini_model

    async def generate_review(self, prompt: str) -> ReviewResponse:
        """Generate a structured code review with automatic retry and model fallback."""
        # Create a deduplicated list of fallback models starting with the configured model
        base_models = [
            self.model,
            "gemini-3.6-flash",
            "gemini-3.5-flash",
            "gemini-2.5-flash",
            "gemini-3.5-flash-lite",
            "gemini-2.5-flash-lite",
        ]
        models_to_try = []
        for m in base_models:
            if m and m not in models_to_try:
                models_to_try.append(m)

        last_error = None

        for model_name in models_to_try:
            for attempt in range(1, 3):  # Try up to 2 times per model
                try:
                    logger.info(f"Calling Gemini model: {model_name} (Attempt {attempt}/2)")
                    response = self.client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=genai.types.GenerateContentConfig(
                            temperature=0.3,
                            max_output_tokens=8192,
                            response_mime_type="application/json",
                            response_schema=ReviewResponse,
                        ),
                    )

                    # Parse the structured response
                    result = json.loads(response.text)
                    review = ReviewResponse(**result)

                    logger.info(
                        f"Review generated successfully with {model_name}: score={review.score}, "
                        f"comments={len(review.comments)}"
                    )
                    return review

                except Exception as e:
                    last_error = e
                    error_str = str(e)
                    logger.warning(
                        f"Model {model_name} failed on attempt {attempt}/2: {error_str}"
                    )
                    # If 503 (High Demand) or 429 (Rate Limit), sleep briefly before retry or next model
                    if "503" in error_str or "429" in error_str or "UNAVAILABLE" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                        await asyncio.sleep(2 * attempt)
                    else:
                        # For non-transient errors (e.g. schema/400), don't retry the same model
                        break

        logger.error(f"All Gemini models failed after retries. Last error: {last_error}")
        return ReviewResponse(
            score=0,
            summary=f"Review generation failed across all fallback models. Last error: {str(last_error)}",
            comments=[],
        )


# Singleton instance
_llm_client: LLMClient | None = None


def get_llm_client() -> LLMClient:
    global _llm_client
    if _llm_client is None:
        _llm_client = LLMClient()
    return _llm_client
