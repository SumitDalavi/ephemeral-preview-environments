# Ephemeral Preview Environments Platform 🚀🗑️

> A developer experience platform that dynamically provisions isolated Kubernetes environments for every Pull Request and automatically destroys them on merge, accelerating feedback loops.

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

## 👨‍💻 Author

*Built to demonstrate Developer Experience (DevEx), CI/CD automation, and rapid feedback loops.*
