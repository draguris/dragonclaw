/**
 * Gateway — Production WebSocket + HTTP control plane
 * 
 * Security:
 * - Token-based auth (gateway.token in config)
 * - Rate limiting per IP/user
 * - Input validation (max message length, JSON schema)
 * - CORS headers
 */

import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { log } from './logger.js';
import { RateLimiter } from './rate-limiter.js';

const gLog = log.child('gateway');
const MAX_MSG_LENGTH = 10_000;

export class Gateway {
  constructor(config, agent, connectors, skills) {
    this.config = config;
    this.agent = agent;
    this.connectors = connectors;
    this.skills = skills;
    this.server = null;
    this.wss = null;
    this.rateLimiter = new RateLimiter({
      perUser: config.gateway?.rateLimit?.perUser || 20,
      global: config.gateway?.rateLimit?.global || 100,
    });
    this.token = config.gateway?.token || process.env.DRAGONCLAW_GATEWAY_TOKEN || null;
  }

  async listen() {
    const { port, host } = this.config.gateway;
    this.server = createServer((req, res) => this._handleHttp(req, res));
    this.wss = new WebSocketServer({ server: this.server });

    this.wss.on('connection', (ws, req) => {
      const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;

      ws.on('message', async (data) => {
        let msg;
        try {
          msg = JSON.parse(data.toString());
        } catch {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
          return;
        }

        // Auth check
        if (this.token && msg.token !== this.token) {
          ws.send(JSON.stringify({ type: 'error', message: 'Unauthorized' }));
          return;
        }

        // Rate limit
        const rl = this.rateLimiter.check(msg.userId || ip);
        if (!rl.allowed) {
          ws.send(JSON.stringify({ type: 'error', message: 'Rate limited', retryAfterMs: rl.retryAfterMs }));
          return;
        }

        if (msg.type === 'message') {
          // Validate
          if (!msg.content || typeof msg.content !== 'string') {
            ws.send(JSON.stringify({ type: 'error', message: 'Missing content' }));
            return;
          }
          if (msg.content.length > MAX_MSG_LENGTH) {
            ws.send(JSON.stringify({ type: 'error', message: `Message too long (max ${MAX_MSG_LENGTH} chars)` }));
            return;
          }

          try {
            const reply = await this.agent.process(
              msg.channelId || 'ws-default',
              msg.userId || ip,
              msg.content,
              'websocket'
            );
            ws.send(JSON.stringify({ type: 'reply', content: reply }));
          } catch (err) {
            gLog.error('Agent error', { error: err.message });
            ws.send(JSON.stringify({ type: 'error', message: 'Internal error processing message' }));
          }
        } else if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      });

      ws.on('error', (err) => gLog.warn('WS error', { ip, error: err.message }));
    });

    return new Promise((resolve, reject) => {
      this.server.listen(port, host, () => {
        gLog.info('Gateway listening', { port, host });
        resolve();
      });
      this.server.on('error', reject);
    });
  }

  _handleHttp(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    res.setHeader('Content-Type', 'application/json');

    // Health (no auth required)
    if (url.pathname === '/health' && req.method === 'GET') {
      res.end(JSON.stringify({
        status: 'ok', version: '0.1.0',
        uptime: Math.floor(process.uptime()),
        memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        skills: { core: this.skills.coreCount(), user: this.skills.userCount() },
        connectors: this.connectors.activeNames(),
      }));
      return;
    }

    // Auth check for all other endpoints
    if (this.token) {
      const authHeader = req.headers['authorization'];
      const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
      if (bearerToken !== this.token) {
        res.writeHead(401);
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }
    }

    // Rate limit
    const rl = this.rateLimiter.check(ip);
    if (!rl.allowed) {
      res.writeHead(429);
      res.setHeader('Retry-After', Math.ceil(rl.retryAfterMs / 1000));
      res.end(JSON.stringify({ error: 'Rate limited', retryAfterMs: rl.retryAfterMs }));
      return;
    }

    // Skills list
    if (url.pathname === '/skills' && req.method === 'GET') {
      const list = this.skills.all().map(s => ({
        slug: s.slug, title: s.title, source: s.source,
        description: s.description, requiresAuth: s.requiresAuth,
      }));
      res.end(JSON.stringify(list));
      return;
    }

    // Send message
    if (url.pathname === '/message' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
        if (body.length > MAX_MSG_LENGTH * 2) {
          res.writeHead(413);
          res.end(JSON.stringify({ error: 'Payload too large' }));
          req.destroy();
        }
      });
      req.on('end', async () => {
        try {
          const { content, channelId, userId } = JSON.parse(body);
          if (!content || typeof content !== 'string') {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Missing or invalid content field' }));
            return;
          }
          if (content.length > MAX_MSG_LENGTH) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: `Message too long (max ${MAX_MSG_LENGTH})` }));
            return;
          }
          const reply = await this.agent.process(
            channelId || 'http',
            userId || ip,
            content,
            'http'
          );
          res.end(JSON.stringify({ reply }));
        } catch (e) {
          gLog.error('HTTP message error', { error: e.message });
          res.writeHead(500);
          res.end(JSON.stringify({ error: 'Internal error' }));
        }
      });
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }

  async close() {
    this.rateLimiter.destroy();
    if (this.wss) this.wss.close();
    if (this.server) return new Promise(r => this.server.close(r));
  }
}
