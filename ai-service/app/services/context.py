import logging
from app.models.review import ReviewRequest

logger = logging.getLogger(__name__)


class ContextBuilder:
    """Builds context from repository data for the AI review prompt."""

    def build_context(self, request: ReviewRequest) -> str:
        """Build a context string from the review request."""
        parts: list[str] = []

        # Repository context
        if request.context.repo_name:
            parts.append(f"Repository: {request.context.repo_name}")

        if request.context.readme:
            readme_truncated = request.context.readme[:2000]
            parts.append(f"## Repository README (truncated)\n{readme_truncated}")

        return "\n\n".join(parts)

    def build_files_context(self, request: ReviewRequest) -> str:
        """Build a formatted string of all file changes."""
        file_sections: list[str] = []

        for f in request.files:
            if not f.patch:
                continue

            section = (
                f"### File: {f.filename}\n"
                f"Status: {f.status} | "
                f"+{f.additions} -{f.deletions}\n"
                f"```diff\n{f.patch}\n```"
            )
            file_sections.append(section)

        return "\n\n".join(file_sections)


# Singleton
_context_builder: ContextBuilder | None = None


def get_context_builder() -> ContextBuilder:
    global _context_builder
    if _context_builder is None:
        _context_builder = ContextBuilder()
    return _context_builder
