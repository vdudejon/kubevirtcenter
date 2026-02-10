from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from kubevirtcenter.api.v1.hosts.models import HostRead
from kubevirtcenter.api.v1.hosts.service import list_hosts
from kubevirtcenter.db import get_session

router = APIRouter(prefix="/v1/hosts", tags=["hosts"])


@router.get("", response_model=list[HostRead])
def get_hosts(
    session: Annotated[Session, Depends(get_session)],
    refresh: Annotated[
        bool,
        Query(description="Force refresh host cache"),
    ] = False,
) -> list[HostRead]:
    return list_hosts(session, force_refresh=refresh)
