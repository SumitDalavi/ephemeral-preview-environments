> **NOTE:** This repository is an archival lab or partial prototype. It is not actively maintained and should not be used as a reference for production-grade deployments or performance benchmarks.

# Ephemeral Preview Environments Platform 🚀🗑️

[![CI Pipeline](https://github.com/SumitDalavi/ephemeral-preview-environments/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/SumitDalavi/ephemeral-preview-environments/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/SumitDalavi/ephemeral-preview-environments?color=0969da&label=release&logo=github)](https://github.com/SumitDalavi/ephemeral-preview-environments/releases)
[![Release Workflow](https://github.com/SumitDalavi/ephemeral-preview-environments/actions/workflows/release.yml/badge.svg)](https://github.com/SumitDalavi/ephemeral-preview-environments/actions/workflows/release.yml)
[![SBOM](https://img.shields.io/badge/SBOM-SPDX%202.3-blueviolet?logo=spdx)](https://github.com/SumitDalavi/ephemeral-preview-environments/releases/tag/v0.2.0)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

> **Maturity:** Lab / Reference Implementation
> _A developer experience platform that dynamically provisions isolated Kubernetes environments for every Pull Request and automatically destroys them on merge, accelerating feedback loops._

## The Problem

Developers often wait days to merge code because QA or Product teams need to test changes on a shared "Staging" environment. This creates a massive bottleneck. If two developers deploy conflicting branches to Staging, testing is blocked.

## The Solution

This project implements **Ephemeral Preview Environments**. 
When a developer opens a Pull Request:
1. A GitHub Actions workflow is triggered.
2. It dynamically provisions a new Kubernetes namespace (e.g., `pr-124-preview`).
3. It builds the code, deploys the microservice, and spins up temporary dependencies (like a disposable PostgreSQL container).
4. It comments on the PR with a unique URL (e.g., `https://pr-124.preview.mycompany.com`).
5. Product owners can click the link and test the exact feature branch in isolation.
6. When the PR is merged or closed, a teardown workflow deletes the namespace, freeing up cluster resources.

## Why This Over the Obvious Alternative

The alternative is maintaining static "Dev1", "Dev2", and "QA" environments. Static environments suffer from configuration drift, database state corruption, and resource waste (running 24/7 even when nobody is testing). Ephemeral environments are the pinnacle of Platform Engineering, optimizing strictly for Developer Experience (DevEx) and lead time.

## 🛠️ Tech Stack

- **Orchestration**: GitHub Actions
- **Deployment**: Helm (or Kustomize)
- **Routing**: NGINX Ingress / ExternalDNS

## Decision Log

| Decision | Rationale |
|----------|-----------|
| GitHub Actions over Argo CD | While GitOps (ArgoCD) is best for long-lived environments (Staging/Prod), creating hundreds of temporary Git branches for ArgoCD to sync PR environments creates unnecessary Git history pollution. GitHub Actions is better suited for imperative, short-lived deployments. |
| In-cluster databases | For preview environments, we deploy a lightweight database container (e.g., bitnami/postgresql) inside the namespace rather than provisioning a heavy cloud RDS instance to ensure creation time is < 2 minutes. |

## 📁 Project Structure

```
├── .github/
│   ├── workflows/
│   │   ├── preview-env-up.yaml    # Triggered on PR open/synchronize
│   │   └── preview-env-down.yaml  # Triggered on PR close/merge
├── docs/ARCHITECTURE.md
└── README.md
```

## 📋 Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| [GitHub Account](https://github.com/) | â€” | Repository hosting & Actions |
| [kubectl](https://kubernetes.io/docs/tasks/tools/) | >= 1.28 | Kubernetes CLI |
| Kubernetes Cluster | Any | Target for preview environments |
| [Helm](https://helm.sh/) | >= 3.x | Package manager |

## 🚀 Step-by-Step Setup

### Step 1: Fork the repository
```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/<YOUR_USERNAME>/ephemeral-preview-environments.git
cd ephemeral-preview-environments
```

### Step 2: Configure GitHub Secrets
In your forked repo, go to **Settings â†’ Secrets and Variables â†’ Actions** and add:

| Secret | Value |
|--------|-------|
| `KUBE_CONFIG` | Base64-encoded kubeconfig for your cluster |
| `DOCKER_REGISTRY` | Your container registry (e.g., `ghcr.io/username`) |

### Step 3: Configure cluster access
```bash
# Ensure your cluster has an Ingress controller installed
kubectl get ingressclass

# If not, install NGINX Ingress
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx
```

## 🧪 Usage & Demo

### Trigger a preview environment
1. Create a new branch and make a code change
2. Open a **Pull Request** on GitHub
3. The `preview-env-up.yaml` workflow automatically:
   - Creates a namespace `pr-<NUMBER>-preview`
   - Builds and deploys the application
   - Comments on the PR with the preview URL

### Observe the environment
```bash
# List preview namespaces
kubectl get namespaces | grep preview

# Check resources in the preview namespace
kubectl get all -n pr-<NUMBER>-preview
```

### Automatic teardown
When the PR is **merged or closed**, the `preview-env-down.yaml` workflow automatically deletes the preview namespace and all resources.

## ✅ Verification

| Check | Action | Expected |
|-------|--------|----------|
| Workflow triggers | Open a PR | Actions tab shows running workflow |
| Namespace created | `kubectl get ns \| grep preview` | pr-X-preview namespace |
| App deployed | `kubectl get pods -n pr-X-preview` | Pod(s) running |
| PR comment | Check PR thread | Preview URL posted |
| Teardown | Close/merge PR | Namespace deleted |

## 👨‍💻 Author

**Sumit Dalavi** — Senior DevSecOps / Platform Engineer
[GitHub](https://github.com/SumitDalavi) | [LinkedIn](https://in.linkedin.com/in/sumit-dalavi-762838129)

## 🚀 Progressive Credential Loading & Execution Tiers

This project implements **Progressive Credential Loading (PCL)**, allowing it to run immediately out-of-the-box without external dependencies while seamlessly upgrading as credentials are provided.

### Tier 1: Zero-Config Mock Mode (Default)
Ideal for CI, testing, and rapid local evaluation.
- **Execution:** Run with default configuration (`cp .env.example .env`). Zero API keys, databases, or cloud credentials required.
- **Fallback Behavior:** In-memory caches, deterministic offline heuristics, mock vector embeddings, and local mock storage are automatically used.
- **Health Verification:** Endpoints report `{"mode": "mock"}` for unconfigured dependencies.

### Tier 2: Local Development with Live Services
Connect specific external services while keeping others mocked.
- **Execution:** Provide credentials in `.env` for the services you want active (e.g., `GITHUB_WEBHOOK_SECRET, BASE_DOMAIN, MAX_AGE_HOURS`).
- **Progressive Upgrade:** The runtime inspects environment variables on boot and dynamically promotes only configured modules to live mode.
- **Safe Fallback:** Any missing credentials automatically remain on mock fallbacks with no crashes or missing service errors.

### Tier 3: Production Hardened
Enterprise deployment with production-grade backends, security scans, and container distributions.
- **Release Distribution:** Download standalone release bundle and verified checksums:
  ```bash
  gh release download v0.2.0 --repo SumitDalavi/ephemeral-preview-environments
  ```
- **Integrity & Security:** Checksums and SPDX SBOM (`sbom.spdx.json`) available on [GitHub Releases](https://github.com/SumitDalavi/ephemeral-preview-environments/releases).

## 📚 Documentation

- [Architecture](docs/ARCHITECTURE.md) — System diagram and component details
- [Runbook](docs/runbook.md) — Setup, commands, and expected outputs
- [Decisions](docs/decisions.md) — ADRs for Ephemeral Environments
- [Changelog](docs/changelog.md) — Change history

## Mock Boundaries (Honest Scope)

| What | Status | Details |
|---|---|---|
| Kubernetes Cluster | **Real** | Namespaces are fully provisioned and isolated in a local `kind` cluster. |
| CI Pipeline (GitHub Actions) | **Mocked** | E2E demo simulates the GitHub Actions payload and API calls to comment on PRs. |
| Ingress / DNS | **Mocked** | E2E demo simulates standard DNS provisioning via `/etc/hosts` for local testing. |

## 🔗 Related Projects

- [`multi-cluster-gitops-promotion`](../multi-cluster-gitops-promotion/) — Demonstrates promotion from these ephemeral environments up to Staging/Prod.

---

## Release & Security Verification

This repository is published as an immutable release catalog under the portfolio release standard:

- **Release Artifacts:** Authenticated distribution bundle (`ephemeral-preview-environments-v0.1.0.tar.gz`) containing production policies, modules, and manifests.
- **Cryptographic Integrity:** SHA-256 integrity hash provided in `checksums.txt`.
- **Software Bill of Materials (SBOM):** Fully compliant SPDX JSON SBOM (`sbom.spdx.json`) generated by Anchore Syft.

### Verification Commands
```bash
# 1. View Release Metadata
gh release view v0.1.0 --repo SumitDalavi/ephemeral-preview-environments

# 2. Download Release Assets & Verify SHA256 Checksum
gh release download v0.1.0 --repo SumitDalavi/ephemeral-preview-environments --pattern "*.tar.gz" --pattern "checksums.txt"
sha256sum -c checksums.txt

# 3. Inspect SPDX SBOM
gh release download v0.1.0 --repo SumitDalavi/ephemeral-preview-environments --pattern "sbom.spdx.json"
cat sbom.spdx.json | jq .spdxVersion
```
