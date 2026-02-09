export type Host = {
  name: string;
  cluster?: string | null;
  status: string;
  state?: string | null;
  kubelet_version?: string | null;
  logical_processors?: number | null;
  node_type?: string | null;
  cpu_cores?: number | null;
  cpu_capacity_cores?: number | null;
  cpu_allocatable_cores?: number | null;
  memory_gb?: number | null;
  memory_capacity_gb?: number | null;
  memory_allocatable_gb?: number | null;
  bmc_ip?: string | null;
  uptime_seconds?: number | null;
  updated_at: string;
};