export type Host = {
  name: string;
  cluster?: string | null;
  status: string;
  node_type?: string | null;
  cpu_cores?: number | null;
  cpu_capacity_cores?: number | null;
  cpu_allocatable_cores?: number | null;
  memory_gb?: number | null;
  memory_capacity_gb?: number | null;
  memory_allocatable_gb?: number | null;
  bmc_ip?: string | null;
  updated_at: string;
};