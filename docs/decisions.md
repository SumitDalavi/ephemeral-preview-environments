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
