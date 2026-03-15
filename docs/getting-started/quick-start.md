# Quick Start

Get DragonClaw running in under 5 minutes.

## Prerequisites

- **Node.js 20+** (the installer handles this automatically)
- **An LLM API key** from any supported provider (DeepSeek recommended — cheapest)

## Option 1: One-liner Install

```bash
curl -fsSL https://dragonclaw.asia/install.sh | bash
```

This installs Node.js (if needed), clones DragonClaw, installs dependencies, and adds the `dragonclaw` command to your PATH.

## Option 2: npm

```bash
npm i -g dragonclaw
```

## Option 3: Docker

```bash
docker run -d --name dragonclaw \
  -v ~/.dragonclaw:/data \
  -p 18789:18789 \
  -e DRAGONCLAW_LLM_PROVIDER=deepseek \
  -e DRAGONCLAW_LLM_API_KEY=sk-your-key \
  dragonclaw/dragonclaw:latest
```

## Setup Wizard

After installation, run the onboarding wizard:

```bash
dragonclaw onboard
```

It will ask you:

1. **Which LLM?** — Pick from DeepSeek, Qwen, Kimi, GLM, OpenAI, Anthropic, OpenRouter
2. **API key** — Paste your key
3. **Binance** — Optionally add your Binance API key (most skills work without it)
4. **Chat platform** — Optionally connect Telegram, DingTalk, or others
5. **Agent name** — Name your dragon (default: 龙爪)

The wizard writes a config file to `~/.dragonclaw/dragonclaw.yaml`.

## Start the Agent

```bash
dragonclaw start
```

You should see:
```
{"ts":"...","level":"info","module":"dragonclaw","msg":"DragonClaw v0.1.0 starting"}
{"ts":"...","level":"info","module":"dragonclaw","msg":"Config loaded","llm":"deepseek/deepseek-chat"}
{"ts":"...","level":"info","module":"dragonclaw","msg":"Skills loaded","core":7,"user":0}
{"ts":"...","level":"info","module":"dragonclaw","msg":"DragonClaw ready","port":18789}
```

## Chat via CLI

```bash
dragonclaw chat
```

```
  你: 现在BTC什么价格？

  🐉: 正在查询...
      BTC/USDT 当前价格: $67,432.50 (24h变化: +2.3%)
```

## Verify Installation

```bash
dragonclaw doctor
```

This checks: Node version, config file, LLM key, Binance key, connectors, and skill count.

## What's Next

- [Configuration Guide](configuration.md) — deep dive into all config options
- [Binance Skills](../skills/binance-overview.md) — what you can do with the built-in skills
- [Connectors](../connectors/overview.md) — connect to DingTalk, Feishu, WeChat
- [Deployment](../deployment/vps.md) — run on a VPS with SSL
