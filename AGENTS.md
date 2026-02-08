# KubeVirtCenter Agents & Workers

To maintain a "vCenter-like" experience, KubeVirtCenter relies on background agents to ensure the UI is never waiting on slow Kubernetes API queries.

## 1. The Hardware Watcher (The "Sensory" Agent)
**Responsibility:** Listen for real-time changes in the physical layer.
- **Source Data:** `BareMetalHost` (BMH) and `Node` objects.
- **Logic:** Uses `kopf` or a `watch` loop to detect changes in hardware health, power status, or maintenance mode.
- **Output:** Publishes an update event to the Inventory Architect via NATS.

## 2. The Inventory Architect (The "Memory" Agent)
**Responsibility:** Maintain the Source of Truth in PostgreSQL.
- **Logic:** Subscribes to hardware events and performs "Enriched Upserts."
- **Enrichment:**
    - Joins `Node` logical data (CPU/RAM usage) with `BMH` physical data (Serial Number, iDRAC IP).
    - Maps `NetworkAttachmentDefinitions` to specific physical NICs for the "Port Group" view.
- **Database:** SQLModel/PostgreSQL.

## 3. The API Gatekeeper (The "Communication" Agent)
**Responsibility:** Serve the Frontend.
- **Framework:** FastAPI.
- **Logic:** Provides high-speed JSON endpoints for the Clarity UI. 
- **Endpoint Focus:** - `/v1/hosts`: Returns a rollup of physical health and logical capacity.
    - `/v1/datastores`: Returns StorageClass health and backend utilization.
    - `/v1/networking`: Returns NAD-to-VLAN mappings.
