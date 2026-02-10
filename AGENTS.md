IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning

[Index] | frontend/ | frontend/index.html | frontend/package-lock.json | frontend/package.json | frontend/src/ | frontend/src/App.tsx | frontend/src/api.ts | frontend/src/main.tsx | frontend/src/styles.css | frontend/src/types.ts | frontend/src/vite-env.d.ts | frontend/tsconfig.json | frontend/tsconfig.node.json | frontend/vite.config.ts | src/ | src/kubevirtcenter/ | src/kubevirtcenter/__init__.py | src/kubevirtcenter/api/ | src/kubevirtcenter/api/__init__.py | src/kubevirtcenter/api/v1/ | src/kubevirtcenter/api/v1/__init__.py | src/kubevirtcenter/api/v1/hosts/ | src/kubevirtcenter/api/v1/hosts/__init__.py | src/kubevirtcenter/api/v1/hosts/crud.py | src/kubevirtcenter/api/v1/hosts/exceptions.py | src/kubevirtcenter/api/v1/hosts/models.py | src/kubevirtcenter/api/v1/hosts/service.py | src/kubevirtcenter/api/v1/hosts/views.py | src/kubevirtcenter/app.py | src/kubevirtcenter/db.py | src/kubevirtcenter/settings.py |

# KubeVirtCenter Caching Model

KubeVirtCenter uses a lazy, cache-on-first-use approach to keep the UI fast without requiring background agents or a long-running worker pipeline.

## 1. Lazy Inventory Cache
**Responsibility:** Populate cached inventory on first API request.
- **Source Data:** `Node` objects (initially).
- **Logic:** The first call to `/v1/hosts` fetches from the Kubernetes API and persists results in the local cache.
- **Storage:** SQLModel with a local SQLite file for fast reads.

## 2. API Surface
**Responsibility:** Serve the Frontend.
- **Framework:** FastAPI.
- **Logic:** Reads from the cache for UI performance. On empty cache, it triggers a fetch and then responds.
- **Endpoint Focus:**
    - `/v1/hosts`: Returns a rollup of physical health and logical capacity.
    - `/v1/storage`: Returns StorageClass health and backend utilization. (future)
    - `/v1/networking`: Returns NAD-to-VLAN mappings. (future)

## 3. Future Enhancements (Optional)
**Responsibility:** Improve freshness without mandatory agents.
- On-demand refresh endpoints or periodic background refresh.
- Enrich inventory with `BareMetalHost` data when needed.

## Indexing for AGENTS.md
When asked to update the index in AGENTS.md, do not include generated folders like .venv or node_modules, or things like *.db or .env.  Only index folders related to code.

## Commit Convention

Follow Conventional Commits for semantic-release automation.

**Version-bumping types** (use only for user-facing changes):
| Type | Bump | Use For |
|------|------|---------|
| `feat` | Minor | New functionality |
| `fix` | Patch | Bug fixes |

**Non-bumping types** (no release triggered):
| Type | Use For |
|------|---------|
| `test` | Adding or modifying tests |
| `refactor` | Code restructuring without behavior change |
| `chore` | Maintenance, dependencies, tooling |
| `docs` | Documentation only |
| `ci` | CI/CD pipeline changes |
| `style` | Formatting, whitespace |
