---
title: Binance Spot Trading
slug: binance-spot
description: Place, cancel, and query spot orders on Binance. Requires user's API key and secret.
version: 1.0.0
author: dragonclaw
license: MIT
---

# Binance Spot Trading

Execute spot trades on Binance via authenticated REST API.

## When to Use
User wants to buy/sell crypto, check balances, view open orders, or manage spot positions.

## Authentication
Requires `BINANCE_API_KEY` and `BINANCE_API_SECRET` in config.
If not configured, tell the user: "需要先配置币安 API 密钥。在 dragonclaw.yaml 的 binance 部分添加你的 apiKey 和 secretKey。"

## Safety Rules
- ALWAYS confirm with user before placing any order
- Default to testnet unless user explicitly requests mainnet
- Never place market orders without showing the current price first
- Show order details (symbol, side, quantity, price) and ask for "CONFIRM" before executing

## Endpoints

### Get Price
GET /api/v3/ticker/price?symbol=BTCUSDT
No auth required.

### Get Account Balance
GET /api/v3/account (signed)

### Place Order
POST /api/v3/order (signed)
Required: symbol, side (BUY/SELL), type (LIMIT/MARKET), quantity
For LIMIT: add timeInForce=GTC, price

### Cancel Order  
DELETE /api/v3/order (signed)
Required: symbol, orderId

### Open Orders
GET /api/v3/openOrders (signed)
Optional: symbol

## Tool Call Format
```tool
{"tool": "binance_spot", "action": "GET", "endpoint": "/api/v3/ticker/price", "params": {"symbol": "BTCUSDT"}}
```

```tool
{"tool": "binance_spot", "action": "POST", "endpoint": "/api/v3/order", "params": {"symbol": "BTCUSDT", "side": "BUY", "type": "LIMIT", "timeInForce": "GTC", "quantity": "0.001", "price": "50000"}}
```
