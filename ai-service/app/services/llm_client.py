import json
import logging
from google import genai
from app.config import get_settings
from app.models.review import ReviewResponse

logger = logging.getLogger(__name__)


class LLMClient:
    """Client for Google Gemini API with structured output."""

    def __init__(self):
        settings = get_settings()
        self.client = genai.Client(api_key=settings.google_api_key)
        self.model = settings.gemini_model

    async def generate_review(self, prompt: str) -> ReviewResponse:
        """Generate a structured code review from the given prompt."""
        logger.info(f"Calling Gemini model: {self.model}")

        try:
            response = self.client.models.generate_content(
                model=self.model,
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
                f"Review generated: score={review.score}, "
                f"comments={len(review.comments)}"
            )
            return review

        except Exception as e:
            logger.error(f"LLM generation failed: {e}")
            # Return a fallback response
            return ReviewResponse(
                score=0,
                summary=f"Review generation failed: {str(e)}",
                comments=[],
            )


# Singleton instance
_llm_client: LLMClient | None = None


def get_llm_client() -> LLMClient:
    global _llm_client
    if _llm_client is None:
        _llm_client = LLMClient()
    return _llm_client
