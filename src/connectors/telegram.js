/**
 * Telegram Connector
 * 
 * Uses Telegram Bot API with long polling.
 * The user creates a bot via @BotFather and provides the token.
 */

const TELEGRAM_API = 'https://api.telegram.org/bot';

export class TelegramConnector {
  constructor(config, agent) {
    this.token = config.token;
    this.agent = agent;
    this.running = false;
    this.offset = 0;
  }

  async start() {
    if (!this.token) throw new Error('Telegram bot token not configured');
    this.running = true;
    this._poll();
    console.log('  ✓ Telegram connector started');
  }

  async stop() {
    this.running = false;
  }

  async _poll() {
    while (this.running) {
      try {
        const url = `${TELEGRAM_API}${this.token}/getUpdates?offset=${this.offset}&timeout=30`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.ok && data.result?.length) {
          for (const update of data.result) {
            this.offset = update.update_id + 1;
            if (update.message?.text) {
              await this._handleMessage(update.message);
            }
          }
        }
      } catch (e) {
        console.warn('  ⚠ Telegram poll error:', e.message);
        await this._sleep(5000);
      }
    }
  }

  async _handleMessage(msg) {
    const channelId = `telegram:${msg.chat.id}`;
    const userId = `telegram:${msg.from.id}`;
    const text = msg.text;

    // In group chats, only respond to mentions or replies
    if (msg.chat.type !== 'private') {
      const botMentioned = text.includes('@') || msg.reply_to_message;
      if (!botMentioned) return;
    }

    try {
      const reply = await this.agent.process(channelId, userId, text, 'telegram');
      await this._send(msg.chat.id, reply);
    } catch (e) {
      await this._send(msg.chat.id, `⚠ 处理消息时出错: ${e.message}`);
    }
  }

  async _send(chatId, text) {
    // Telegram has a 4096 char limit per message
    const chunks = this._chunk(text, 4000);
    for (const chunk of chunks) {
      await fetch(`${TELEGRAM_API}${this.token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: chunk,
          parse_mode: 'Markdown',
        }),
      });
    }
  }

  _chunk(text, maxLen) {
    if (text.length <= maxLen) return [text];
    const chunks = [];
    while (text.length > 0) {
      chunks.push(text.slice(0, maxLen));
      text = text.slice(maxLen);
    }
    return chunks;
  }

  _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
}
