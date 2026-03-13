# DragonClaw 龙爪

**加密原生AI智能体，为中国用户打造。**

DragonClaw is a self-hosted, open-source AI agent with Binance trading skills hardcoded from day one. It connects to the Chinese digital ecosystem — WeChat, DingTalk, Feishu — and runs on Chinese LLMs like DeepSeek and Qwen at a fraction of the cost of Western alternatives.

It's fully compatible with the OpenClaw skill ecosystem (5,400+ community skills), but ships with what matters to Chinese crypto users out of the box: real-time meme token tracking, smart money analysis, contract security auditing, and spot trading execution — all accessible from a chat message.

## Key Features

**Crypto Native** — Seven Binance skills ship built-in. Six work without any API key. Query on-chain data, audit tokens, track meme momentum the moment you install.

**Chinese Ecosystem** — First-class connectors for WeChat, DingTalk, and Feishu. Chinese LLM providers (DeepSeek, Qwen, Kimi, GLM) are preconfigured with correct endpoints.

**Self-Hosted & Private** — Runs on your machine or VPS. Your data, your keys, your agent. Nothing leaves your infrastructure unless you explicitly call an external API.

**OpenClaw Compatible** — Uses the same SKILL.md format. Every skill from ClawHub works. Install community skills or let DragonClaw write its own.

**Production Hardened** — Retry logic, rate limiting, gateway authentication, encrypted secrets at rest, structured logging, auto-restart, health checks.

## How It Works

```
You (WeChat/DingTalk/Telegram/CLI)
        │
        ▼
   ┌─────────┐
   │ Gateway  │  WebSocket + REST API
   └────┬─────┘
        │
   ┌────▼─────┐
   │Agent Loop │  Skills + Memory → LLM → Tool Calls → Response
   └────┬─────┘
        │
   ┌────▼──────────────────────────────┐
   │  Skills (Binance, Custom, OpenClaw) │
   │  LLM (DeepSeek/Qwen/Kimi/Claude)   │
   │  Memory (SQLite)                    │
   │  Connectors (TG/DD/FS/Discord)      │
   └────────────────────────────────────┘
```

## Quick Start

```bash
curl -fsSL https://dragonclaw.asia/install.sh | bash
dragonclaw onboard
dragonclaw start
```

Or with npm:

```bash
npm i -g dragonclaw
dragonclaw onboard
```
