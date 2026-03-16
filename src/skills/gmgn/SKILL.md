---
title: GMGN On-Chain Trading & Analytics
slug: gmgn
description: Query real-time on-chain token data, analyze contract security, track wallets, fetch candlestick charts, check trending tokens, and execute swap trades via GMGN. Use when user asks about on-chain data, token security, wallet tracking, swap trading, trending tokens, snipers, insiders, bundled wallets, liquidity pools, or mentions GMGN.
version: 1.0.0
author: dragonclaw
license: MIT
---

# GMGN — On-Chain Trading & Analytics

## When to Use

- User asks about on-chain token data, prices, or liquidity
- User wants to check contract security or detect scams
- User asks about snipers, insiders, or bundled wallets on a token
- User wants to swap/buy/sell tokens on Solana, BSC, or Base
- User asks about wallet holdings, PnL, or transaction history
- User wants candlestick data or technical analysis for a token
- User asks what tokens are trending on-chain right now
- User mentions GMGN, on-chain trading, DEX swap, or liquidity pool

## Overview

GMGN provides real-time multi-chain on-chain data and trading capabilities. It covers token analysis, market data, trending discovery, wallet portfolio tracking, and swap execution across Solana, BSC, and Base chains. The API outputs advanced research metrics including sniper detection, insider identification, and bundled wallet analysis.

## API Key Setup

GMGN requires an API key for all endpoints. Users can get one at https://gmgn.ai/ai

The API key should be set as an environment variable:

```
GMGN_API_KEY=your-api-key-here
```

For swap trading, a private key is also required:

```
GMGN_PRIVATE_KEY=your-wallet-private-key
```

The private key must match the wallet bound to the API key.

If the user has not configured GMGN credentials, tell them:
"需要配置 GMGN API Key。前往 https://gmgn.ai/ai 申请，然后设置环境变量 GMGN_API_KEY。"

## Supported Chains

| Chain | Chain ID | Trading Base Tokens |
|-------|----------|-------------------|
| Solana | sol | SOL, USDC |
| BSC | bsc | BNB, USDC |
| Base | base | ETH, USDC |

## Endpoints

### Token Basic Info & Price

Get token metadata, real-time price, market cap, and liquidity.

```tool
{"tool": "shell", "command": "curl -s 'https://api.gmgn.ai/v1/token/sol/TOKEN_ADDRESS' -H 'Authorization: Bearer $GMGN_API_KEY' 2>/dev/null | head -c 5000"}
```

Replace `sol` with `bsc` or `base` for other chains.

### Contract Security Check

Analyze contract for honeypot, rug pull mechanics, mint functions, blacklists, and tax rates.

```tool
{"tool": "shell", "command": "curl -s 'https://api.gmgn.ai/v1/token/sol/TOKEN_ADDRESS/security' -H 'Authorization: Bearer $GMGN_API_KEY' 2>/dev/null | head -c 5000"}
```

### Top Holders & Traders

Get top holders with sniper, insider, and bundled wallet detection.

```tool
{"tool": "shell", "command": "curl -s 'https://api.gmgn.ai/v1/token/sol/TOKEN_ADDRESS/holders' -H 'Authorization: Bearer $GMGN_API_KEY' 2>/dev/null | head -c 5000"}
```

### Candlestick / K-Line Data

Fetch OHLCV candlestick data. Resolutions: 1m, 5m, 15m, 1h, 4h, 1d.

```tool
{"tool": "shell", "command": "curl -s 'https://api.gmgn.ai/v1/market/sol/TOKEN_ADDRESS/candles?resolution=1h&limit=24' -H 'Authorization: Bearer $GMGN_API_KEY' 2>/dev/null | head -c 5000"}
```

### Trending Tokens

Get the current trending tokens list for a chain.

```tool
{"tool": "shell", "command": "curl -s 'https://api.gmgn.ai/v1/trending/sol' -H 'Authorization: Bearer $GMGN_API_KEY' 2>/dev/null | head -c 5000"}
```

### Wallet Portfolio & Holdings

Query wallet token balances and total portfolio value.

```tool
{"tool": "shell", "command": "curl -s 'https://api.gmgn.ai/v1/portfolio/sol/WALLET_ADDRESS' -H 'Authorization: Bearer $GMGN_API_KEY' 2>/dev/null | head -c 5000"}
```

### Wallet Transaction History & PnL

Track historical trades and profit/loss data for a wallet.

```tool
{"tool": "shell", "command": "curl -s 'https://api.gmgn.ai/v1/portfolio/sol/WALLET_ADDRESS/trades' -H 'Authorization: Bearer $GMGN_API_KEY' 2>/dev/null | head -c 5000"}
```

### Swap / Trade Execution

Execute a token swap via optimal routing. Requires GMGN_PRIVATE_KEY.

Buy a token with SOL:

```tool
{"tool": "shell", "command": "curl -s -X POST 'https://api.gmgn.ai/v1/swap/sol' -H 'Authorization: Bearer $GMGN_API_KEY' -H 'Content-Type: application/json' -d '{\"privateKey\": \"$GMGN_PRIVATE_KEY\", \"tokenAddress\": \"TOKEN_ADDRESS\", \"side\": \"buy\", \"amount\": 0.1, \"slippage\": 10}' 2>/dev/null | head -c 3000"}
```

Sell a token (percentage):

```tool
{"tool": "shell", "command": "curl -s -X POST 'https://api.gmgn.ai/v1/swap/sol' -H 'Authorization: Bearer $GMGN_API_KEY' -H 'Content-Type: application/json' -d '{\"privateKey\": \"$GMGN_PRIVATE_KEY\", \"tokenAddress\": \"TOKEN_ADDRESS\", \"side\": \"sell\", \"percentage\": 50, \"slippage\": 10}' 2>/dev/null | head -c 3000"}
```

### Check Swap Order Status

Poll on-chain status of a submitted swap.

```tool
{"tool": "shell", "command": "curl -s 'https://api.gmgn.ai/v1/swap/sol/ORDER_ID/status' -H 'Authorization: Bearer $GMGN_API_KEY' 2>/dev/null | head -c 2000"}
```

## Display Guidelines

### Token Info
```
TOKEN_NAME (CHAIN)

价格: $X.XXXX
市值: $X.XM
流动性: $X.XM
24h 变化: +X.X%

合约安全:
  ✓ 非蜜罐 | ✓ 不可增发 | ✓ 无黑名单
  买入税: X% | 卖出税: X%
```

### Holder Analysis
```
TOKEN 持有者分析:

前10持有者占比: XX%
检测到 Sniper: X 个
检测到 Insider: X 个
Bundled 钱包: X 个

前5持有者:
1. ADDR...XXXX — X.X% — 标签: Sniper
2. ADDR...XXXX — X.X% — 无标签
```

### Trending
```
CHAIN 链上热门代币:

1. TOKEN_NAME — $X.XX — 24h: +XX%
   市值: $X.XM | 流动性: $X.XK
2. TOKEN_NAME — $X.XX — 24h: +XX%
   市值: $X.XM | 流动性: $X.XK
```

### Swap Execution
```
确认交易:
  操作: 买入 TOKEN_NAME
  金额: 0.1 SOL
  滑点: 10%
  链: Solana

  请回复 CONFIRM 确认执行。

[用户确认后]

✓ 交易已提交
  订单ID: XXXXX
  状态: 确认中...

✓ 交易完成
  成交: XXXX TOKEN @ $X.XXXX
  花费: 0.1 SOL
  交易哈希: XXXX...XXXX
```

### Wallet PnL
```
钱包 ADDR...XXXX (Solana):

总资产: $XX,XXX
持仓数量: XX 个代币
30天 PnL: +$X,XXX (+XX%)
胜率: XX%
```

## Safety Rules

- Always confirm before executing any swap
- Show full transaction details (token, amount, slippage, chain) before asking for CONFIRM
- Default slippage is 10% unless the user specifies otherwise
- Never log or display the user's private key
- Warn users about high-risk tokens detected by the security check
- If contract security shows honeypot, high tax, or mintable, warn clearly before any trade

## Cross-Skill Integration

GMGN data pairs well with other DragonClaw skills:

- Use GMGN trending + Binance meme-rush for comprehensive meme discovery
- Use GMGN contract security + Binance token-audit for double verification
- Use GMGN wallet tracking + Binance address-info for cross-chain portfolio view
- Use Douyin/Xiaohongshu trend data + GMGN trending to catch viral token pumps early

## Notes

- GMGN hosted wallet architecture means private keys are not stored locally by GMGN
- IP whitelist on the API key automatically blocks abnormal requests
- ETH chain support is coming soon
- The AI agent may make mistakes with on-chain operations. Always verify token address, amount, and slippage before confirming trades
