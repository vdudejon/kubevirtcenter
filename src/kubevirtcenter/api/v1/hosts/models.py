from __future__ import annotations

from datetime import UTC, datetime

from sqlmodel import Field, SQLModel


def utcnow() -> datetime:
    return datetime.now(UTC)


class HostRecord(SQLModel, table=True):
    """Cached host inventory row."""

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    cluster: str | None = None
    status: str
    node_type: str | None = None
    cpu_cores: int | None = None
    cpu_capacity_cores: int | None = None
    cpu_allocatable_cores: int | None = None
    memory_gb: float | None = None
    memory_capacity_gb: float | None = None
    memory_allocatable_gb: float | None = None
    bmc_ip: str | None = None
    updated_at: datetime = Field(default_factory=utcnow)


class HostUpsert(SQLModel):
    """Incoming host payload used for cache updates."""

    name: str
    cluster: str | None = None
    status: str
    node_type: str | None = None
    cpu_cores: int | None = None
    cpu_capacity_cores: int | None = None
    cpu_allocatable_cores: int | None = None
    memory_gb: float | None = None
    memory_capacity_gb: float | None = None
    memory_allocatable_gb: float | None = None
    bmc_ip: str | None = None


class HostRead(SQLModel):
    """API response model for hosts."""

    name: str
    cluster: str | None = None
    status: str
    node_type: str | None = None
    cpu_cores: int | None = None
    cpu_capacity_cores: int | None = None
    cpu_allocatable_cores: int | None = None
    memory_gb: float | None = None
    memory_capacity_gb: float | None = None
    memory_allocatable_gb: float | None = None
    bmc_ip: str | None = None
    updated_at: datetime
