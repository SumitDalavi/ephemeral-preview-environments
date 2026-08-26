'use strict';
/**
 * TTL-based Cleanup Controller
 * Finds preview environments older than MAX_AGE_HOURS and deletes them.
 * Run as a CronJob: 0 * * * * node controller/cleanup.js
 */
const { execSync } = require('child_process');
const { deleteEnvironment } = require('./env-manager');

const MAX_AGE_HOURS = parseInt(process.env.MAX_AGE_HOURS || '24', 10);

function kubectl(cmd) {
  try { return execSync(`kubectl ${cmd}`, { encoding: 'utf8' }).trim(); }
  catch { return ''; }
}

async function runCleanup() {
  console.log(`[cleanup] Starting TTL cleanup (max age: ${MAX_AGE_HOURS}h)`);
  const raw = kubectl(
    `get namespaces -l preview=true -o jsonpath='{range .items[*]}{.metadata.name},{.metadata.creationTimestamp}\n{end}'`
  );
  if (!raw) { console.log('[cleanup] No preview namespaces found.'); return; }

  const now = Date.now();
  const maxMs = MAX_AGE_HOURS * 3600 * 1000;
  let cleaned = 0;

  for (const line of raw.replace(/'/g, '').split('
').filter(Boolean)) {
    const [name, ts] = line.split(',');
    const age = now - new Date(ts).getTime();
    const prNum = name.replace('preview-pr-', '');
    if (age > maxMs) {
      console.log(`[cleanup] Deleting ${name} (age: ${Math.round(age/3600000)}h)`);
      await deleteEnvironment(prNum);
      cleaned++;
    }
  }
  console.log(`[cleanup] Done. Cleaned ${cleaned} environments.`);
}

runCleanup().catch(console.error);
