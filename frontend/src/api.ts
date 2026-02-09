import type { Host } from "./types";

export const API_BASE =
  (import.meta as { env: { VITE_API_BASE?: string } }).env.VITE_API_BASE ??
  "http://localhost:8000";

export async function fetchHosts(): Promise<Host[]> {
  const response = await fetch(`${API_BASE}/v1/hosts`);
  if (!response.ok) {
    throw new Error(`Failed to load hosts (${response.status})`);
  }
  return (await response.json()) as Host[];
}