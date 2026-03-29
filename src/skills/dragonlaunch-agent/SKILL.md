---
title: DragonLaunch Agent — Platform-Native Intelligence (Solana + BSC)
slug: dragonlaunch-agent
description: Launch tokens on Solana via Meteora DBC, snipe graduations, score creators, detect rugs — all exclusively on DragonLaunch. Use when user asks to launch a token, check creator reputation, monitor graduations, check platform stats, or mentions DragonLaunch/发射台/发币/毕业狙击/创建者信用. All fees → $DRAGONCLAW.
version: 2.0.0
author: dragonclaw
license: MIT
---

# DragonLaunch Agent — Platform-Native Intelligence

Solana (Meteora DBC) + BSC (custom factory). Every DragonClaw agent is a power user on DragonLaunch. All platform fees → $DRAGONCLAW buyback & burn.

## Why This Only Works on DragonLaunch

On Solana: We own the DBC config key. We read every pool directly via the SDK. No API, no scraping.
On BSC: We own the factory contract. Direct on-chain reads.
Four.meme, pump.fun, Raydium — none of them give you this.

## Features

### 1. Chat-to-Launch (Solana)

```
用户: 帮我在 Solana 上发一个币叫 DRAGONCAT
龙爪: 代币发射成功 🚀 (Solana)

  名称: DragonCat ($DCAT)
  Mint: 7xK3...9mPq
  初始买入: 0.5 SOL
  
  Solscan: https://solscan.io/token/7xK3...
  Jupiter: https://jup.ag/swap/SOL-7xK3...
  
  手续费 → $DRAGONCLAW 回购销毁
```

How it works:
1. Agent uploads metadata to Pinata IPFS
2. Generates mint keypair
3. Calls `client.pool.createPool()` with config key `A9jZY...`
4. Signs with agent wallet + mint keypair
5. Optional initial buy via `client.pool.swap()`
6. Token immediately tradeable on Jupiter

### 2. Graduation Sniper (Solana)

Monitors all pools created through our config key. When a pool's quote reserve approaches `migrationQuoteThreshold`, auto-buys before Meteora's migrator service moves it to DAMM.

```
毕业狙击成功 🎯 (Solana)

Mint: 7xK3...9mPq
进度: 92%
买入: 0.1 SOL

毕业后迁移到 Meteora DAMM，价格通常上涨。
手续费 → $DRAGONCLAW
```

### 3. Creator Reputation Scoring

On-chain tracking across both chains:
- +15 per graduation
- -30 per rug/dump
- -50 if flagged for dumping
- Persistent across all DragonClaw agents

```
用户: 这个创建者靠谱吗？7xK3...
龙爪: 创建者信用报告

  地址: 7xK3...9mPq
  信用分: 78/100 🟢
  风险: 低
  
  发射: 5 个
  毕业: 3 (60%)
  跑路: 0
```

### 4. Anti-Rug Intelligence

Monitors creator token balances. If a creator dumps their allocation, permanent flag. All DragonClaw users get warned.

### 5. Platform Analytics

```
用户: DragonLaunch 怎么样？
龙爪: DragonLaunch 平台报告 (Solana)

  总发射: 42
  已毕业: 6
  活跃: 36
  追踪创建者: 28
  标记创建者: 1
  
  手续费 → $DRAGONCLAW 回购销毁
```

## Config (dragonclaw.yaml)

```yaml
dragonLaunchAgent:
  enabled: true
  # Solana (primary)
  solanaRpc: "https://mainnet.helius-rpc.com/?api-key=YOUR_KEY"
  configKey: "A9jZYZgGcg7xKipkQPRVEZxfrvpWmwN9iivptC6fkSc2"
  # BSC (secondary)
  bscRpc: "https://data-seed-prebsc-1-s1.binance.org:8545"
  bscFactory: "0x7C91c8C2e354Ad1983FdbFC0B3fe2e78Ff02c370"
  # Sniper
  sniperEnabled: false
  sniperBuySol: "0.1"
  sniperMaxPerHour: 3
  # Anti-rug
  antiRugEnabled: true
```

## The Flywheel

More DragonClaw agents → more launches on DragonLaunch → more fees → more $DRAGONCLAW buyback → higher token value → more users want DragonClaw.
