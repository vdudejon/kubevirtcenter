from __future__ import annotations

from datetime import UTC, datetime

from sqlmodel import Session, select

from kubevirtcenter.api.v1.hosts.models import HostRecord, HostUpsert


def list_hosts(session: Session) -> list[HostRecord]:
    return list(session.exec(select(HostRecord)))


def latest_updated_at(session: Session) -> datetime | None:
    statement = select(HostRecord.updated_at).order_by(
        HostRecord.updated_at.desc(),  # type: ignore this is a real property
    )
    return session.exec(statement).first()


def upsert_hosts(session: Session, items: list[HostUpsert]) -> None:
    if not items:
        return

    names = [item.name for item in items]
    existing_records = session.exec(
        select(HostRecord).where(HostRecord.name.in_(names)),
    ).all()
    existing_by_name = {record.name: record for record in existing_records}
    now = datetime.now(UTC)

    for item in items:
        existing = existing_by_name.get(item.name)
        if existing:
            existing.cluster = item.cluster
            existing.status = item.status
            existing.state = item.state
            existing.kubelet_version = item.kubelet_version
            existing.logical_processors = item.logical_processors
            existing.node_type = item.node_type
            existing.cpu_cores = item.cpu_cores
            existing.cpu_capacity_cores = item.cpu_capacity_cores
            existing.cpu_allocatable_cores = item.cpu_allocatable_cores
            existing.memory_gb = item.memory_gb
            existing.memory_capacity_gb = item.memory_capacity_gb
            existing.memory_allocatable_gb = item.memory_allocatable_gb
            existing.bmc_ip = item.bmc_ip
            existing.uptime_seconds = item.uptime_seconds
            existing.updated_at = now
        else:
            session.add(
                HostRecord(
                    **item.model_dump(),
                    updated_at=now,
                ),
            )
    session.commit()
