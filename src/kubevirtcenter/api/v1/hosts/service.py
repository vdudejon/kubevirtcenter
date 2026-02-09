from __future__ import annotations

import re
from collections.abc import Iterable
from urllib.parse import urlparse, urlunparse

from kubernetes import client
from kubernetes.client import ApiException
from sqlmodel import Session

from kubevirtcenter.api.v1.hosts import crud
from kubevirtcenter.api.v1.hosts.models import HostRead, HostUpsert
from kubevirtcenter.settings import get_settings

_QUANTITY_PATTERN = re.compile(r"^([0-9.]+)([a-zA-Z]+)?$")


def _quantity_to_bytes(value: str) -> float:
    match = _QUANTITY_PATTERN.match(value)
    if not match:
        return 0.0
    number = float(match.group(1))
    suffix = match.group(2) or ""

    decimal = {
        "K": 1000**1,
        "M": 1000**2,
        "G": 1000**3,
        "T": 1000**4,
        "P": 1000**5,
        "E": 1000**6,
    }
    binary = {
        "Ki": 1024**1,
        "Mi": 1024**2,
        "Gi": 1024**3,
        "Ti": 1024**4,
        "Pi": 1024**5,
        "Ei": 1024**6,
    }

    if suffix in binary:
        return number * binary[suffix]
    if suffix in decimal:
        return number * decimal[suffix]
    return number


def _parse_cpu_cores(value: str | None) -> int | None:
    if not value:
        return None
    if value.endswith("m"):
        cores = float(value[:-1]) / 1000.0
        return int(round(cores))
    return int(float(value))


def _parse_memory_gb(value: str | None) -> float | None:
    if not value:
        return None
    bytes_value = _quantity_to_bytes(value)
    if bytes_value <= 0:
        return None
    return round(bytes_value / (1024**3), 2)


def _node_type(labels: dict[str, str] | None) -> str:
    if not labels:
        return "worker"
    if (
        "node-role.kubernetes.io/control-plane" in labels
        or "node-role.kubernetes.io/master" in labels
    ):
        return "control-plane"
    return "worker"


def _build_core_api() -> client.CoreV1Api:
    settings = get_settings()
    configuration = client.Configuration()
    configuration.host = _normalize_api_server_url(str(settings.cluster_url))
    configuration.api_key = {"authorization": settings.cluster_token}
    configuration.api_key_prefix = {"authorization": "Bearer"}
    configuration.verify_ssl = not settings.cluster_insecure_skip_tls_verify
    if settings.cluster_ca_path:
        configuration.ssl_ca_cert = str(settings.cluster_ca_path)
    return client.CoreV1Api(client.ApiClient(configuration))


def _normalize_api_server_url(raw_url: str) -> str:
    parsed = urlparse(raw_url)
    if not parsed.scheme or not parsed.netloc:
        return raw_url.rstrip("/")
    clean = parsed._replace(path="", params="", query="", fragment="")
    return urlunparse(clean).rstrip("/")


def _nodes_to_hosts(nodes: Iterable[client.V1Node]) -> list[HostUpsert]:
    settings = get_settings()
    cluster_label = settings.cluster_name
    hosts: list[HostUpsert] = []
    for node in nodes:
        conditions = {c.type: c.status for c in node.status.conditions or []}
        status = "Ready" if conditions.get("Ready") == "True" else "NotReady"
        capacity = node.status.capacity or {}
        allocatable = node.status.allocatable or {}
        labels = node.metadata.labels or {}
        hosts.append(
            HostUpsert(
                name=node.metadata.name or "unknown",
                cluster=cluster_label,
                status=status,
                node_type=_node_type(labels),
                cpu_cores=_parse_cpu_cores(capacity.get("cpu")),
                cpu_capacity_cores=_parse_cpu_cores(capacity.get("cpu")),
                cpu_allocatable_cores=_parse_cpu_cores(allocatable.get("cpu")),
                memory_gb=_parse_memory_gb(capacity.get("memory")),
                memory_capacity_gb=_parse_memory_gb(capacity.get("memory")),
                memory_allocatable_gb=_parse_memory_gb(allocatable.get("memory")),
                bmc_ip=None,
            )
        )
    return hosts


def _fetch_hosts_from_cluster() -> list[HostUpsert]:
    try:
        api = _build_core_api()
        nodes = api.list_node().items
    except ApiException as exc:
        raise RuntimeError(f"Failed to list nodes: {exc.reason}") from exc
    return _nodes_to_hosts(nodes)


def list_hosts(session: Session) -> list[HostRead]:
    hosts = crud.list_hosts(session)
    if not hosts:
        crud.upsert_hosts(session, _fetch_hosts_from_cluster())
        hosts = crud.list_hosts(session)
    return [HostRead.model_validate(host) for host in hosts]
