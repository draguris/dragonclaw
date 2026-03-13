# Telegram Connector

The easiest connector to set up — takes about 2 minutes.

## Setup

1. Open Telegram, search for **@BotFather**
2. Send `/newbot`
3. Follow the prompts — pick a name and username
4. BotFather gives you a token like `123456:ABC-DEF...`
5. Add to your config:

```yaml
connectors:
  telegram:
    enabled: true
    token: "123456:ABC-DEF..."
```

Or via environment variable:
```bash
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
```

Setting the env var auto-enables the connector.

## How It Works

- Uses **long polling** (no webhook needed, works behind NAT/firewall)
- **Private chats**: responds to every message
- **Group chats**: responds only when @mentioned or replied to
- Messages are chunked to 4,000 characters (Telegram's limit)
- Supports Markdown formatting in responses

## Group Chat Setup

1. Add your bot to a group
2. Mention it: `@your_bot_name 现在BTC什么价？`
3. Or reply to one of its messages

To allow the bot to read all group messages (not just mentions), disable privacy mode in BotFather: `/setprivacy` → Disable.
