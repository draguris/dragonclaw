# Rate Limiting

DragonClaw uses a two-layer rate limiting strategy to prevent abuse and protect your LLM API budget.

## Layer 1: Nginx

The Nginx config applies rate limits before requests reach the application:

```nginx
limit_req_zone $binary_remote_addr zone=dc_api:10m rate=30r/m;   # API: 30/min per IP
limit_req_zone $binary_remote_addr zone=dc_web:10m rate=60r/m;   # Web: 60/min per IP
```

These are hard limits based on IP address. Requests exceeding the limit get a `503 Service Temporarily Unavailable`.

## Layer 2: Application

The Gateway applies its own rate limits based on `userId`:

| Limit | Default | Config Key |
|-------|---------|-----------|
| Per user | 20 req/min | `gateway.rateLimit.perUser` |
| Global | 100 req/min | `gateway.rateLimit.global` |
| Window | 60 seconds | `gateway.rateLimit.windowMs` |

When rate limited, the API returns:

```json
{
  "error": "Rate limited",
  "retryAfterMs": 45000
}
```

HTTP status: `429 Too Many Requests` with `Retry-After` header.

## Why Two Layers?

- **Nginx** catches brute-force attacks, scrapers, and DDoS before they hit Node.js
- **Application** enforces per-user limits across all connectors (a user on Telegram and WebSocket counts as one)

## Tuning

For a personal agent with 1-3 users, the defaults are generous. For a shared deployment:

```yaml
gateway:
  rateLimit:
    perUser: 10    # tighter per-user limit
    global: 50     # lower total throughput
```

## Cost Protection

At default limits (20 req/min per user), the maximum LLM cost per user per hour:
- DeepSeek: ~$0.17/hour
- Qwen: ~$0.48/hour
- GPT-4o: ~$6.00/hour
- Claude: ~$3.60/hour

Adjust `perUser` to match your budget.
