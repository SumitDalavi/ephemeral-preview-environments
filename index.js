'use strict';
/**
 * Ephemeral Preview Environments — Webhook Server
 */
const http   = require('http');
const { handlePullRequestEvent, verifySignature } = require('./controller/pr-handler');
const { listEnvironments } = require('./controller/env-manager');

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', async () => {
    const body = Buffer.concat(chunks).toString();

    // Health
    if (req.url === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'ok', environments: listEnvironments() }));
    }

    // Environments list
    if (req.url === '/environments' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ environments: listEnvironments() }));
    }

    // GitHub webhook
    if (req.url === '/webhook' && req.method === 'POST') {
      const sig = req.headers['x-hub-signature-256'] || '';
      if (!verifySignature(body, sig)) {
        res.writeHead(401); return res.end('Unauthorized');
      }
      const event = req.headers['x-github-event'];
      if (event !== 'pull_request') {
        res.writeHead(200); return res.end('ignored');
      }
      try {
        const payload = JSON.parse(body);
        const result  = await handlePullRequestEvent(payload);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (e) {
        console.error('[server] Error:', e);
        res.writeHead(500); res.end(JSON.stringify({ error: e.message }));
      }
      return;
    }

    res.writeHead(404); res.end('Not Found');
  });
});

server.listen(PORT, () => console.log(`[server] Ephemeral preview controller on :${PORT}`));
