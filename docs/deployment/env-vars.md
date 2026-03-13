# Environment Variables

All DragonClaw secrets and configuration can be set via environment variables. This is the recommended approach for production — secrets never touch disk.

## Complete Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DRAGONCLAW_LLM_PROVIDER` | Yes | — | LLM provider: `deepseek`, `qwen`, `kimi`, `glm`, `openai`, `anthropic`, `openrouter`, `local` |
| `DRAGONCLAW_LLM_API_KEY` | Yes | — | API key for the LLM provider |
| `DRAGONCLAW_LLM_MODEL` | No | Auto-detected | Override the model name |
| `DRAGONCLAW_GATEWAY_TOKEN` | Recommended | — | Bearer token for API/WebSocket auth. Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `BINANCE_API_KEY` | No | — | Binance API key (only for spot trading) |
| `BINANCE_API_SECRET` | No | — | Binance API secret |
| `TELEGRAM_BOT_TOKEN` | No | — | Telegram bot token (auto-enables connector) |
| `LOG_LEVEL` | No | `info` | Logging verbosity: `debug`, `info`, `warn`, `error` |
| `DRAGONCLAW_DATA_DIR` | No | `~/.dragonclaw` | Override data directory path |
| `NODE_ENV` | No | — | Set to `production` for production deployments |

## Priority

Environment variables always override values in `dragonclaw.yaml`. The full priority chain:

```
Environment variable  (highest)
        ↓
dragonclaw.yaml in current directory
        ↓
~/.dragonclaw/dragonclaw.yaml
        ↓
Built-in defaults    (lowest)
```

## Security Best Practices

1. **Never commit `.env` files to git** — the `.gitignore` already excludes them
2. **Use `chmod 600`** on `.env` files so only the owner can read them
3. **Always set `DRAGONCLAW_GATEWAY_TOKEN`** in production to prevent unauthorized API access
4. **Use env vars over YAML** for all secrets — YAML files can accidentally end up in version control
5. **Rotate keys regularly** — especially the gateway token and Binance keys
