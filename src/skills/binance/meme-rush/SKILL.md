---
title: Meme Rush
slug: meme-rush
description: Track real-time meme token launches, migrations, and trending narratives. No API key required.
version: 1.0.0
author: dragonclaw
license: MIT
---

# Meme Rush

Real-time meme token tracking from launchpads (Pump.fun, Four.meme, etc.) and AI-powered trending topics.

## When to Use
User asks about new meme tokens, meme launches, bonding curves, migration status, pump.fun, four.meme, trending narratives, hot topics, or "what memes are popping."

## No API Key Required
All endpoints are public Binance Web3 APIs.

## Capabilities
1. **New Launches** — freshly created tokens on launchpads
2. **Migration Watch** — tokens about to graduate from bonding curve to DEX
3. **Post-Migration** — just-migrated tokens with early DEX liquidity
4. **Topic Rush** — AI-ranked market hot topics with associated tokens

## Key Endpoints

### Meme Token List
GET /bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/meme-rush/rank/list
Params: chainId (CT_501=Solana, 56=BSC), listType (1=New, 2=Finalizing, 3=Migrated), sort (10=create time, 30=viral time)

### Topic Rush (Trending Narratives)
GET /bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/social-rush/rank/list
Params: chainId, rankType (30=viral), sort, asc (true/false)

## Tool Call Format
```tool
{"tool": "binance_market", "action": "GET", "endpoint": "/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/meme-rush/rank/list", "params": {"chainId": "CT_501", "listType": "1", "sort": "10"}}
```

## Display Guidelines
- Show token name, symbol, price, progress %, dev sell %, holder count
- Flag tokens where dev sold >50% or top10 holders >80%
- Percentage fields are pre-formatted, just append %
