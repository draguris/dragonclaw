<p align="center">
  <img src="assets/cover.png" alt="DragonClaw 龙爪" width="100%">
</p>

<h1 align="center">DragonClaw 龙爪</h1>

<p align="center">
  <strong>Crypto-native AI agent for the Chinese ecosystem.</strong><br>
  Built-in Binance skills · OpenClaw compatible · Runs on Chinese LLMs
</p>

<p align="center">
  <a href="https://dragonclaw.asia">Website</a> ·
  <a href="https://docs.dragonclaw.asia">Docs</a> ·
  <a href="https://x.com/DragonClawCN">𝕏 @DragonClawCN</a> ·
  <a href="https://x.com/i/communities/2032492964522389747/">Community</a> ·
  <a href="#quick-start">Getting Started</a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
</p>

---

DragonClaw is a personal AI agent you run on your own machine. It connects to the chat platforms Chinese users actually use (**WeChat, DingTalk, Feishu** + Telegram, Discord, Slack), runs on Chinese LLMs (**DeepSeek, Qwen, Kimi, GLM**) at 1/10th the cost, and ships with **7 Binance trading skills hardcoded** — not plugins, not optional installs. Spot trading, meme tracking, contract auditing, smart money analysis, all built-in from day one.

It's fully compatible with the OpenClaw skill ecosystem (5,400+ community skills on ClawHub). The SKILL.md format is identical. Install any OpenClaw skill and it just works.

## Install

**Runtime: Node >= 20.**

```bash
curl -fsSL https://dragonclaw.asia/install.sh | bash
```

Then run the setup wizard:

```bash
dragonclaw onboard
```

The wizard walks you through: picking your LLM provider, entering your API key, optionally adding Binance and chat connector credentials, and naming your agent.

## Quick Start

```bash
# One-liner install
curl -fsSL https://dragonclaw.asia/install.sh | bash

# Setup wizard (pick LLM, add keys)
dragonclaw onboard

# Start the agent
dragonclaw start

# Or chat directly in terminal
dragonclaw chat
```

## From Source

```bash
git clone https://github.com/draguris/dragonclaw.git
cd dragonclaw
npm install

node src/cli.js onboard
node src/cli.js start

# Dev mode (auto-restart)
npm run dev

# Tests
npm test
```

## How It Works

```
WeChat / DingTalk / Feishu / Telegram / Discord / Slack / WebSocket / CLI
               │
               ▼
┌───────────────────────────────┐
│           Gateway             │
│       (control plane)         │
│    ws://127.0.0.1:18789       │
└──────────────┬────────────────┘
               │
               ├─ Agent Loop (skills + memory → LLM → tool calls → response)
               ├─ Binance Client (HMAC-signed, testnet default)
               ├─ Memory Store (SQLite, 10K cap, auto-prune)
               └─ Skill Manager (7 core + user skills)
```

## Built-in Binance Skills

Seven skills ship hardcoded. Six require **no API key**.

| Skill | What it does | Key? |
|-------|-------------|------|
| **Spot Trading** | Place, cancel, query spot orders | Yes |
| **Meme Rush** | Real-time meme token launches (Pump.fun, Four.meme) | No |
| **Market Rankings** | Trending tokens, social hype, smart money flows | No |
| **Token Audit** | Contract security scan, honeypot/rug detection | No |
| **Token Info** | Token metadata, live prices, K-line charts | No |
| **Address Info** | Wallet holdings and portfolio value | No |
| **Trading Signals** | AI-generated signals with backtest data | No |

### OpenClaw Compatibility

Same `SKILL.md` format. Every ClawHub skill works:

```bash
cp -r some-openclaw-skill ~/.dragonclaw/skills/
dragonclaw skills  # verify
```

## LLM Providers

| Provider | Default Model | Cost/1M tokens |
|----------|--------------|----------------|
| **DeepSeek** | `deepseek-chat` | ~$0.14 |
| **Qwen** | `qwen-max` | ~$0.40 |
| **Kimi** | `moonshot-v1-128k` | ~$0.55 |
| **GLM** | `glm-4-flash` | ~$0.10 |
| OpenAI | `gpt-4o` | ~$5.00 |
| Anthropic | `claude-sonnet-4-20250514` | ~$3.00 |
| OpenRouter | any | varies |
| Local | any (Ollama, vLLM) | free |

## Connectors

| Platform | Protocol | Status |
|----------|----------|--------|
| **Telegram** | Bot API (long polling) | Stable |
| **DingTalk 钉钉** | Robot Webhook + HTTP callback | Stable |
| **Feishu 飞书** | Bot Events API + OAuth | Stable |
| **Discord** | Gateway WebSocket | Stable |
| **WeChat 微信** | Official Account API | Planned |
| WebSocket / HTTP | Built-in | Always on |

### Quick Connector Setup

```yaml
# Telegram
connectors:
  telegram:
    enabled: true
    token: "123456:ABC-your-bot-token"

# DingTalk
connectors:
  dingtalk:
    enabled: true
    robotWebhook: "https://oapi.dingtalk.com/robot/send?access_token=..."
    appSecret: "SEC..."

# Feishu
connectors:
  feishu:
    enabled: true
    appId: "cli_..."
    appSecret: "..."

# Discord
connectors:
  discord:
    enabled: true
    token: "YOUR_DISCORD_BOT_TOKEN"
```

## Configuration

Config: `~/.dragonclaw/dragonclaw.yaml`

Minimal (just need an LLM key):

```yaml
llm:
  provider: deepseek
  apiKey: "sk-..."
```

### Environment Variables

| Variable | What it sets |
|----------|-------------|
| `DRAGONCLAW_LLM_PROVIDER` | LLM provider |
| `DRAGONCLAW_LLM_API_KEY` | LLM API key |
| `DRAGONCLAW_GATEWAY_TOKEN` | Gateway auth token |
| `BINANCE_API_KEY` | Binance API key |
| `BINANCE_API_SECRET` | Binance secret |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token |
| `LOG_LEVEL` | `debug` / `info` / `warn` / `error` |

## CLI

```bash
dragonclaw onboard   # setup wizard
dragonclaw start     # start gateway + connectors
dragonclaw chat      # terminal REPL
dragonclaw doctor    # health check
dragonclaw skills    # list loaded skills
```

## Security

- **Testnet by default** — explicit `testnet: false` required for real money
- **Confirmation required** — shows order details, waits for `CONFIRM`
- **No withdrawal endpoints** — not in the codebase
- **HMAC-SHA256 signing** — all Binance auth calls
- **Gateway auth** — bearer token + rate limiting (20/min per user)
- **AES-256 encrypted secrets** at rest

## Architecture

```
src/
├── index.js              # Entry point, graceful shutdown
├── cli.js                # CLI commands
├── core/
│   ├── agent-loop.js     # Reasoning engine
│   ├── binance-client.js # Binance API + HMAC signing
│   ├── config.js         # YAML + env var config
│   ├── gateway.js        # WebSocket + HTTP (auth, rate limit)
│   ├── llm.js            # All providers (retry, timeout)
│   ├── logger.js         # Structured JSON logging
│   ├── memory.js         # SQLite (10K cap, auto-prune)
│   ├── rate-limiter.js   # Token bucket
│   ├── retry.js          # Exponential backoff
│   ├── secrets.js        # AES-256 encryption
│   ├── skill-manager.js  # SKILL.md loader
│   └── cron.js           # Scheduler
├── connectors/           # Telegram, DingTalk, Feishu, Discord
└── skills/binance/       # 7 hardcoded SKILL.md files
```

## DragonClaw vs OpenClaw

| | OpenClaw | DragonClaw |
|---|----------|------------|
| Chat platforms | WhatsApp, iMessage, Signal | WeChat, DingTalk, Feishu + TG, Discord |
| Default LLM | Claude / GPT | DeepSeek / Qwen |
| Crypto | Plugin | 7 skills hardcoded |
| Language | English-first | Chinese-first |
| Cost/query | ~$0.01-0.03 | ~$0.001-0.003 |
| Skill format | SKILL.md | SKILL.md (cross-compatible) |

## Docs

Full documentation at [docs.dragonclaw.asia](https://docs.dragonclaw.asia)

## Community

<a href="https://x.com/DragonClawCN"><img src="https://img.shields.io/badge/𝕏-@DragonClawCN-000000?style=flat&logo=x" alt="X"></a>
<a href="https://x.com/i/communities/2032492964522389747/"><img src="https://img.shields.io/badge/𝕏_Community-Join-000000?style=flat&logo=x" alt="X Community"></a>

Follow [@DragonClawCN](https://x.com/DragonClawCN) for updates.

Join the [DragonClaw Community on X](https://x.com/i/communities/2032492964522389747/) to discuss skills, share configs, and connect with other users.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines. PRs welcome.

## License

[MIT](LICENSE)

---

<p align="center">Built for crypto traders who think in Chinese. 龙爪已就位。</p>
