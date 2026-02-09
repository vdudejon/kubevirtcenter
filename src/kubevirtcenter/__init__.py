from __future__ import annotations

from kubevirtcenter.app import app


def main() -> None:
    import uvicorn

    uvicorn.run("kubevirtcenter.app:app", host="0.0.0.0", port=8000)
