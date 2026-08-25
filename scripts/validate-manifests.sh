#!/bin/bash
set -e

echo "Running kustomize build on base..."
kubectl kustomize kustomize/base > /dev/null

echo "Running kustomize build on preview overlay..."
kubectl kustomize kustomize/overlays/preview > /dev/null

echo "Validating generated preview manifests with kubeval..."
kubectl kustomize kustomize/overlays/preview | docker run --rm -i garethr/kubeval --strict --ignore-missing-schemas

echo "✅ All manifests are structurally valid!"
