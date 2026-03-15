# Discord Connector

Connect DragonClaw to Discord servers via the Gateway WebSocket API.

## Setup

### 1. Create a Discord Bot

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Click **New Application**, name it "DragonClaw"
3. Go to **Bot** tab → **Reset Token** → copy the token
4. Under **Privileged Gateway Intents**, enable **Message Content Intent**
5. Go to **OAuth2** → **URL Generator**:
   - Scopes: `bot`
   - Bot Permissions: `Send Messages`, `Read Message History`
6. Copy the generated URL and open it to invite the bot to your server

### 2. Configure

```yaml
connectors:
  discord:
    enabled: true
    token: "YOUR_DISCORD_BOT_TOKEN"
```

## How It Works

- Connects via Discord Gateway WebSocket (real-time, no polling)
- Auto-heartbeat to maintain connection
- Auto-reconnect on disconnect (5-second delay)
- **Servers**: responds only when @mentioned
- **DMs**: responds to every message
- Messages chunked to 2,000 characters (Discord's limit)
- Strips mention tags from message before processing
