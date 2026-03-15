# Security Model

DragonClaw handles sensitive data — API keys, trading credentials, personal conversations. Here's how the system protects them.

## Defense Layers

### 1. Gateway Authentication

All API and WebSocket requests require a bearer token when `DRAGONCLAW_GATEWAY_TOKEN` is set. Without this, your agent is an open endpoint.

```bash
# Generate a token
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Set via environment variable (recommended) or config file.

### 2. Rate Limiting

Token bucket algorithm prevents abuse:
- **Per user**: 20 requests/minute (configurable)
- **Global**: 100 requests/minute (configurable)

Applies to both REST API and WebSocket connections.

### 3. Input Validation

- Maximum message length: 10,000 characters
- Maximum payload size: 64KB (Nginx) / 20KB (gateway)
- JSON schema validation on all endpoints
- Tool call output parsed with try/catch — malformed LLM output cannot crash the process

### 4. Secrets Encryption

The secrets manager (`src/core/secrets.js`) provides AES-256-GCM encryption at rest:
- Machine-derived encryption key (tied to hostname + username)
- Encrypted values prefixed with `enc:v1:` in config files
- Environment variables always preferred over file-based secrets

### 5. Process Isolation

- Runs as dedicated `dragonclaw` system user (no shell, no sudo)
- Nginx binds the backend to `127.0.0.1` only — not reachable from the internet directly
- Docker container runs as non-root with memory limits

### 6. Binance Trading Safety

- **Testnet by default** — real money trading requires explicit `testnet: false`
- **Confirmation required** — every trade shows details and waits for user to type `CONFIRM`
- **No withdrawal permissions** — the system never requests or uses withdrawal API access
- **HMAC-SHA256 signing** — all authenticated Binance requests are properly signed per Binance API spec

### 7. Logging

Structured JSON logging captures all significant events without logging sensitive data:
- API keys are never logged
- Message content is logged at `debug` level only
- Errors include stack traces for diagnosis

## What You Should Do

1. **Always set `DRAGONCLAW_GATEWAY_TOKEN`** in production
2. **Use environment variables** for all secrets, not YAML files
3. **Keep Binance in testnet mode** until you're confident in the setup
4. **Enable only the Binance API permissions you need** — read + spot trading, never withdrawals
5. **Bind your Binance API key to your server's IP** in Binance settings
6. **Keep the system updated** — `bash deploy/update.sh` pulls latest code
7. **Monitor logs** — `pm2 logs dragonclaw` for anomalies
8. **Use HTTPS** — the Nginx config enforces TLS 1.2+ with modern ciphers

## Threat Model

| Threat | Mitigation |
|--------|-----------|
| Unauthorized API access | Gateway token + rate limiting |
| Stolen Binance keys | Env vars (not on disk), IP whitelist on Binance |
| Prompt injection via skills | Core skills are hardcoded; user skills reviewed on load |
| LLM hallucinated trades | Confirmation step required before any order |
| Memory database theft | File permissions (600), dedicated user |
| DDoS on gateway | Nginx rate limiting + upstream limits |
| Man-in-the-middle | TLS 1.2+, HSTS header |

## Reporting Vulnerabilities

If you find a security issue, please report it responsibly via GitHub Security Advisories on the DragonClaw repository. Do not open a public issue.
