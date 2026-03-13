/**
 * Discord Connector
 * 
 * Uses Discord Gateway (WebSocket) for receiving messages
 * and REST API for sending replies.
 * User creates a bot at discord.com/developers and provides the token.
 */

import WebSocket from 'ws';

const DISCORD_API = 'https://discord.com/api/v10';
const GATEWAY_URL = 'wss://gateway.discord.gg/?v=10&encoding=json';

export class DiscordConnector {
  constructor(config, agent) {
    this.token = config.token;
    this.agent = agent;
    this.ws = null;
    this.heartbeatInterval = null;
    this.seq = null;
    this.botUserId = null;
  }

  async start() {
    if (!this.token) throw new Error('Discord bot token not configured');

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(GATEWAY_URL);

      this.ws.on('open', () => {
        console.log('  ✓ Discord connector started');
        resolve();
      });

      this.ws.on('message', (data) => this._handleGatewayMessage(JSON.parse(data.toString())));
      this.ws.on('error', (e) => {
        console.warn('  ⚠ Discord WebSocket error:', e.message);
        reject(e);
      });
      this.ws.on('close', () => {
        clearInterval(this.heartbeatInterval);
        // Auto-reconnect after 5s
        if (this._shouldReconnect) {
          setTimeout(() => this.start(), 5000);
        }
      });
      this._shouldReconnect = true;
    });
  }

  async stop() {
    this._shouldReconnect = false;
    clearInterval(this.heartbeatInterval);
    if (this.ws) this.ws.close();
  }

  _handleGatewayMessage(payload) {
    const { op, d, s, t } = payload;
    if (s) this.seq = s;

    switch (op) {
      case 10: // Hello — start heartbeat and identify
        this._startHeartbeat(d.heartbeat_interval);
        this._identify();
        break;
      case 11: // Heartbeat ACK
        break;
      case 0: // Dispatch
        if (t === 'READY') {
          this.botUserId = d.user.id;
        } else if (t === 'MESSAGE_CREATE') {
          this._handleMessage(d);
        }
        break;
    }
  }

  _startHeartbeat(interval) {
    this.heartbeatInterval = setInterval(() => {
      this.ws.send(JSON.stringify({ op: 1, d: this.seq }));
    }, interval);
  }

  _identify() {
    this.ws.send(JSON.stringify({
      op: 2,
      d: {
        token: this.token,
        intents: 513, // GUILDS + GUILD_MESSAGES
        properties: { os: 'linux', browser: 'dragonclaw', device: 'dragonclaw' },
      },
    }));
  }

  async _handleMessage(msg) {
    // Ignore own messages and bots
    if (msg.author.bot) return;
    if (msg.author.id === this.botUserId) return;

    // In guilds, only respond to mentions
    if (msg.guild_id && !msg.mentions?.some(m => m.id === this.botUserId)) return;

    const text = msg.content.replace(/<@!?\d+>/g, '').trim();
    if (!text) return;

    const channelId = `discord:${msg.channel_id}`;
    const userId = `discord:${msg.author.id}`;

    try {
      const reply = await this.agent.process(channelId, userId, text, 'discord');
      await this._send(msg.channel_id, reply);
    } catch (e) {
      await this._send(msg.channel_id, `⚠ Error: ${e.message}`);
    }
  }

  async _send(channelId, text) {
    // Discord 2000 char limit
    const chunks = text.match(/.{1,1950}/gs) || [text];
    for (const chunk of chunks) {
      await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bot ${this.token}`,
        },
        body: JSON.stringify({ content: chunk }),
      });
    }
  }
}
