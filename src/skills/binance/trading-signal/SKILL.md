---
title: Trading Signals
slug: trading-signal
description: AI-generated trading signals with trigger prices, backtest data, profit analysis. No API key needed.
version: 1.0.0
author: dragonclaw
---

# Trading Signals

Access AI-generated trading signals with trigger prices, historical backtest performance, and max profit analysis.

## When to Use
User asks for signals, entry points, market opportunities, or "what looks good right now."

## No API Key Required

## Disclaimer
Always remind: signals are informational only, not financial advice. Past performance does not guarantee future results.

## Endpoint
GET /bapi/defi/v1/public/wallet-direct/buw/wallet/market/signal/list
Params: chainId, pageNo, pageSize

## Tool Call
```tool
{"tool": "binance_market", "action": "GET", "endpoint": "/bapi/defi/v1/public/wallet-direct/buw/wallet/market/signal/list", "params": {"chainId": "CT_501", "pageNo": "1", "pageSize": "10"}}
```
