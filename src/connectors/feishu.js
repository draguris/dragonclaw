/**
 * Feishu (飞书/Lark) Connector
 * 
 * Receives messages via Feishu Event Subscription (HTTP callback).
 * Sends replies using the Feishu Bot Messages API.
 * 
 * Setup: Create a Feishu bot app, enable "Bot" capability,
 * subscribe to "im.message.receive_v1" event.
 */

import { createServer } from 'http';

const FEISHU_API = 'https://open.feishu.cn/open-apis';

export class FeishuConnector {
  constructor(config, agent) {
    this.config = config;
    this.agent = agent;
    this.server = null;
    this.tenantAccessToken = null;
    this.tokenExpiry = 0;
  }

  async start() {
    if (!this.config.appId || !this.config.appSecret) {
      throw new Error('Feishu appId and appSecret required');
    }

    await this._refreshToken();

    const port = 18791;
    this.server = createServer((req, res) => this._handleEvent(req, res));
    this.server.listen(port, '0.0.0.0');
    console.log(`  ✓ Feishu connector started (events on :${port})`);
  }

  async stop() {
    if (this.server) return new Promise(resolve => this.server.close(resolve));
  }

  async _refreshToken() {
    const res = await fetch(`${FEISHU_API}/auth/v3/tenant_access_token/internal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: this.config.appId,
        app_secret: this.config.appSecret,
      }),
    });
    const data = await res.json();
    if (data.code !== 0) throw new Error(`Feishu auth failed: ${data.msg}`);
    this.tenantAccessToken = data.tenant_access_token;
    this.tokenExpiry = Date.now() + (data.expire - 300) * 1000;
  }

  async _ensureToken() {
    if (Date.now() > this.tokenExpiry) await this._refreshToken();
  }

  async _handleEvent(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);

        // URL verification challenge
        if (data.challenge) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ challenge: data.challenge }));
          return;
        }

        res.writeHead(200);
        res.end('ok');

        // Process message event
        const event = data.event;
        if (!event || event.message?.message_type !== 'text') return;

        const content = JSON.parse(event.message.content);
        const text = content.text;
        if (!text) return;

        const channelId = `feishu:${event.message.chat_id}`;
        const userId = `feishu:${event.sender?.sender_id?.user_id || 'unknown'}`;

        const reply = await this.agent.process(channelId, userId, text, 'feishu');
        await this._reply(event.message.message_id, reply);
      } catch (e) {
        if (!res.headersSent) {
          res.writeHead(500);
          res.end('error');
        }
        console.warn('  ⚠ Feishu event error:', e.message);
      }
    });
  }

  async _reply(messageId, text) {
    await this._ensureToken();
    await fetch(`${FEISHU_API}/im/v1/messages/${messageId}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.tenantAccessToken}`,
      },
      body: JSON.stringify({
        content: JSON.stringify({ text }),
        msg_type: 'text',
      }),
    });
  }
}
