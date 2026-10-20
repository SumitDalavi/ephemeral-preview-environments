# Runbook — ephemeral-preview-environments
> Last updated: 2026-08-29

## Quick Start
```bash
# Bring up the cluster
kind create cluster --name preview-env-lab
```

## Run Tests / Demos
```bash
bash scripts/demo_pr_lifecycle.sh
```

## Failure Modes
| Symptom | Cause | Fix |
|---|---|---|
| Namespace not deleted | PR close webhook failed | Ensure GitHub Actions has sufficient permissions or run manual cleanup (`kubectl delete ns pr-X-preview`) |


---

## Release Runbook

### Release Trigger
Tag push matching `v*.*.*` (e.g., `v0.1.0`).

### Automated Pipeline Stages
1. **Quality & Validation Gate:** Validates policy syntax, manifest schemas, and configuration integrity.
2. **Distribution Packaging:** Bundles clean production manifests into `ephemeral-preview-environments-<tag>.tar.gz` and calculates SHA256 checksums.
3. **Syft Source SBOM:** Generates `sbom.spdx.json` adhering to SPDX 2.3 standard.
4. **GitHub Release:** Publishes release assets and release notes.

### Verification
```bash
gh release view v0.1.0 --repo SumitDalavi/ephemeral-preview-environments
gh release download v0.1.0 --repo SumitDalavi/ephemeral-preview-environments --pattern "checksums.txt"
```

### Failure Modes & Remediation
- **Linter / Test Failure:** Inspect policy syntax, configurations, or module arguments locally before tagging.
- **Checksum Mismatch:** Ensure file was completely downloaded without network truncation.
