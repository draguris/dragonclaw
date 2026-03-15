# Gateway & API

The Gateway is DragonClaw's control plane — a combined WebSocket and REST API server that handles all external communication.

## Architecture

```
External requests → Nginx (HTTPS) → Gateway (127.0.0.1:18789)
                                         ↓
                                    Auth → Rate Limit → Validate → Agent Loop
```

## Security Layers

1. **Nginx** — SSL termination, rate limiting, payload size limits
2. **Bearer token auth** — `DRAGONCLAW_GATEWAY_TOKEN` required for all endpoints except `/health`
3. **Rate limiter** — token bucket per user (20/min) + global (100/min)
4. **Input validation** — max 10,000 char messages, JSON schema checks
5. **CORS** — configurable, defaults to `*` for development

## Endpoints

| Path | Method | Auth | Description |
|------|--------|------|-------------|
| `/health` | GET | No | Health check with uptime, memory, skill/connector status |
| `/skills` | GET | Yes | List all loaded skills |
| `/message` | POST | Yes | Send message, receive agent response |
| WebSocket | — | Yes (in message) | Real-time bidirectional communication |

## Configuration

```yaml
gateway:
  port: 18789
  host: 127.0.0.1      # localhost only — Nginx proxies external traffic
  token: null           # set DRAGONCLAW_GATEWAY_TOKEN env var
  rateLimit:
    perUser: 20
    global: 100
```

## In Production

The gateway binds to `127.0.0.1` by default — it cannot be reached from the internet directly. Nginx handles external traffic, SSL, and additional rate limiting, then proxies to the gateway.

This dual-layer approach means even if someone bypasses Nginx (unlikely), the gateway still enforces its own auth and rate limits.
