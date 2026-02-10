from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import AnyUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    cluster_url: AnyUrl
    cluster_token: str
    cluster_ca_path: Path | None = None
    cluster_insecure_skip_tls_verify: bool = False
    database_url: str = Field(
        default_factory=lambda: (
            f"sqlite:///{(ROOT_DIR / 'kubevirtcenter.db').as_posix()}"
        ),
    )
    cors_allowed_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
    )
    inventory_cache_ttl_seconds: int = 300

    @property
    def cluster_name(self) -> str:
        return (
            str(self.cluster_url.host).split(".")[1]
            if self.cluster_url.host
            else "unknown"
        )

    model_config = SettingsConfigDict(
        env_file=str(ROOT_DIR / ".env"),
        env_prefix="",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
