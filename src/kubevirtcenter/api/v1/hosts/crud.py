from __future__ import annotations

from datetime import UTC, datetime

from sqlmodel import Session, select

from kubevirtcenter.api.v1.hosts.models import HostRecord, HostUpsert


def _utcnow() -> datetime:
    return datetime.now(UTC)


def list_hosts(session: Session) -> list[HostRecord]:
    return list(session.exec(select(HostRecord)))


def upsert_hosts(session: Session, items: list[HostUpsert]) -> None:
    for item in items:
        existing = session.exec(
            select(HostRecord).where(HostRecord.name == item.name),
        ).first()
        if existing:
            existing.cluster = item.cluster
            existing.status = item.status
            existing.node_type = item.node_type
            existing.cpu_cores = item.cpu_cores
            existing.cpu_capacity_cores = item.cpu_capacity_cores
            existing.cpu_allocatable_cores = item.cpu_allocatable_cores
            existing.memory_gb = item.memory_gb
            existing.memory_capacity_gb = item.memory_capacity_gb
            existing.memory_allocatable_gb = item.memory_allocatable_gb
            existing.bmc_ip = item.bmc_ip
            existing.updated_at = _utcnow()
        else:
            session.add(
                HostRecord(
                    **item.model_dump(),
                    updated_at=_utcnow(),
                ),
            )
    session.commit()
