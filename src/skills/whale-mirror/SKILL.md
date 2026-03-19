---
title: Whale Wallet Mirror — Copy Trading Engine
slug: whale-mirror
description: Monitor whale wallet addresses and automatically copy their trades. Tracks wallets via GMGN across Solana, BSC, and Base. When a whale buys, DragonClaw buys. When they sell, DragonClaw sells. Safety audit before every trade. Use when user asks about whale tracking, copy trading, smart money following, wallet mirroring, or mentions whale/鲸鱼/聪明钱/跟单.
version: 1.0.0
author: dragonclaw
license: MIT
---

# Whale Wallet Mirror — Copy Trading Engine

## When to Use

- User wants to follow/copy a whale wallet's trades
- User asks about smart money tracking or copy trading
- User provides a wallet address and says "follow" or "copy"
- User mentions 鲸鱼, 聪明钱, 跟单, whale tracking

## DragonClaw Exclusive

OpenClaw can track a wallet. It can also place a trade. But it can't watch a wallet 24/7, detect a new trade, audit the token, and copy the trade — all automatically, while you sleep. DragonClaw can.

## How It Works

1. **Monitor**: Polls whale wallet activity via GMGN every 10 seconds
2. **Detect**: Identifies new buy/sell transactions
3. **Filter**: Checks trade value ($500+ by default), cooldowns, rate limits
4. **Audit**: Runs token safety check (honeypot, tax, contract security)
5. **Execute**: Copies the trade on the best available platform (GMGN swap, Four.meme, Binance, Aster)
6. **Track**: Remembers what we hold from copy trades, sells when whale sells
7. **Notify**: Pushes every action to DingTalk/Feishu/Telegram

## Commands

### Add Wallet to Watch

```tool
{"tool": "whale_mirror", "action": "addWallet", "params": {
  "address": "WALLET_ADDRESS",
  "chain": "sol",
  "label": "聪明钱1号"
}}
```

Chains: sol, bsc, base

### Remove Wallet

```tool
{"tool": "whale_mirror", "action": "removeWallet", "params": {
  "address": "WALLET_ADDRESS"
}}
```

### List Watched Wallets

```tool
{"tool": "whale_mirror", "action": "listWallets"}
```

### Start Monitoring

```tool
{"tool": "whale_mirror", "action": "start", "config": {
  "copyBuy": true,
  "copySell": true,
  "buyAmountSol": "0.5",
  "buyAmountBnb": "0.05",
  "requireAudit": true,
  "notifyOnDetect": true
}}
```

### Stop Monitoring

```tool
{"tool": "whale_mirror", "action": "stop"}
```

### Check Status

```tool
{"tool": "whale_mirror", "action": "status"}
```

### View Holdings (from copy trades)

```tool
{"tool": "whale_mirror", "action": "holdings"}
```

### View Copy History

```tool
{"tool": "whale_mirror", "action": "history"}
```

### Update Config

```tool
{"tool": "whale_mirror", "action": "update", "config": {
  "buyAmountSol": "1.0",
  "maxCopiesPerHour": 5,
  "minTradeValueUsd": 1000
}}
```

## Config Options

| Option | Default | Description |
|--------|---------|-------------|
| copyBuy | true | Copy whale buy trades |
| copySell | true | Copy whale sell trades |
| buyAmountBnb | "0.05" | BNB per copy trade (BSC) |
| buyAmountSol | "0.5" | SOL per copy trade (Solana) |
| buyAmountUsdt | 20 | USDT per copy trade (CEX) |
| sellPercent | 100 | % to sell when whale sells |
| requireAudit | true | Safety check before buying |
| maxTaxRate | 5 | Max acceptable tax % |
| skipIfAlreadyHolding | true | Don't double-buy |
| maxCopiesPerHour | 10 | Rate limit |
| minTradeValueUsd | 500 | Min whale trade value to copy |
| maxTradeValueUsd | 1000000 | Skip suspiciously large |
| cooldownPerTokenMs | 600000 | 10 min cooldown per token |
| pollIntervalMs | 10000 | Scan frequency (10s) |

## Example Conversations

```
用户: 跟踪这个钱包 9abc...def0，Solana 链，他买什么我买什么，每次 0.5 SOL
龙爪: 已添加鲸鱼跟踪:

  钱包: 9abc...def0
  标签: 鲸鱼 #1
  链: Solana
  跟买金额: 0.5 SOL
  跟卖: 100%
  安全审计: 开启
  最低金额: $500+

  监控已启动。鲸鱼操作会实时通知你。
```

```
[3:27 AM — 钉钉通知]

鲸鱼动态检测

鲸鱼: 鲸鱼 #1
操作: 买入 $NEWMEME
金额: ~$12,340
链: SOL
合约: 9gyc...L63b

正在审计并准备跟单...

---

鲸鱼跟单买入成功

鲸鱼: 鲸鱼 #1
代币: $NEWMEME
平台: gmgn-sol
金额: 0.5 SOL
交易哈希: 4xK7...

来源: 鲸鱼监控 → 安全审计 → 自动买入
```

```
用户: 现在跟了几个钱包？持仓怎么样？
龙爪: 鲸鱼跟单状态:

  监控钱包: 3 个
  本小时跟单: 2/10
  当前持仓: 4 个代币

  持仓:
  1. $NEWMEME (Solana) — 来自鲸鱼 #1 — 2小时前
  2. $DOGE2 (BSC) — 来自鲸鱼 #2 — 5小时前
  3. $AITOKEN (Solana) — 来自鲸鱼 #1 — 8小时前
  4. $CATCOIN (BSC) — 来自鲸鱼 #3 — 12小时前
```

## Display Guidelines

### Whale Detection
```
鲸鱼动态检测

鲸鱼: LABEL
操作: 买入/卖出 $TOKEN
金额: ~$X,XXX
链: SOL/BSC/BASE
合约: 0x...
```

### Copy Success
```
鲸鱼跟单买入成功

鲸鱼: LABEL
代币: $TOKEN
平台: PLATFORM
金额: X SOL/BNB
交易哈希: 0x...

来源: 鲸鱼监控 → 安全审计 → 自动买入
```

### Status
```
鲸鱼跟单状态:

  监控钱包: X 个
  本小时跟单: X/10
  当前持仓: X 个代币
  总跟单次数: X
```

## Safety Rules

1. Always audit tokens before copying (honeypot, tax, contract security)
2. Rate limit: 10 copies per hour maximum
3. 10 minute cooldown per token to prevent duplicates
4. Skip trades below $500 (noise) or above $1M (suspicious)
5. Never expose wallet private keys in notifications
6. Auto-sell when whale sells to limit exposure

## Cross-Skill Integration

- **GMGN**: Primary data source for wallet tracking and token security
- **Four.meme**: Execute copy trades on BSC meme tokens
- **Binance**: Copy trades for tokens listed on Binance
- **Aster**: Open futures positions to follow whale sentiment
- **Douyin pipeline**: When a whale buys a token that's also trending on Douyin, signal is 2x stronger

## Config (dragonclaw.yaml)

```yaml
whaleMirror:
  enabled: false
  wallets:
    - address: "9abc...def0"
      chain: sol
      label: "聪明钱1号"
    - address: "0x1a2b...3c4d"
      chain: bsc
      label: "BSC大户"
  copyBuy: true
  copySell: true
  buyAmountSol: "0.5"
  buyAmountBnb: "0.05"
  requireAudit: true
  maxCopiesPerHour: 10
  minTradeValueUsd: 500
```

## Requirements

- GMGN API Key (GMGN_API_KEY) — required for wallet tracking
- GMGN Private Key (GMGN_PRIVATE_KEY) — required for swap execution on Solana/BSC
- For Four.meme: PRIVATE_KEY (BSC wallet)
- For Binance: BINANCE_API_KEY + BINANCE_SECRET_KEY

## Notes

- First scan of a new wallet only records the latest tx, doesn't trade (prevents buying into old positions)
- The engine tracks what it bought and only sells tokens it holds from copy trades
- Multiple wallets can be monitored simultaneously
- Each chain requires its own wallet credentials for execution
