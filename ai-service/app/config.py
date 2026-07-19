from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Google AI
    google_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"

    # Server
    ai_service_port: int = 8000
    debug: bool = False

    # CORS
    frontend_url: str = "http://localhost:5173"
    backend_url: str = "http://localhost:3001"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
