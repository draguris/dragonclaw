# WebSocket Connector

The WebSocket API is always available — no setup needed. It's the lowest-level way to interact with DragonClaw programmatically.

## Connection

```
ws://127.0.0.1:18789     (local)
wss://dragonclaw.asia/ws  (production, via Nginx)
```

## Authentication

Include your gateway token in every message:

```json
{
  "type": "message",
  "content": "BTC价格？",
  "token": "your-gateway-token"
}
```

## Message Types

### Send a message
```json
{"type": "message", "content": "审计这个合约...", "channelId": "session-1", "userId": "user-1", "token": "..."}
```

### Receive a reply
```json
{"type": "reply", "content": "合约审计结果:\n..."}
```

### Ping/Pong (keepalive)
```json
{"type": "ping"}
→ {"type": "pong"}
```

### Error
```json
{"type": "error", "message": "Rate limited", "retryAfterMs": 30000}
```

## Example: Python Client

```python
import asyncio, websockets, json

async def chat():
    uri = "wss://dragonclaw.asia/ws"
    async with websockets.connect(uri) as ws:
        msg = {
            "type": "message",
            "content": "Solana上最新的meme币有哪些？",
            "token": "your-gateway-token"
        }
        await ws.send(json.dumps(msg))
        reply = json.loads(await ws.recv())
        print(reply["content"])

asyncio.run(chat())
```

## Example: Node.js Client

```javascript
import WebSocket from 'ws';

const ws = new WebSocket('wss://dragonclaw.asia/ws');

ws.on('open', () => {
  ws.send(JSON.stringify({
    type: 'message',
    content: '帮我查一下这个钱包的持仓',
    token: 'your-gateway-token',
    channelId: 'my-app',
  }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);
  if (msg.type === 'reply') console.log(msg.content);
  if (msg.type === 'error') console.error(msg.message);
});
```

## Session Tracking

Use `channelId` to maintain separate conversation histories. Each unique `channelId` gets its own session with up to 30 messages of context.

If you omit `channelId`, all messages share a default session.
