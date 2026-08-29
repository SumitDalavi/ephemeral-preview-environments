#!/bin/bash
set -e

PR_NUMBER=${1:-124}
NAMESPACE="pr-${PR_NUMBER}-preview"

echo "================================================="
echo "🚀 Running Ephemeral Preview Environment Lifecycle"
echo "================================================="

echo "1. GitHub Action Triggered (PR Opened: #${PR_NUMBER})..."
echo "✅ Creating isolated namespace: ${NAMESPACE}"
# kubectl create namespace ${NAMESPACE}

echo "2. Provisioning Isolated Secrets & Dependencies..."
echo "✅ Generated unique DB credentials and stored in ${NAMESPACE} Secrets."
echo "✅ Deployed lightweight PostgreSQL instance to ${NAMESPACE}."

echo "3. Deploying Application..."
echo "✅ Building container image for PR #${PR_NUMBER}..."
echo "✅ Applying Kustomize manifests to ${NAMESPACE}..."

echo "4. Generating Ingress and Commenting on PR..."
URL="https://pr-${PR_NUMBER}.preview.mycompany.com"
echo "✅ Ingress created for ${URL}"
echo "💬 [Mock GitHub API] Commented on PR: '🚀 Preview environment ready at: ${URL}'"

echo "5. Testing Complete. GitHub Action Triggered (PR Merged)..."
echo "✅ Commencing Teardown..."
echo "✅ Deleting namespace ${NAMESPACE} (removes all resources, secrets, and PVCs)."
# kubectl delete namespace ${NAMESPACE}

echo "✅ Environment completely destroyed. Zero cluster drift."
