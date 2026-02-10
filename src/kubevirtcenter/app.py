from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from kubevirtcenter.api.v1.hosts.views import router as hosts_router
from kubevirtcenter.db import init_db
from kubevirtcenter.settings import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


def create_app() -> FastAPI:

    app = FastAPI(title="KubeVirtCenter", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(hosts_router)

    return app


app = create_app()
