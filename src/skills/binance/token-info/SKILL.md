---
title: Token Information
slug: token-info
description: Search tokens, fetch metadata, live prices, K-line charts by keyword or contract address. No API key needed.
version: 1.0.0
author: dragonclaw
---

# Token Information

Search any token and retrieve metadata, live market data, and candlestick charts.

## When to Use
User asks about a token price, details, chart, K-line, or searches by name or address.

## No API Key Required

## Endpoints
- Search: GET /bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/search (keyword, chainId)
- Detail: GET /bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/detail (contractAddress, chainId)
- K-line: GET /bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/kline (contractAddress, chainId, interval)

## Tool Call
```tool
{"tool": "binance_market", "action": "GET", "endpoint": "/bapi/defi/v1/public/wallet-direct/buw/wallet/market/token/search", "params": {"keyword": "PEPE", "chainId": "1"}}
```
