import logging
import time
from app.models.review import ReviewRequest, ReviewResponse
from app.services.llm_client import get_llm_client
from app.services.context import get_context_builder

logger = logging.getLogger(__name__)

REVIEW_SYSTEM_PROMPT = """You are an expert AI code reviewer. You analyze pull request diffs and provide thorough, actionable code review feedback.

## Your Review Process

1. Analyze each file's diff carefully
2. Identify issues across these categories:
   - **Security**: SQL injection, XSS, authentication/authorization flaws, secrets exposure, input validation
   - **Performance**: N+1 queries, memory leaks, expensive loops, duplicate API calls, unnecessary re-renders
   - **Readability**: Poor naming, overly complex functions, missing comments for complex logic
   - **Architecture**: Layer violations, SOLID principle violations, separation of concerns issues
   - **Reliability**: Missing error handling, missing null checks, missing retry logic, inadequate logging

3. For each issue found, provide:
   - The exact file path and line number from the diff
   - A severity level: `critical` (must fix), `warning` (should fix), `suggestion` (nice to have), or `praise` (good practice)
   - A clear explanation of the issue
   - A suggested fix when applicable

4. Calculate an overall quality score (0-100) based on:
   - 90-100: Excellent code, minor suggestions only
   - 70-89: Good code with some improvements needed
   - 50-69: Acceptable but has notable issues
   - 30-49: Below standard, significant issues
   - 0-29: Critical issues that must be addressed

## Important Rules
- Only comment on lines that appear in the diff (lines starting with + or -)
- Line numbers should reference the position in the NEW file (right side of the diff)
- Be constructive and specific — avoid vague feedback
- Praise good patterns you notice (use severity: "praise")
- Focus on substantive issues, not style nitpicks
- If the code looks good overall, say so and still provide suggestions for improvement
"""


class ReviewService:
    """Orchestrates the AI code review pipeline."""

    async def review(self, request: ReviewRequest) -> ReviewResponse:
        """Perform an AI code review on the given PR."""
        start_time = time.time()

        logger.info(
            f"Starting review for PR #{request.pull_request.number}: "
            f"{request.pull_request.title} ({len(request.files)} files)"
        )

        # Build context
        context_builder = get_context_builder()
        repo_context = context_builder.build_context(request)
        files_context = context_builder.build_files_context(request)

        if not files_context.strip():
            logger.warn("No file diffs to review")
            return ReviewResponse(
                score=100,
                summary="No code changes to review — all changes are binary or empty diffs.",
                comments=[],
            )

        # Build the full prompt
        prompt = self._build_prompt(request, repo_context, files_context)

        # Call LLM
        llm_client = get_llm_client()
        result = await llm_client.generate_review(prompt)

        duration = time.time() - start_time
        logger.info(
            f"Review completed in {duration:.2f}s: "
            f"score={result.score}, comments={len(result.comments)}"
        )

        return result

    def _build_prompt(
        self,
        request: ReviewRequest,
        repo_context: str,
        files_context: str,
    ) -> str:
        """Build the complete prompt for the LLM."""
        pr = request.pull_request

        prompt_parts = [
            REVIEW_SYSTEM_PROMPT,
            "\n---\n",
            "## Pull Request Information",
            f"**Title:** {pr.title}",
            f"**Author:** {pr.author}",
            f"**Branch:** {pr.head_branch} → {pr.base_branch}",
        ]

        if pr.description:
            prompt_parts.append(f"**Description:**\n{pr.description[:1000]}")

        if repo_context:
            prompt_parts.extend(["\n---\n", "## Repository Context", repo_context])

        prompt_parts.extend([
            "\n---\n",
            "## Changed Files",
            files_context,
            "\n---\n",
            "Please provide your comprehensive code review now.",
        ])

        return "\n\n".join(prompt_parts)


# Singleton
_review_service: ReviewService | None = None


def get_review_service() -> ReviewService:
    global _review_service
    if _review_service is None:
        _review_service = ReviewService()
    return _review_service
