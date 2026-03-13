/**
 * DingTalk (钉钉) Connector
 * 
 * Uses DingTalk Robot webhook for sending + HTTP callback for receiving.
 * The user creates a custom robot in their DingTalk group and provides:
 * - robotWebhook: the outgoing webhook URL (for sending messages)
 * - appKey + appSecret: for receiving incoming messages via callback
 * 
 * DragonClaw starts a local HTTP server to receive DingTalk callbacks.
 */

import { createServer } from 'http';
import { createHmac } from 'crypto';

export class DingTalkConnector {
  constructor(config, agent) {
    this.config = config;
    this.agent = agent;
    this.server = null;
  }

  async start() {
    if (!this.config.robotWebhook) {
      throw new Error('DingTalk robotWebhook not configured');
    }

    // Start callback server on port 18790
    const port = 18790;
    this.server = createServer((req, res) => this._handleCallback(req, res));
    this.server.listen(port, '0.0.0.0');
    console.log(`  ✓ DingTalk connector started (callback on :${port})`);
  }

  async stop() {
    if (this.server) {
      return new Promise(resolve => this.server.close(resolve));
    }
  }

  async _handleCallback(req, res) {
    if (req.method !== 'POST') {
      res.writeHead(405);
      res.end();
      return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));

      try {
        const data = JSON.parse(body);
        const text = data.text?.content?.trim();
        if (!text) return;

        const channelId = `dingtalk:${data.conversationId || 'default'}`;
        const userId = `dingtalk:${data.senderStaffId || data.senderId || 'unknown'}`;

        const reply = await this.agent.process(channelId, userId, text, 'dingtalk');
        await this._sendToWebhook(reply);
      } catch (e) {
        console.warn('  ⚠ DingTalk callback error:', e.message);
      }
    });
  }

  async _sendToWebhook(text) {
    const payload = {
      msgtype: 'text',
      text: { content: text },
    };

    let url = this.config.robotWebhook;

    // If secret is configured, add signature
    if (this.config.appSecret) {
      const timestamp = Date.now();
      const stringToSign = `${timestamp}\n${this.config.appSecret}`;
      const sign = createHmac('sha256', this.config.appSecret)
        .update(stringToSign)
        .digest('base64');
      const encodedSign = encodeURIComponent(sign);
      url += `&timestamp=${timestamp}&sign=${encodedSign}`;
    }

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }
}
