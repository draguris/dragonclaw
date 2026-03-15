# REST API Reference

The DragonClaw gateway exposes a REST API on port 18789 (configurable). In production behind Nginx, these are available at `https://dragonclaw.asia/api/`.

## Authentication

If `DRAGONCLAW_GATEWAY_TOKEN` is set, all requests (except `/health`) require a bearer token:

```
Authorization: Bearer your-token-here
```

## Endpoints

### GET /health

Health check. No authentication required.

**Response:**
```json
{
  "status": "ok",
  "version": "0.1.0",
  "uptime": 3600,
  "memory": "45MB",
  "skills": { "core": 7, "user": 2 },
  "connectors": ["telegram", "dingtalk"]
}
```

### GET /skills

List all loaded skills.

**Response:**
```json
[
  {
    "slug": "binance-spot",
    "title": "Binance Spot Trading",
    "source": "core",
    "description": "Place, cancel, and query spot orders on Binance.",
    "requiresAuth": true
  },
  {
    "slug": "meme-rush",
    "title": "Meme Rush",
    "source": "core",
    "description": "Track real-time meme token launches.",
    "requiresAuth": false
  }
]
```

### POST /message

Send a message to the agent and receive a response.

**Request:**
```json
{
  "content": "BTC现在什么价格？",
  "channelId": "my-app-channel",
  "userId": "user-123"
}
```

- `content` (required): Message text, max 10,000 characters
- `channelId` (optional): Conversation identifier for session tracking
- `userId` (optional): User identifier for rate limiting and memory

**Response:**
```json
{
  "reply": "BTC/USDT 当前价格: $67,432.50\n24小时变化: +2.3%"
}
```

**Error Responses:**
```json
// 400 — Bad request
{ "error": "Missing or invalid content field" }

// 401 — Unauthorized
{ "error": "Unauthorized" }

// 413 — Payload too large
{ "error": "Payload too large" }

// 429 — Rate limited
{ "error": "Rate limited", "retryAfterMs": 45000 }

// 500 — Internal error
{ "error": "Internal error" }
```

## Rate Limits

Default: 20 requests per user per minute, 100 global per minute. Configurable in `gateway.rateLimit`.

When rate limited, the response includes `retryAfterMs` indicating when to retry.

---

# WebSocket API Reference

Connect to `wss://dragonclaw.asia/ws` (or `ws://127.0.0.1:18789` locally).

## Message Format

All messages are JSON with a `type` field.

### Send a Message

```json
{
  "type": "message",
  "content": "审计这个合约 0x...",
  "channelId": "ws-session-1",
  "userId": "user-123",
  "token": "your-gateway-token"
}
```

### Receive a Reply

```json
{
  "type": "reply",
  "content": "合约审计结果:\n风险等级: LOW\n..."
}
```

### Ping/Pong

```json
// Send
{ "type": "ping" }

// Receive
{ "type": "pong" }
```

### Error

```json
{
  "type": "error",
  "message": "Rate limited",
  "retryAfterMs": 45000
}
```

## Example: JavaScript Client

```javascript
const ws = new WebSocket('wss://dragonclaw.asia/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'message',
    content: '最近有什么热门meme币？',
    token: 'your-gateway-token',
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'reply') {
    console.log('Dragon says:', data.content);
  }
};
```

---

# Tool Call Format

When the LLM needs to execute an action, it outputs a fenced code block:

````
```tool
{"tool": "binance_market", "action": "GET", "endpoint": "...", "params": {...}}
```
````

## Tool Types

### Binance Market (Public)
```json
{
  "tool": "binance_market",
  "action": "GET",
  "endpoint": "/bapi/defi/v1/public/wallet-direct/...",
  "params": { "chainId": "CT_501" }
}
```

### Binance Spot (Authenticated)
```json
{
  "tool": "binance_spot",
  "action": "POST",
  "endpoint": "/api/v3/order",
  "params": { "symbol": "BTCUSDT", "side": "BUY", "type": "MARKET", "quoteOrderQty": "10" }
}
```

### Shell Command
```json
{
  "tool": "shell",
  "command": "curl -s https://api.example.com/data"
}
```

Shell commands have a 30-second timeout and 1MB output limit.
