'use strict';
/**
 * Environment Manager
 * Creates and deletes ephemeral Kubernetes namespaces per PR.
 * Uses kubectl (must be configured with cluster access).
 */
const { execSync } = require('child_process');
const path = require('path');
const fs   = require('fs');

const MANIFESTS_DIR = path.join(__dirname, '..', 'manifests', 'templates');
const BASE_DOMAIN   = process.env.BASE_DOMAIN || 'preview.example.com';
const APP_IMAGE     = process.env.APP_IMAGE   || 'nginx:alpine';

function nsName(pr) { return `preview-pr-${pr}`; }

function kubectl(cmd, opts = {}) {
  try {
    const out = execSync(`kubectl ${cmd}`, { encoding: 'utf8', ...opts });
    return { ok: true, out: out.trim() };
  } catch (e) {
    return { ok: false, err: e.message };
  }
}

function renderTemplate(file, vars) {
  let tpl = fs.readFileSync(path.join(MANIFESTS_DIR, file), 'utf8');
  for (const [k, v] of Object.entries(vars)) {
    tpl = tpl.replaceAll(`{{${k}}}`, v);
  }
  return tpl;
}

function applyYaml(yaml) {
  const tmp = require('os').tmpdir() + '/preview-' + Date.now() + '.yaml';
  fs.writeFileSync(tmp, yaml);
  const r = kubectl(`apply -f ${tmp}`);
  fs.unlinkSync(tmp);
  return r;
}

/**
 * createEnvironment — provisions a full preview environment for a PR.
 * Creates namespace, deployment, service, and ingress with TLS.
 */
async function createEnvironment(prNumber, branchName, commitSha) {
  const ns    = nsName(prNumber);
  const host  = `pr-${prNumber}.${BASE_DOMAIN}`;
  const image = `${APP_IMAGE}:${commitSha.slice(0, 7)}`;

  console.log(`[env-manager] Creating environment for PR #${prNumber} → ${host}`);

  // 1. Create namespace with TTL label
  kubectl(`create namespace ${ns} --dry-run=client -o yaml | kubectl apply -f -`);
  kubectl(`label namespace ${ns} preview=true pr=${prNumber} --overwrite`);

  const vars = { NAMESPACE: ns, HOST: host, IMAGE: image,
                 PR_NUMBER: String(prNumber), BRANCH: branchName, SHA: commitSha };

  // 2. Apply deployment + service
  const deploy = renderTemplate('deployment.yaml', vars);
  const { ok: dOk, err: dErr } = applyYaml(deploy);
  if (!dOk) throw new Error(`Deployment failed: ${dErr}`);

  // 3. Apply ingress
  const ingress = renderTemplate('ingress.yaml', vars);
  applyYaml(ingress);

  // 4. Wait for rollout (non-blocking — returns URL immediately)
  kubectl(`rollout status deployment/preview-app -n ${ns} --timeout=120s`, { stdio: 'ignore' });

  return { namespace: ns, url: `https://${host}`, prNumber, branch: branchName };
}

/**
 * deleteEnvironment — tears down the namespace (cascades all resources).
 */
async function deleteEnvironment(prNumber) {
  const ns = nsName(prNumber);
  console.log(`[env-manager] Deleting environment for PR #${prNumber} (ns: ${ns})`);
  const { ok, err } = kubectl(`delete namespace ${ns} --ignore-not-found`);
  if (!ok) console.warn(`[env-manager] Warning: ${err}`);
  return { deleted: ns };
}

/**
 * listEnvironments — returns all active preview namespaces.
 */
function listEnvironments() {
  const { ok, out } = kubectl(`get namespaces -l preview=true -o jsonpath='{.items[*].metadata.name}'`);
  if (!ok || !out) return [];
  return out.replace(/'/g, '').split(' ').filter(Boolean);
}

module.exports = { createEnvironment, deleteEnvironment, listEnvironments, nsName };
