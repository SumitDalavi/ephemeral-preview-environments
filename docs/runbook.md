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
