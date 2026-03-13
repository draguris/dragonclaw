---
title: Crypto Market Rankings
slug: market-rank
description: Trending tokens, smart money inflows, meme rankings, top trader leaderboards. No API key needed.
version: 1.0.0
author: dragonclaw
---

# Crypto Market Rankings

Query trending tokens, social hype sentiment, smart money flows, and top trader PnL leaderboards.

## When to Use
User asks about trending coins, what is hot, top tokens, market rankings, smart money, best traders, or social buzz.

## No API Key Required

## Endpoints
- Social hype leaderboard: GET /bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/pulse/social/hype/rank/leaderboard
- Unified ranking: GET /bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/pulse/unified/rank/list  
- Top traders: GET /bapi/defi/v1/public/wallet-direct/market/leaderboard/query

## Tool Call
```tool
{"tool": "binance_market", "action": "GET", "endpoint": "/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/pulse/social/hype/rank/leaderboard", "params": {"chainId": "CT_501", "sentiment": "All", "timeRange": "1"}}
```
