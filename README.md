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
  <a href="https://launch.dragonclaw.asia">DragonLaunch 发射台</a> ·
  <a href="https://docs.dragonclaw.asia">Docs 文档</a> ·
  <a href="https://x.com/DragonClawCN">𝕏 @DragonClawCN</a> ·
  <a href="https://x.com/i/communities/2032492964522389747/">Community 社区</a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://x.com/DragonClawCN"><img src="https://img.shields.io/badge/𝕏-@DragonClawCN-000000?style=flat&logo=x" alt="X"></a>
  <a href="https://x.com/i/communities/2032492964522389747/"><img src="https://img.shields.io/badge/𝕏_Community-Join-000000?style=flat&logo=x" alt="X Community"></a>
</p>

---

DragonClaw is a personal AI agent you run on your own machine. It connects to the chat platforms Chinese users actually use (WeChat, DingTalk, Feishu + Telegram, Discord), runs on Chinese LLMs (DeepSeek, Qwen, Kimi, GLM) at 1/10th the cost, and ships with a full crypto trading stack built in. Spot trading, meme sniping, contract auditing, smart money tracking, cross-exchange arbitrage, whale mirroring, social trend trading, and a native token launchpad — all from a chat message. Fully compatible with the OpenClaw skill ecosystem (5,400+ skills).

龙爪是一个运行在你自己设备上的 AI 智能体。它连接中国用户日常使用的聊天平台（微信、钉钉、飞书 + Telegram、Discord），运行在国产大模型上（DeepSeek、Qwen、Kimi、GLM），成本仅为 GPT/Claude 的十分之一。内置完整的加密交易工具栈：现货交易、Meme 币狙击、合约审计、聪明钱追踪、跨平台套利、鲸鱼跟单、社交趋势交易、以及原生代币发射台——全部通过聊天消息操作。完全兼容 OpenClaw 技能生态（5,400+ 社区技能）。

## What Makes DragonClaw Different

| | OpenClaw | DragonClaw |
|---|---|---|
| LLMs | GPT/Claude ($3/day) | DeepSeek/Qwen/Kimi/GLM ($0.09/day) |
| Chat | Slack, Discord | DingTalk, Feishu, WeChat + Telegram, Discord |
| Trading | Community plugins | 7 Binance skills + Aster + PancakeSwap + GMGN built-in |
| Meme sniping | Manual via CLI | 24/7 auto-snipe engine (Four.meme + DragonLaunch) |
| Social alpha | None | Douyin + Xiaohongshu trend-to-trade pipeline |
| Whale tracking | Passive wallet lookup | Auto copy trading with safety audit |
| Arbitrage | None | 5-platform simultaneous price scanner |
| Launchpad | None | DragonLaunch — native BSC launchpad with AI agent integration |
| Creator scoring | None | On-chain reputation system with anti-rug intelligence |

## DragonLaunch 龙爪发射台

**[launch.dragonclaw.asia](https://launch.dragonclaw.asia)** — BSC memecoin launchpad built into DragonClaw.

- Launch a token from a chat message: "发一个币叫 DRAGONCAT，买 0.5 BNB"
- Bonding curve with auto-graduation to PancakeSwap V2
- LP burned forever (can't rug)
- Graduation sniper — agent auto-buys before PancakeSwap listing
- Creator reputation scoring — tracks every creator's history on-chain
- Anti-rug intelligence — monitors creator wallets, flags dumpers permanently
- Platform analytics — trending tokens, smart money, graduation velocity

Factory contract (BSC Testnet): [`0x7C91c8C2e354Ad1983FdbFC0B3fe2e78Ff02c370`](https://testnet.bscscan.com/address/0x7C91c8C2e354Ad1983FdbFC0B3fe2e78Ff02c370)

## 5 Background Engines (DragonClaw Exclusive)

These run 24/7 without you being there. OpenClaw can't do any of this.

### 1. Four.meme Auto-Snipe Engine
Polls BSC blocks every 3 seconds. Detects new token creation on Four.meme's TokenManager2. Filters by label, tax, version. Auto-buys with slippage protection. Notifications to all connected chat platforms.

### 2. Douyin Trend-to-Trade Pipeline
Scans Douyin hot search + Xiaohongshu trending every 60 seconds. Filters for crypto signals. Extracts potential token tickers. Searches across Binance, Four.meme, GMGN, Aster, PancakeSwap. Audits safety. Auto-buys or alerts. Western agents can't do this — they don't have Douyin access.

### 3. Whale Wallet Mirror
Monitors whale wallets across Solana, BSC, Base via GMGN. Detects new buy/sell transactions every 10 seconds. Audits token safety. Copies trades on the best available platform. Tracks holdings, auto-sells when whale sells.

### 4. Cross-Exchange Arbitrage Scanner
Checks the same token price across Binance, Aster, PancakeSwap, Four.meme, and GMGN simultaneously every 5 seconds. Alerts when spread exceeds threshold. Optional auto-trade.

### 5. DragonLaunch Agent
Monitors all DragonLaunch bonding curves. Graduation sniper buys before PancakeSwap listing. Creator reputation scoring. Anti-rug intelligence. Platform analytics. Chat-to-launch.

## Quick Start 快速开始

### One-liner (macOS/Linux)

```bash
curl -fsSL https://dragonclaw.asia/install.sh | bash
```

### Git Clone

```bash
git clone https://github.com/draguris/dragonclaw.git
cd dragonclaw && npm install
node src/cli.js onboard
```

### Windows

```powershell
irm https://dragonclaw.asia/install.ps1 | iex
```

## Skills (19 total)

### Core Trading
| Skill | Description | API Key Required |
|-------|-------------|:---:|
| Binance Spot | Buy/sell on Binance spot markets | ✅ |
| Binance Meme Rush | Track trending meme tokens | ❌ |
| Binance Market Rank | Top movers, volume leaders | ❌ |
| Binance Token Audit | Smart contract safety check | ❌ |
| Binance Token Info | Token metadata, holders, supply | ❌ |
| Binance Address Info | Wallet balance, transaction history | ❌ |
| Binance Trading Signal | Buy/sell signals, technical analysis | ❌ |

### DeFi
| Skill | Description | API Key Required |
|-------|-------------|:---:|
| Aster Finance | Perpetual futures (125x) + spot on Aster DEX | ✅ |
| PancakeSwap | Swap, liquidity, farming across 9 chains | ❌ |
| GMGN | On-chain data, contract security, swap trading | ✅ |
| Four.meme | BSC meme token creation + 24/7 auto-snipe | ✅ |
| DragonLaunch | Native BSC launchpad with AI agent integration | ✅ |

### Intelligence
| Skill | Description | API Key Required |
|-------|-------------|:---:|
| Whale Mirror | Copy trading from smart money wallets | ✅ |
| Arb Scanner | Cross-exchange price gap detection | ❌ |
| Douyin Pipeline | Social trend to trade execution | ❌ |
| DragonLaunch Agent | Graduation sniper + creator scoring + anti-rug | ✅ |

### Chinese Ecosystem
| Skill | Description | API Key Required |
|-------|-------------|:---:|
| Xiaohongshu | Product reviews, trending content, creator analytics | ❌ |
| Douyin | Hot search, video search, livestream commerce | ❌ |
| Video Animation | Agency-quality animated videos | ❌ |

## Architecture

```
src/
├── core/                    # 19 core modules
│   ├── agent-loop.js        # Main agent loop
│   ├── arb-scanner.js       # Cross-exchange arbitrage
│   ├── binance-client.js    # Binance HMAC-SHA256
│   ├── config.js            # YAML config loader
│   ├── cron.js              # Scheduled tasks
│   ├── douyin-trade-pipeline.js  # Douyin trend-to-trade
│   ├── dragon-launch-client.js   # DragonLaunch contract client
│   ├── dragonlaunch-agent.js     # Platform intelligence agent
│   ├── four-meme-client.js  # Four.meme BSC client (viem)
│   ├── four-meme-sniper.js  # 24/7 auto-snipe engine
│   ├── gateway.js           # Multi-connector gateway
│   ├── llm.js               # Chinese LLM router
│   ├── logger.js            # Structured logging
│   ├── memory.js            # SQLite conversation memory
│   ├── rate-limiter.js      # Token bucket rate limiter
│   ├── retry.js             # Exponential backoff retry
│   ├── secrets.js           # AES-256-GCM encrypted secrets
│   ├── skill-manager.js     # SKILL.md loader + executor
│   └── whale-mirror.js      # Whale copy trading engine
├── connectors/              # Chat platform connectors
│   ├── telegram.js
│   ├── dingtalk.js
│   ├── feishu.js
│   └── discord.js
├── contracts/               # DragonLaunch Solidity contracts
│   ├── DragonToken.sol      # BEP-20 with fixed supply
│   ├── DragonFactory.sol    # Token launch factory
│   ├── DragonCurve.sol      # Bonding curve with virtual reserves
│   └── DragonMigrator.sol   # PancakeSwap V2 graduation + LP burn
└── skills/                  # 9 skill directories
    ├── arb-scanner/
    ├── aster/
    ├── binance/ (7 sub-skills)
    ├── douyin/
    ├── dragon-launch/
    ├── dragonlaunch-agent/
    ├── four-meme/
    ├── pancakeswap/
    └── whale-mirror/
```

## Connectors

| Platform | Protocol | Status |
|----------|----------|--------|
| DingTalk 钉钉 | WebSocket | ✅ |
| Feishu 飞书 | WebSocket | ✅ |
| Telegram | Bot API | ✅ |
| Discord | Gateway | ✅ |
| WeChat 微信 | Planned | 🔜 |

## Supported LLMs

| Provider | Models | Cost (1M tokens) |
|----------|--------|:-:|
| DeepSeek | deepseek-chat, deepseek-coder | $0.14 |
| Alibaba Qwen | qwen-turbo, qwen-plus, qwen-max | $0.28 |
| Moonshot Kimi | moonshot-v1-8k/32k/128k | $0.55 |
| Zhipu GLM | glm-4-flash, glm-4 | $0.07 |
| OpenAI | gpt-4o (fallback) | $2.50 |
| Anthropic | claude-3.5-sonnet (fallback) | $3.00 |

## Configuration

Copy the example config and edit:

```bash
cp config/dragonclaw.example.yaml config/dragonclaw.yaml
```

Key sections:
```yaml
llm:
  provider: deepseek
  model: deepseek-chat

connectors:
  telegram:
    token: BOT_TOKEN
  dingtalk:
    appKey: APP_KEY
    appSecret: APP_SECRET

fourMeme:
  sniper:
    enabled: false
    buyAmountBnb: "0.01"
    labels: ["Meme", "AI"]

douyinPipeline:
  enabled: false
  minViews: 5000000
  autoTrade: false

whaleMirror:
  enabled: false
  wallets:
    - address: "0x..."
      chain: sol
      label: "Smart Money #1"

arbScanner:
  enabled: false
  minSpreadPercent: 2.0

dragonLaunchAgent:
  enabled: true
  sniperEnabled: false
  antiRugEnabled: true
```

## Links

- **Website**: [dragonclaw.asia](https://dragonclaw.asia)
- **Launchpad**: [launch.dragonclaw.asia](https://launch.dragonclaw.asia)
- **Docs**: [docs.dragonclaw.asia](https://docs.dragonclaw.asia)
- **X**: [@DragonClawCN](https://x.com/DragonClawCN)
- **Community**: [X Community](https://x.com/i/communities/2032492964522389747/)

## License

[MIT](LICENSE)

---

<p align="center">
  <strong>DragonClaw 龙爪</strong> — 开源 · 本地运行 · 币安内置 · 原生发射台 · 兼容 OpenClaw 技能生态 · MIT 协议
</p>
