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
  Tab,
  TabTitleText,
  Tabs,
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
  const trimmed = value.trim();
  const hasTimezone = /[zZ]|[+-]\d{2}:\d{2}$/.test(trimmed);
  const normalized = hasTimezone ? trimmed : `${trimmed}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const now = Date.now();
  const seconds = Math.round((date.getTime() - now) / 1000);
  const absSeconds = Math.abs(seconds);
  if (absSeconds < 45) {
    return "Just now";
  }

  let unit: Intl.RelativeTimeFormatUnit = "minute";
  let divisor = 60;
  if (absSeconds < 3600) {
    unit = "minute";
    divisor = 60;
  } else if (absSeconds < 86400) {
    unit = "hour";
    divisor = 3600;
  } else if (absSeconds < 604800) {
    unit = "day";
    divisor = 86400;
  } else if (absSeconds < 2629800) {
    unit = "week";
    divisor = 604800;
  } else if (absSeconds < 31557600) {
    unit = "month";
    divisor = 2629800;
  } else {
    unit = "year";
    divisor = 31557600;
  }

  const valueForUnit = Math.round(seconds / divisor);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  return formatter.format(valueForUnit, unit);
};

const formatValue = (value: number | null | undefined, digits = 0) => {
  if (value === null || value === undefined) {
    return "-";
  }
  return value.toFixed(digits);
};

const formatUptime = (seconds: number | null | undefined) => {
  if (seconds === null || seconds === undefined) {
    return "-";
  }
  const safeSeconds = Math.max(seconds, 0);
  const days = Math.floor(safeSeconds / 86400);
  const hours = Math.floor((safeSeconds % 86400) / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const parts: string[] = [];
  if (days > 0) {
    parts.push(`${days}d`);
  }
  if (hours > 0 || days > 0) {
    parts.push(`${hours}h`);
  }
  if (days === 0) {
    parts.push(`${minutes}m`);
  }
  return parts.join(" ");
};

const isReady = (status: string) => status.toLowerCase() === "ready";
const isControlPlane = (host: Host) =>
  (host.node_type ?? "").toLowerCase() === "control-plane";
const isSchedulingDisabled = (host: Host) =>
  (host.state ?? "").toLowerCase().includes("schedulingdisabled");

const statusLabel = (host: Host) => {
  if (isSchedulingDisabled(host)) {
    return (
      <Label color="orange" icon={<InfoCircleIcon />}>
        Maint Mode
      </Label>
    );
  }
  return (
    <Label
      color={isReady(host.status) ? "green" : "orange"}
      icon={isReady(host.status) ? <CheckCircleIcon /> : <ExclamationTriangleIcon />}
    >
      {host.status}
    </Label>
  );
};

function App() {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [selected, setSelected] = useState<Host | null>(null);
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("Summary");

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
                  {statusLabel(host)}
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
      <PageSection variant={PageSectionVariants.light} className="kvc-host-header">
        <div className="kvc-host-header-inner">
          <div>
            <div className="kvc-host-header-title">
              {selected ? selected.name : "Select a host"}
            </div>
            <div className="kvc-host-header-subtitle">
              {selected ? "Host details and utilization" : "Choose a host from the left"}
            </div>
          </div>
          {selected ? statusLabel(selected) : null}
        </div>
      </PageSection>

      <PageSection variant={PageSectionVariants.light} className="kvc-tabs">
        <Tabs
          activeKey={activeTab}
          onSelect={(_event, key) => {
            if (typeof key === "string") {
              setActiveTab(key);
            }
          }}
        >
          {["Summary", "Monitor", "Configure", "VMs", "Storage", "Networks"].map(
            (tab) => (
              <Tab
                key={tab}
                eventKey={tab}
                title={<TabTitleText>{tab}</TabTitleText>}
              />
            )
          )}
        </Tabs>
      </PageSection>

      {activeTab === "Summary" ? (
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
                    isHorizontal
                  >
                    <DescriptionListGroup>
                      <DescriptionListTerm>Cluster</DescriptionListTerm>
                      <DescriptionListDescription>
                        {selected.cluster ?? "-"}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Kubernetes Version</DescriptionListTerm>
                      <DescriptionListDescription>
                        {selected.kubelet_version ?? "-"}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>State</DescriptionListTerm>
                      <DescriptionListDescription>
                        {selected.state ?? selected.status}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Node Type</DescriptionListTerm>
                      <DescriptionListDescription>
                        {selected.node_type ?? "-"}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Logical Processors</DescriptionListTerm>
                      <DescriptionListDescription>
                        {selected.logical_processors ?? "-"}
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
                      <DescriptionListTerm>Uptime</DescriptionListTerm>
                      <DescriptionListDescription>
                        {formatUptime(selected.uptime_seconds)}
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

          </div>
        </PageSection>
      ) : (
        <PageSection variant={PageSectionVariants.default} className="kvc-main">
          <Card className="kvc-card kvc-card-muted">
            <CardBody>
              <EmptyState>
                <EmptyStateHeader titleText="Coming soon" headingLevel="h3" />
                <EmptyStateBody>
                  {activeTab} is on the roadmap. Check back later.
                </EmptyStateBody>
              </EmptyState>
            </CardBody>
          </Card>
        </PageSection>
      )}
    </Page>
  );
}

export default App;