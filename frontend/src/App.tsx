import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  EmptyState,
  EmptyStateBody,
  EmptyStateHeader,
  EmptyStateIcon,
  Label,
  Masthead,
  MastheadBrand,
  MastheadContent,
  MastheadMain,
  Nav,
  NavGroup,
  NavItem,
  NavList,
  Page,
  PageSection,
  PageSectionVariants,
  PageSidebar,
  Progress,
  Spinner,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  CheckCircleIcon,
  ClusterIcon,
  ExclamationTriangleIcon,
  InfoCircleIcon,
  ServerIcon,
  SyncAltIcon,
} from "@patternfly/react-icons";

import { API_BASE, fetchHosts } from "./api";
import type { Host } from "./types";

type LoadState = "idle" | "loading" | "error";

const formatUpdatedAt = (value: string | undefined) => {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
};

const formatValue = (value: number | null | undefined, digits = 0) => {
  if (value === null || value === undefined) {
    return "-";
  }
  return value.toFixed(digits);
};

const isReady = (status: string) => status.toLowerCase() === "ready";
const isControlPlane = (host: Host) =>
  (host.node_type ?? "").toLowerCase() === "control-plane";

const statusLabel = (status: string) => (
  <Label
    color={isReady(status) ? "green" : "orange"}
    icon={isReady(status) ? <CheckCircleIcon /> : <ExclamationTriangleIcon />}
  >
    {status}
  </Label>
);

function App() {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [selected, setSelected] = useState<Host | null>(null);
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState<string>("");

  const clusterName = useMemo(
    () => hosts[0]?.cluster ?? "KubeVirt Cluster",
    [hosts]
  );

  const sortedHosts = useMemo(() => {
    return [...hosts].sort((left, right) => {
      const leftRank = isControlPlane(left) ? 0 : 1;
      const rightRank = isControlPlane(right) ? 0 : 1;
      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }
      return left.name.localeCompare(right.name);
    });
  }, [hosts]);

  const loadHosts = useCallback(async () => {
    setState("loading");
    setError("");
    try {
      const data = await fetchHosts();
      setHosts(data);
      setSelected((current) => {
        if (!data.length) {
          return null;
        }
        if (!current || !data.find((item) => item.name === current.name)) {
          return data[0];
        }
        return current;
      });
      setState("idle");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Failed to load hosts");
    }
  }, []);

  useEffect(() => {
    void loadHosts();
  }, [loadHosts]);

  const cpuTotal = selected?.cpu_capacity_cores ?? null;
  const cpuAlloc = selected?.cpu_allocatable_cores ?? null;
  const cpuUsed =
    cpuTotal !== null && cpuAlloc !== null
      ? Math.max(cpuTotal - cpuAlloc, 0)
      : null;
  const memTotal = selected?.memory_capacity_gb ?? null;
  const memAlloc = selected?.memory_allocatable_gb ?? null;
  const memUsed =
    memTotal !== null && memAlloc !== null
      ? Math.max(memTotal - memAlloc, 0)
      : null;

  const masthead = (
    <Masthead className="kvc-masthead">
      <MastheadMain>
        <MastheadBrand className="kvc-brand">
          <div className="kvc-brand-title">KubeVirtCenter</div>
          <div className="kvc-brand-subtitle">Inventory view</div>
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>
        <Toolbar>
          <ToolbarContent>
            <ToolbarItem>
              <div className="kvc-api-pill">API: {API_BASE}</div>
            </ToolbarItem>
            <ToolbarItem>
              <Button
                icon={<SyncAltIcon />}
                variant="secondary"
                onClick={loadHosts}
              >
                Refresh
              </Button>
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>
      </MastheadContent>
    </Masthead>
  );

  const sidebar = (
    <PageSidebar className="kvc-sidebar">
      <Nav className="kvc-nav">
        <NavList>
          <NavGroup
            title={
              <span className="kvc-cluster-title">
                <ClusterIcon />
                <span className="kvc-cluster-title-text" title={clusterName}>
                  {clusterName}
                </span>
              </span>
            }
          >
            {sortedHosts.map((host) => (
              <NavItem
                key={host.name}
                isActive={selected?.name === host.name}
                onClick={() => setSelected(host)}
              >
                <span className="kvc-host-row">
                  <span className="kvc-host-name">
                    <ServerIcon
                      className={
                        isControlPlane(host)
                          ? "kvc-host-icon control-plane"
                          : "kvc-host-icon"
                      }
                    />
                    {host.name}
                  </span>
                  {statusLabel(host.status)}
                </span>
              </NavItem>
            ))}
          </NavGroup>
        </NavList>
      </Nav>
    </PageSidebar>
  );

  return (
    <Page header={masthead} sidebar={sidebar} isManagedSidebar>
      <PageSection variant={PageSectionVariants.light} className="kvc-hero">
        <div className="kvc-hero-inner">
          <div>
            <div className="kvc-hero-title">Hosts</div>
            <div className="kvc-hero-subtitle">
              Hardware-centric view aligned with vCenter workflows.
            </div>
          </div>
          <div className="kvc-hero-metrics">
            <div>
              <div className="kvc-metric-label">Cluster</div>
              <div className="kvc-metric-value kvc-ellipsis" title={clusterName}>
                {clusterName}
              </div>
            </div>
            <div>
              <div className="kvc-metric-label">Hosts</div>
              <div className="kvc-metric-value">{hosts.length}</div>
            </div>
          </div>
        </div>
      </PageSection>

      <PageSection variant={PageSectionVariants.default} className="kvc-main">
        <div className="kvc-grid">
          <Card className="kvc-card kvc-card-capacity">
            <CardHeader>
              <div>
                <CardTitle>Host Summary</CardTitle>
                <div className="kvc-card-subtitle">
                  {selected ? selected.name : "Select a host"}
                </div>
              </div>
              {selected ? statusLabel(selected.status) : null}
            </CardHeader>
            <CardBody className="kvc-capacity-body">
              {state === "loading" ? (
                <EmptyState>
                  <EmptyStateHeader
                    titleText="Loading inventory"
                    headingLevel="h3"
                    icon={<EmptyStateIcon icon={Spinner} />}
                  />
                  <EmptyStateBody>Refreshing cached host data.</EmptyStateBody>
                </EmptyState>
              ) : null}
              {state === "error" ? (
                <EmptyState>
                  <EmptyStateHeader
                    titleText="Unable to load hosts"
                    headingLevel="h3"
                    icon={<EmptyStateIcon icon={ExclamationTriangleIcon} />}
                  />
                  <EmptyStateBody>{error}</EmptyStateBody>
                </EmptyState>
              ) : null}
              {state === "idle" && selected ? (
                <DescriptionList
                  className="kvc-description"
                  columnModifier={{ default: "2Col" }}
                >
                  <DescriptionListGroup>
                    <DescriptionListTerm>Cluster</DescriptionListTerm>
                    <DescriptionListDescription>
                      {selected.cluster ?? "-"}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Node Type</DescriptionListTerm>
                    <DescriptionListDescription>
                      {selected.node_type ?? "-"}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>CPU Cores</DescriptionListTerm>
                    <DescriptionListDescription>
                      {selected.cpu_cores ?? "-"}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Memory (GB)</DescriptionListTerm>
                    <DescriptionListDescription>
                      {selected.memory_gb ?? "-"}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>BMC IP</DescriptionListTerm>
                    <DescriptionListDescription>
                      {selected.bmc_ip ?? "-"}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Last Updated</DescriptionListTerm>
                    <DescriptionListDescription>
                      {formatUpdatedAt(selected.updated_at)}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              ) : null}
            </CardBody>
          </Card>

          <Card className="kvc-card">
            <CardHeader>
              <div>
                <CardTitle>Capacity &amp; Usage</CardTitle>
                <div className="kvc-card-subtitle">
                  Usage displays current reserved resources, not live usage.
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <div className="kvc-capacity-bars">
                <div>
                  <div className="kvc-capacity-title">CPU Usage (GHz)</div>
                  {cpuTotal !== null && cpuUsed !== null ? (
                    <Progress
                      value={cpuUsed}
                      min={0}
                      max={cpuTotal}
                      className="kvc-progress"
                      label={`${formatValue(cpuUsed, 1)} / ${formatValue(
                        cpuTotal,
                        1
                      )} GHz`}
                    />
                  ) : (
                    <div className="kvc-capacity-empty">Not available</div>
                  )}
                </div>
                <div>
                  <div className="kvc-capacity-title">Memory Usage (GB)</div>
                  {memTotal !== null && memUsed !== null ? (
                    <Progress
                      value={memUsed}
                      min={0}
                      max={memTotal}
                      className="kvc-progress"
                      label={`${formatValue(memUsed, 1)} / ${formatValue(
                        memTotal,
                        1
                      )} GB`}
                    />
                  ) : (
                    <div className="kvc-capacity-empty">Not available</div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="kvc-card kvc-card-muted">
            <CardHeader>
              <div>
                <CardTitle>Inventory Cache</CardTitle>
                <div className="kvc-card-subtitle">
                  Cached cluster state for fast UI responses.
                </div>
              </div>
              <Label icon={<InfoCircleIcon />} color="blue">
                Cache
              </Label>
            </CardHeader>
            <Divider />
            <CardBody>
              <DescriptionList columnModifier={{ default: "1Col" }}>
                <DescriptionListGroup>
                  <DescriptionListTerm>Records</DescriptionListTerm>
                  <DescriptionListDescription>
                    {hosts.length}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Cluster Endpoint</DescriptionListTerm>
                  <DescriptionListDescription>
                    <span className="kvc-ellipsis" title={clusterName}>
                      {clusterName}
                    </span>
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </CardBody>
          </Card>
        </div>
      </PageSection>
    </Page>
  );
}

export default App;