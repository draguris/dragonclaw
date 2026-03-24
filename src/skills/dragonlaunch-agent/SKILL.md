---
title: DragonLaunch Agent — Platform-Native Intelligence
slug: dragonlaunch-agent
description: Launch tokens, snipe graduations, score creators, detect rugs — all exclusively on DragonLaunch (launch.dragonclaw.asia). Every DragonClaw agent is a power user on DragonLaunch. Use when user asks to launch a token, check creator reputation, monitor graduations, check platform stats, or mentions DragonLaunch/发射台/发币/毕业狙击/创建者信用.
version: 1.0.0
author: dragonclaw
license: MIT
---

# DragonLaunch Agent — Platform-Native Intelligence

## Why This Only Works on DragonLaunch

We own the factory contract. We read every bonding curve directly on-chain. No API key. No rate limits. No scraping. Every DragonClaw agent has god-mode on DragonLaunch. This is impossible on Four.meme or any other platform.

## Features

### 1. Chat-to-Launch

Launch a token from a chat message. No browser needed.

```
用户: 帮我发一个币叫 DRAGONCAT，描述是最强龙猫，买 0.5 BNB
龙爪: 代币发射成功 🚀

  名称: DragonCat ($DCAT)
  合约: 0xabc...
  曲线: 0xdef...
  初始买入: 0.5 BNB
  
  交易哈希: 0x...
  链接: launch.dragonclaw.asia
```

```tool
{"tool": "dragonlaunch", "action": "launch", "params": {
  "name": "DragonCat",
  "symbol": "DCAT",
  "description": "最强龙猫",
  "preBuyBnb": "0.5",
  "tag": "Meme"
}}
```

### 2. Graduation Sniper

Monitors all bonding curves. When a token hits 90%+ progress, auto-buys before graduation.

Why this matters: After graduation, token hits PancakeSwap and price typically spikes. The sniper buys at bonding curve price (cheaper) right before the PancakeSwap listing.

```
[毕业狙击通知]

毕业狙击成功 🎯

代币: MoonDragon ($MDRG)
买入: 0.1 BNB
距毕业: 0.34 BNB

毕业后将自动上 PancakeSwap，价格通常会上涨。
```

```tool
{"tool": "dragonlaunch", "action": "startSniper", "config": {
  "minProgress": 90,
  "buyBnb": "0.1",
  "maxPerHour": 3
}}
```

### 3. Creator Reputation Scoring

Every creator is scored based on their history on DragonLaunch:

- +15 points per graduated token
- -30 points per rug/dump
- +3 per launch (experience)
- -50 if flagged for dumping

```
用户: 这个创建者靠谱吗？0x1a2b...
龙爪: 创建者信用报告

  地址: 0x1a2b...3c4d
  信用分: 78/100 🟢
  风险等级: 低
  
  发射: 5 个代币
  毕业: 3 个 (60%)
  跑路: 0 个
  
  最近发射:
    DCAT — 2026-03-24
    MDRG — 2026-03-22
```

```tool
{"tool": "dragonlaunch", "action": "creatorScore", "params": {"creator": "0x..."}}
```

### 4. Anti-Rug Intelligence

Monitors creator wallets. If a creator dumps >50% of their 20% allocation, they're flagged permanently. All users get warned on future launches by this creator.

```
⚠️ 创建者抛售警报

代币: ScamToken ($SCAM)
创建者: 0x5e6f...7g8h
剩余分配: 12%
已卖出: 88% 创建者分配

此创建者已被标记。未来发射将显示警告。
```

### 5. Platform Analytics

Real-time data on every token, every curve, every creator — because we read the contracts directly.

```
用户: DragonLaunch 现在怎么样？
龙爪: DragonLaunch 平台报告

  总发射: 142
  已毕业: 18 (12.7%)
  活跃曲线: 47
  总筹集: 892.4 BNB
  追踪创建者: 89
  标记创建者: 3

  热门代币 (按进度排序):
    MDRG — 87.3% — 15.7 BNB — 创建者 🟢 85/100
    DCAT — 64.1% — 11.5 BNB — 创建者 🟡 52/100
    PEPE2 — 41.2% — 7.4 BNB — 创建者 🟠 28/100
```

```tool
{"tool": "dragonlaunch", "action": "stats"}
```

```tool
{"tool": "dragonlaunch", "action": "trending"}
```

### 6. Portfolio Tracking

Track all your DragonLaunch holdings — tokens bought via chat, sniper positions, manual buys.

```tool
{"tool": "dragonlaunch", "action": "holdings"}
```

## Example Conversations

```
用户: 发一个 AI 主题的币，叫 AIDRAGON，买 1 BNB
龙爪: 正在部署...

  检查创建费: ~0.005 BNB
  部署合约中...请等待...

  ✓ 代币发射成功 🚀
  名称: AIDRAGON ($AIDRAGON)
  合约: 0xabc123...
  初始买入: 1 BNB
  曲线进度: 5.6%

  链接: launch.dragonclaw.asia
```

```
用户: DragonLaunch 上有什么热门的？
龙爪: 热门代币:

  1. MDRG — 87.3% 进度 — 15.7/18 BNB — 即将毕业
     创建者: 0x1a2b... 🟢 信用 85/100

  2. DCAT — 64.1% 进度 — 11.5/18 BNB
     创建者: 0x3c4d... 🟡 信用 52/100

  ⚠️ 注意: SCAM2 的创建者 0x5e6f... 已被标记为抛售者
```

```
用户: 开启毕业狙击
龙爪: 毕业狙击已开启:

  最低进度: 90%
  每次买入: 0.1 BNB
  上限: 3 次/小时

  正在监控所有 DragonLaunch 曲线...
  检测到接近毕业的代币会自动买入。
```

## Config (dragonclaw.yaml)

```yaml
dragonLaunchAgent:
  enabled: true
  network: testnet
  factoryAddress: "0x7C91c8C2e354Ad1983FdbFC0B3fe2e78Ff02c370"
  rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545"
  apiUrl: "https://launch.dragonclaw.asia/api"
  sniperEnabled: false
  sniperMinProgress: 90
  sniperBuyBnb: "0.1"
  sniperMaxPerHour: 3
  antiRugEnabled: true
  antiRugDumpThreshold: 50
```

## Safety Rules

1. Chat-to-launch always confirms before deploying
2. Graduation sniper has rate limits (3/hour max)
3. Anti-rug only flags, never auto-sells
4. Creator scores are based on on-chain data, not opinions
5. All trades go through user's wallet private key

## Why This Matters

Every DragonClaw user is a power user on DragonLaunch. Every DragonLaunch token is watched by an AI agent. This creates a flywheel:

- More DragonClaw users → more activity on DragonLaunch
- More DragonLaunch activity → more data for the agent
- More data → better creator scores, better snipes, better analytics
- Better analytics → more users want DragonClaw

Four.meme can't replicate this. Their platform is a website. Ours is an AI agent with a launchpad built in.
