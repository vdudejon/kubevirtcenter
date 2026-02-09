from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from kubevirtcenter.api.v1.hosts.views import router as hosts_router
from kubevirtcenter.db import init_db
from kubevirtcenter.settings import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="KubeVirtCenter")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(hosts_router)

    @app.on_event("startup")
    def _startup() -> None:
        init_db()

    return app


app = create_app()
