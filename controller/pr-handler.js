'use strict';
/**
 * PR Webhook Handler
 * Receives GitHub webhook events and orchestrates preview environments.
 */
const crypto = require('crypto');
const { createEnvironment, deleteEnvironment } = require('./env-manager');

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || '';

function verifySignature(payload, signature) {
  if (!WEBHOOK_SECRET) return true; // skip in dev
  const expected = 'sha256=' + crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

async function handlePullRequestEvent(event) {
  const { action, number, pull_request: pr } = event;
  const branch = pr.head.ref;
  const sha    = pr.head.sha;

  console.log(`[pr-handler] PR #${number} action=${action} branch=${branch}`);

  if (['opened', 'synchronize', 'reopened'].includes(action)) {
    const env = await createEnvironment(number, branch, sha);
    console.log(`[pr-handler] Preview ready: ${env.url}`);
    return { action: 'created', ...env };
  }

  if (['closed'].includes(action)) {
    const result = await deleteEnvironment(number);
    console.log(`[pr-handler] Cleaned up: ${result.deleted}`);
    return { action: 'deleted', ...result };
  }

  return { action: 'ignored', reason: `Unhandled action: ${action}` };
}

module.exports = { handlePullRequestEvent, verifySignature };
