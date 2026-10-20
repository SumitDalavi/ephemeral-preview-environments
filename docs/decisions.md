# Decisions

## ADR-001: CI Actions over CD GitOps for Previews
**Date:** 2026-08-29  
**Status:** Accepted

**Context:**  
We need a mechanism to spin up ephemeral environments when PRs are opened and destroy them when closed.

**Decision:**  
We selected GitHub Actions directly wrapping `helm install` or `kustomize` rather than configuring ArgoCD to watch PR branches.

**Consequences:**  
- ✅ Prevents polluting Git history with hundreds of transient branch manifests.
- ✅ Simplifies the event loop (PR event -> Run script).
- ⚠️ Leaves the cluster vulnerable to drift if developers manually edit the preview namespace (acceptable for ephemeral envs).

## ADR-002: Progressive Credential Loading (PCL) Architecture
- **Context:** Production hardening required live backends (PostgreSQL, Redis, OpenAI, Anthropic), but removing mocks would break CI pipelines and create high developer onboarding friction.
- **Decision:** Implement Progressive Credential Loading. Keep in-memory and local mock heuristics as the default safe baseline, while wrapping external integrations in auto-promoting factory adapters triggered by environment variables.
- **Consequences:** 
  - *Pros:* 100% CI pass rate without requiring external secrets; zero setup friction for new contributors; progressive upgrade to production clusters.
  - *Cons:* Adds lightweight factory abstraction layers and runtime credential detection logic.
