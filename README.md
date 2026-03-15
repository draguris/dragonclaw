<p align="center">
  <img src="assets/cover.png" alt="DragonClaw 龙爪" width="100%">
</p>

<h1 align="center">DragonClaw 龙爪</h1>

<p align="center">
  <strong>Crypto-native AI agent for the Chinese ecosystem</strong><br>
  <strong>为中国用户打造的加密原生 AI 智能体</strong>
</p>

<p align="center">
  <a href="https://dragonclaw.asia">Website</a> ·
  <a href="https://docs.dragonclaw.asia">Docs 文档</a> ·
  <a href="https://x.com/DragonClawCN">𝕏 @DragonClawCN</a> ·
  <a href="https://x.com/i/communities/2032492964522389747/">Community 社区</a> ·
  <a href="#quick-start-快速开始">Getting Started</a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://x.com/DragonClawCN"><img src="https://img.shields.io/badge/𝕏-@DragonClawCN-000000?style=flat&logo=x" alt="X"></a>
  <a href="https://x.com/i/communities/2032492964522389747/"><img src="https://img.shields.io/badge/𝕏_Community-Join-000000?style=flat&logo=x" alt="X Community"></a>
</p>

---

DragonClaw is a personal AI agent you run on your own machine. It connects to the chat platforms Chinese users actually use (WeChat, DingTalk, Feishu + Telegram, Discord), runs on Chinese LLMs (DeepSeek, Qwen, Kimi, GLM) at 1/10th the cost, and ships with 7 Binance trading skills hardcoded. Spot trading, meme tracking, contract auditing, smart money analysis, all built in from day one. Fully compatible with the OpenClaw skill ecosystem (5,400+ skills).

龙爪是一个运行在你自己设备上的 AI 智能体。它连接中国用户日常使用的聊天平台（微信、钉钉、飞书 + Telegram、Discord），运行在国产大模型上（DeepSeek、Qwen、Kimi、GLM），成本仅为 GPT/Claude 的十分之一，并且内置 7 个币安交易技能。现货交易、Meme 币追踪、合约审计、聪明钱分析，安装即用。完全兼容 OpenClaw 技能生态（5,400+ 社区技能）。

## Install 安装

**Runtime 运行环境: Node >= 20**

**macOS / Linux:**

```bash
curl -fsSL https://dragonclaw.asia/install.sh | bash
```

**Windows (PowerShell):**

```powershell
irm https://dragonclaw.asia/install.ps1 | iex
```

**All platforms 所有平台:**

```bash
git clone https://github.com/draguris/dragonclaw.git
cd dragonclaw && npm install
node src/cli.js onboard
```

Then run the setup wizard / 然后运行配置向导:

```bash
dragonclaw onboard
```

The wizard walks you through picking your LLM, entering your API key, and optionally adding Binance and chat connector credentials.

配置向导会引导你选择大模型、输入 API Key，以及可选的币安和聊天连接器配置。

## Quick Start 快速开始

```bash
# Install 安装
curl -fsSL https://dragonclaw.asia/install.sh | bash

# Setup wizard 配置向导
dragonclaw onboard

# Start the agent 启动智能体
dragonclaw start

# Or chat in terminal 或在终端聊天
dragonclaw chat
```

## How It Works 工作原理

```
WeChat / DingTalk / Feishu / Telegram / Discord / Slack / WebSocket / CLI
               │
               ▼
┌───────────────────────────────┐
│           Gateway             │
│         控制平面               │
│    ws://127.0.0.1:18789       │
└──────────────┬────────────────┘
               │
               ├─ Agent Loop 智能体循环 (skills + memory → LLM → tool calls → response)
               ├─ Binance Client 币安客户端 (HMAC-signed, testnet default)
               ├─ Memory Store 记忆存储 (SQLite, 10K cap, auto-prune)
               └─ Skill Manager 技能管理器 (7 core + user skills)
```

## Built-in Binance Skills 内置币安技能

Seven skills ship hardcoded. Six require no API key.

七个技能内置于核心。其中六个不需要 API Key。

| Skill 技能 | What it does 功能 | Key 密钥? |
|-------|-------------|------|
| **Spot Trading 现货交易** | Place, cancel, query spot orders 下单/撤单/查询 | Yes 需要 |
| **Meme Rush** | Real-time meme token launches 实时 Meme 币追踪 | No 不需要 |
| **Market Rankings 市场排行** | Trending tokens, smart money flows 热门代币、聪明钱 | No 不需要 |
| **Token Audit 合约审计** | Contract security scan 合约安全扫描 | No 不需要 |
| **Token Info 代币信息** | Token metadata, live prices 代币数据、实时价格 | No 不需要 |
| **Address Info 地址查询** | Wallet holdings and portfolio 钱包持仓 | No 不需要 |
| **Trading Signals 交易信号** | AI-generated signals with backtest AI 信号 + 回测 | No 不需要 |

### Chinese Ecosystem Skills 中国生态技能

| Skill 技能 | Platform 平台 | Function 功能 |
|-------|----------|---------|
| **Xiaohongshu 小红书** | RedNote | Product reviews, trending content 种草测评、热门内容 |
| **Douyin 抖音** | TikTok China | Viral trends, livestream commerce, creator analytics 热搜、直播带货、博主数据 |

### OpenClaw Compatibility OpenClaw 兼容

Same `SKILL.md` format. Every ClawHub skill works.

相同的 `SKILL.md` 格式。ClawHub 上所有技能直接可用。

```bash
cp -r some-openclaw-skill ~/.dragonclaw/skills/
dragonclaw skills  # verify 验证
```

## LLM Providers 大模型

| Provider 服务商 | Default Model 默认模型 | Cost 成本/1M tokens |
|----------|--------------|----------------|
| **DeepSeek** | `deepseek-chat` | ~$0.14 |
| **Qwen 通义千问** | `qwen-max` | ~$0.40 |
| **Kimi** | `moonshot-v1-128k` | ~$0.55 |
| **GLM 智谱** | `glm-4-flash` | ~$0.10 |
| OpenAI | `gpt-4o` | ~$5.00 |
| Anthropic | `claude-sonnet-4-20250514` | ~$3.00 |
| OpenRouter | any | varies |
| Local 本地 | any (Ollama, vLLM) | free 免费 |

## Connectors 连接器

| Platform 平台 | Protocol 协议 | Status 状态 |
|----------|----------|--------|
| **Telegram** | Bot API (long polling) | Stable 稳定 |
| **DingTalk 钉钉** | Robot Webhook + HTTP callback | Stable 稳定 |
| **Feishu 飞书** | Bot Events API + OAuth | Stable 稳定 |
| **Discord** | Gateway WebSocket | Stable 稳定 |
| **WeChat 微信** | Official Account API | Planned 计划中 |
| WebSocket / HTTP | Built-in 内置 | Always on 始终可用 |

### Quick Connector Setup 快速连接器配置

```yaml
# Telegram
connectors:
  telegram:
    enabled: true
    token: "123456:ABC-your-bot-token"

# DingTalk 钉钉
connectors:
  dingtalk:
    enabled: true
    robotWebhook: "https://oapi.dingtalk.com/robot/send?access_token=..."
    appSecret: "SEC..."

# Feishu 飞书
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

## Configuration 配置

Config file 配置文件: `~/.dragonclaw/dragonclaw.yaml`

Minimal config 最小配置 (just need an LLM key / 只需大模型密钥):

```yaml
llm:
  provider: deepseek
  apiKey: "sk-..."
```

### Environment Variables 环境变量

| Variable 变量 | What it sets 用途 |
|----------|-------------|
| `DRAGONCLAW_LLM_PROVIDER` | LLM provider 大模型服务商 |
| `DRAGONCLAW_LLM_API_KEY` | LLM API key 大模型密钥 |
| `DRAGONCLAW_GATEWAY_TOKEN` | Gateway auth token 网关认证 |
| `BINANCE_API_KEY` | Binance API key 币安密钥 |
| `BINANCE_API_SECRET` | Binance secret 币安私钥 |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token |
| `LOG_LEVEL` | `debug` / `info` / `warn` / `error` |

## CLI 命令

```bash
dragonclaw onboard   # setup wizard 配置向导
dragonclaw start     # start gateway + connectors 启动
dragonclaw chat      # terminal REPL 终端聊天
dragonclaw doctor    # health check 健康检查
dragonclaw skills    # list loaded skills 列出技能
```

## Security 安全

- **Testnet by default 默认测试网** — explicit `testnet: false` required for real money / 真金白银需要显式关闭测试网
- **Confirmation required 需要确认** — shows order details, waits for `CONFIRM` / 显示订单详情，等待确认
- **No withdrawal endpoints 无提现接口** — not in the codebase / 代码中不存在
- **HMAC-SHA256 signing 签名** — all Binance auth calls / 所有币安认证请求
- **Gateway auth 网关认证** — bearer token + rate limiting (20/min per user)
- **AES-256 encrypted secrets 加密存储** at rest

## Architecture 架构

```
src/
├── index.js              # Entry point 入口
├── cli.js                # CLI commands 命令行
├── core/
│   ├── agent-loop.js     # Reasoning engine 推理引擎
│   ├── binance-client.js # Binance API + HMAC signing
│   ├── config.js         # YAML + env var config 配置
│   ├── gateway.js        # WebSocket + HTTP (auth, rate limit)
│   ├── llm.js            # All providers 所有大模型 (retry, timeout)
│   ├── logger.js         # Structured JSON logging 结构化日志
│   ├── memory.js         # SQLite (10K cap, auto-prune) 记忆存储
│   ├── rate-limiter.js   # Token bucket 令牌桶限流
│   ├── retry.js          # Exponential backoff 指数退避
│   ├── secrets.js        # AES-256 encryption 加密
│   ├── skill-manager.js  # SKILL.md loader 技能加载器
│   └── cron.js           # Scheduler 定时任务
├── connectors/           # Telegram, DingTalk, Feishu, Discord 连接器
└── skills/               # Binance (7) + Xiaohongshu + Douyin 技能
```

## DragonClaw vs OpenClaw 龙爪 vs OpenClaw

| | OpenClaw | DragonClaw 龙爪 |
|---|----------|------------|
| Chat platforms 聊天平台 | WhatsApp, iMessage, Signal | WeChat, DingTalk, Feishu + TG, Discord |
| Default LLM 默认大模型 | Claude / GPT | DeepSeek / Qwen |
| Crypto 加密货币 | Plugin 插件 | 7 skills hardcoded 内置 |
| Language 语言 | English-first | Chinese-first 中文优先 |
| Cost/query 每次查询成本 | ~$0.01-0.03 | ~$0.001-0.003 |
| Skill format 技能格式 | SKILL.md | SKILL.md (cross-compatible 互相兼容) |

## Docs 文档

Full documentation 完整文档: [docs.dragonclaw.asia](https://docs.dragonclaw.asia)

## Community 社区

<a href="https://x.com/DragonClawCN"><img src="https://img.shields.io/badge/𝕏-@DragonClawCN-000000?style=flat&logo=x" alt="X"></a>
<a href="https://x.com/i/communities/2032492964522389747/"><img src="https://img.shields.io/badge/𝕏_Community-Join-000000?style=flat&logo=x" alt="X Community"></a>

Follow 关注 [@DragonClawCN](https://x.com/DragonClawCN)

Join the community 加入社区: [DragonClaw Community on X](https://x.com/i/communities/2032492964522389747/)

## Contributing 贡献

See 参见 [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines. PRs welcome. 欢迎 PR。

## License 协议

[MIT](LICENSE)

---

<p align="center">Built for crypto traders who think in Chinese. 为中文用户打造的加密交易智能体。龙爪已就位。</p>
