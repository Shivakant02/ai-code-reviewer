from pydantic import BaseModel, Field


class PullRequestInfo(BaseModel):
    """Pull request metadata."""
    number: int
    title: str
    description: str = ""
    author: str = ""
    base_branch: str = "main"
    head_branch: str = ""


class FileChange(BaseModel):
    """A single file changed in the PR."""
    filename: str
    status: str = "modified"  # added, modified, removed, renamed
    additions: int = 0
    deletions: int = 0
    patch: str = ""


class RepoContext(BaseModel):
    """Repository context for the review."""
    readme: str = ""
    repo_name: str = ""


class ReviewRequest(BaseModel):
    """Request payload for code review."""
    pull_request: PullRequestInfo
    files: list[FileChange]
    context: RepoContext = RepoContext()


class ReviewComment(BaseModel):
    """A single review comment on a specific file/line."""
    file: str = Field(description="File path")
    line: int = Field(description="Line number in the diff")
    end_line: int | None = Field(default=None, description="End line for multi-line comments")
    severity: str = Field(description="One of: critical, warning, suggestion, praise")
    category: str = Field(description="One of: security, performance, readability, architecture, reliability")
    body: str = Field(description="The review comment in markdown")
    suggestion: str | None = Field(default=None, description="Suggested code fix")


class ReviewResponse(BaseModel):
    """Response from the AI code review."""
    score: int = Field(ge=0, le=100, description="Overall quality score 0-100")
    summary: str = Field(description="High-level summary of the review")
    comments: list[ReviewComment] = Field(default_factory=list)
