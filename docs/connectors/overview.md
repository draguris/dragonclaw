# Connectors Overview

Connectors are how DragonClaw communicates with the outside world. Each connector translates between a chat platform's API and the internal Agent Loop.

## Available Connectors

| Connector | Platform | Protocol | Setup Difficulty |
|-----------|----------|----------|-----------------|
| [Telegram](telegram.md) | Telegram | Bot API (long polling) | Easy — 2 minutes |
| [DingTalk](dingtalk.md) | 钉钉 | Robot Webhook + HTTP callback | Medium — 10 minutes |
| [Feishu](feishu.md) | 飞书 / Lark | Bot Events API + OAuth | Medium — 15 minutes |
| [Discord](discord.md) | Discord | Gateway WebSocket | Easy — 5 minutes |
| [WeChat](wechat.md) | 微信 | Official Account API | Hard — requires business verification |
| [WebSocket](websocket.md) | Any | Raw WebSocket | Built-in, always available |
| HTTP API | Any | REST | Built-in, always available |

## How Connectors Work

Every connector follows the same pattern:

1. **Receive** a message from the platform (polling, webhook, or WebSocket)
2. **Extract** the text content, channel ID, and user ID
3. **Call** `agent.process(channelId, userId, text, platform)`
4. **Send** the agent's response back via the platform's API

The Agent Loop doesn't know or care which platform the message came from. This means all features (skills, memory, tool execution) work identically across all platforms.

## Enabling Connectors

In `dragonclaw.yaml`:

```yaml
connectors:
  telegram:
    enabled: true
    token: "123456:ABC-your-bot-token"
  dingtalk:
    enabled: true
    robotWebhook: "https://oapi.dingtalk.com/robot/send?access_token=..."
```

Or via environment variables:

```bash
TELEGRAM_BOT_TOKEN=123456:ABC-your-bot-token
```

Setting a Telegram token via env var automatically enables the connector.

## Multiple Connectors

You can run multiple connectors simultaneously. Each maintains its own session history per channel. Memory is shared across all platforms — if you tell the agent something on Telegram, it remembers when you talk to it on DingTalk.

## Group Chat Behavior

In group chats, DragonClaw only responds when:
- **Telegram**: The bot is mentioned (@botname) or someone replies to the bot's message
- **DingTalk**: The robot is @mentioned in the group
- **Discord**: The bot is @mentioned
- **Feishu**: Received as a direct message event (configurable)

In private/DM conversations, every message triggers a response.

## Writing Custom Connectors

See [Connector Development](../contributing/connectors.md). The interface is simple:

```javascript
export class MyConnector {
  constructor(config, agent) { ... }
  async start() { ... }    // Start listening
  async stop() { ... }     // Clean shutdown
}
```

Register in `src/connectors/manager.js` and add config schema to `src/core/config.js`.
