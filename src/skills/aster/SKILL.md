---
title: Aster Finance Futures & Spot Trading
slug: aster
description: Trade perpetual futures and spot on Aster Finance (asterdex.com). Place/cancel orders, check positions, balances, leverage, market data, klines, funding rates, orderbook depth, and WebSocket streams. Supports both V1 (HMAC) and V3 (EIP-712 wallet) authentication. Use when user asks about Aster, Aster DEX, Aster Finance, perpetual futures, perps trading, or mentions asterdex.
version: 1.0.0
author: dragonclaw
license: MIT
---

# Aster Finance — Futures & Spot Trading

## When to Use

- User wants to trade perpetual futures or spot on Aster
- User asks about Aster DEX, Aster Finance, or asterdex
- User wants to check positions, balances, PnL, or funding rates on Aster
- User asks to place/cancel/query orders on Aster
- User wants market data, klines, orderbook, or ticker from Aster
- User wants to set leverage or margin type on Aster
- User mentions perps, perpetual futures, or DEX trading

## Overview

Aster Finance is a decentralized perpetual futures and spot exchange. The API is Binance-compatible in structure but uses EVM wallet-based authentication (V3) or HMAC (V1). Supports BTCUSDT, ETHUSDT, and 100+ perpetual pairs. Spot trading available on testnet and mainnet.

## API Base URLs

| Service | REST | WebSocket |
|---------|------|-----------|
| Futures | https://fapi.asterdex.com | wss://fstream.asterdex.com |
| Spot | https://sapi.asterdex.com | wss://sstream.asterdex.com |

## Authentication

### V1 — HMAC SHA256 (simpler)

Like Binance. API key + secret, HMAC-SHA256 signature on query string.

```
Header: X-MBX-APIKEY: <api_key>
Signature: HMAC-SHA256(queryString, apiSecret)
```

### V3 — EIP-712 Wallet Signing (recommended)

Uses EVM wallet address + signer + private key. Nonce-based signatures.

Credentials needed:
- `user`: wallet address (0x...)
- `signer`: signer address (0x...)
- `privateKey`: private key for signing

The agent computes: nonce (microsecond timestamp), sorts params, builds EIP-712 typed data, signs with private key.

## Credentials Setup

```
ASTER_API_KEY=your_api_key          # V1 HMAC
ASTER_API_SECRET=your_api_secret    # V1 HMAC
ASTER_USER=0x...                    # V3 wallet address
ASTER_SIGNER=0x...                  # V3 signer address
ASTER_PRIVATE_KEY=0x...             # V3 private key
```

If not configured, tell user:
"需要配置 Aster API 凭证。前往 https://pro.asterdex.com 创建 API Key，然后设置环境变量。"

## Futures Endpoints

### Public (no auth)

#### Ping
```tool
{"tool": "shell", "command": "curl -s 'https://fapi.asterdex.com/fapi/v1/ping'"}
```

#### Server Time
```tool
{"tool": "shell", "command": "curl -s 'https://fapi.asterdex.com/fapi/v1/time'"}
```

#### Exchange Info (symbols, filters, rate limits)
```tool
{"tool": "shell", "command": "curl -s 'https://fapi.asterdex.com/fapi/v1/exchangeInfo' | head -c 3000"}
```

#### Orderbook Depth
```tool
{"tool": "shell", "command": "curl -s 'https://fapi.asterdex.com/fapi/v1/depth?symbol=BTCUSDT&limit=20'"}
```

#### Recent Trades
```tool
{"tool": "shell", "command": "curl -s 'https://fapi.asterdex.com/fapi/v1/trades?symbol=BTCUSDT&limit=10'"}
```

#### Klines / Candlesticks
```tool
{"tool": "shell", "command": "curl -s 'https://fapi.asterdex.com/fapi/v1/klines?symbol=BTCUSDT&interval=1h&limit=24'"}
```

Intervals: 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M

#### 24h Ticker
```tool
{"tool": "shell", "command": "curl -s 'https://fapi.asterdex.com/fapi/v1/ticker/24hr?symbol=BTCUSDT'"}
```

#### Price Ticker
```tool
{"tool": "shell", "command": "curl -s 'https://fapi.asterdex.com/fapi/v1/ticker/price?symbol=BTCUSDT'"}
```

#### Book Ticker (best bid/ask)
```tool
{"tool": "shell", "command": "curl -s 'https://fapi.asterdex.com/fapi/v1/ticker/bookTicker?symbol=BTCUSDT'"}
```

#### Funding Rate
```tool
{"tool": "shell", "command": "curl -s 'https://fapi.asterdex.com/fapi/v1/premiumIndex?symbol=BTCUSDT'"}
```

### Signed (requires auth)

#### Place Order
```tool
{"tool": "aster", "action": "placeOrder", "params": {
  "symbol": "BTCUSDT",
  "side": "BUY",
  "type": "LIMIT",
  "quantity": "0.001",
  "price": "60000",
  "timeInForce": "GTC"
}}
```

Order types: LIMIT, MARKET, STOP, STOP_MARKET, TAKE_PROFIT, TAKE_PROFIT_MARKET, TRAILING_STOP_MARKET

#### Cancel Order
```tool
{"tool": "aster", "action": "cancelOrder", "params": {
  "symbol": "BTCUSDT",
  "orderId": "ORDER_ID"
}}
```

#### Query Order
```tool
{"tool": "aster", "action": "queryOrder", "params": {
  "symbol": "BTCUSDT",
  "orderId": "ORDER_ID"
}}
```

#### Open Orders
```tool
{"tool": "aster", "action": "openOrders", "params": {"symbol": "BTCUSDT"}}
```

#### Account Balance
```tool
{"tool": "aster", "action": "getBalance", "params": {}}
```

#### Positions
```tool
{"tool": "aster", "action": "getPositions", "params": {}}
```

#### Set Leverage
```tool
{"tool": "aster", "action": "setLeverage", "params": {
  "symbol": "BTCUSDT",
  "leverage": 10
}}
```

#### Set Margin Type
```tool
{"tool": "aster", "action": "setMarginType", "params": {
  "symbol": "BTCUSDT",
  "marginType": "CROSSED"
}}
```

Options: ISOLATED, CROSSED

## Spot Endpoints

Base URL: https://sapi.asterdex.com

### Public

#### Spot Orderbook
```tool
{"tool": "shell", "command": "curl -s 'https://sapi.asterdex.com/api/v1/depth?symbol=BNBUSDT&limit=20'"}
```

#### Spot Klines
```tool
{"tool": "shell", "command": "curl -s 'https://sapi.asterdex.com/api/v1/klines?symbol=BNBUSDT&interval=1h&limit=24'"}
```

#### Spot 24h Ticker
```tool
{"tool": "shell", "command": "curl -s 'https://sapi.asterdex.com/api/v1/ticker/24hr?symbol=BNBUSDT'"}
```

### Signed

#### Spot Place Order
```tool
{"tool": "aster", "action": "spotPlaceOrder", "params": {
  "symbol": "BNBUSDT",
  "side": "BUY",
  "type": "LIMIT",
  "quantity": "5",
  "price": "1.1",
  "timeInForce": "GTC"
}}
```

#### Spot Cancel Order
```tool
{"tool": "aster", "action": "spotCancelOrder", "params": {
  "symbol": "BNBUSDT",
  "orderId": "ORDER_ID"
}}
```

## WebSocket Streams

### Futures Market Streams
```
wss://fstream.asterdex.com/ws/btcusdt@trade
wss://fstream.asterdex.com/ws/btcusdt@kline_1m
wss://fstream.asterdex.com/ws/btcusdt@depth20@100ms
wss://fstream.asterdex.com/ws/btcusdt@markPrice@1s
wss://fstream.asterdex.com/ws/!miniTicker@arr
```

### User Data Stream
1. Get listen key: POST /fapi/v1/listenKey
2. Connect: wss://fstream.asterdex.com/ws/<listenKey>
3. Keep alive: PUT /fapi/v1/listenKey every 30 min

Events: ORDER_TRADE_UPDATE, ACCOUNT_UPDATE, MARGIN_CALL

## Display Guidelines

### Price Check
```
BTCUSDT (Aster Futures)

价格: $67,234.50
24h 涨跌: +2.34%
24h 高/低: $68,100 / $65,800
24h 成交量: 12,345 BTC
资金费率: +0.0100%
下次费率时间: 4h 后
```

### Position Display
```
Aster 当前持仓:

BTCUSDT LONG
  数量: 0.05 BTC
  开仓均价: $65,000
  当前价格: $67,234
  未实现盈亏: +$111.70 (+3.44%)
  杠杆: 10x
  保证金模式: 全仓

ETHUSDT SHORT
  数量: 1.0 ETH
  开仓均价: $3,500
  当前价格: $3,450
  未实现盈亏: +$50.00 (+1.43%)
```

### Order Confirmation
```
确认下单:
  交易所: Aster Finance
  交易对: BTCUSDT
  方向: 买入 (做多)
  类型: 限价单
  数量: 0.001 BTC
  价格: $60,000
  杠杆: 10x

  请回复 CONFIRM 确认下单。
```

## Safety Rules

1. Always confirm before placing orders
2. Show full order details before asking for CONFIRM
3. Warn about high leverage (>20x)
4. Never log or display private keys
5. Default to testnet for first-time users if unsure
6. Rate limits: respect 429 responses, exponential backoff

## Error Handling

Common errors:
- -1121: Invalid symbol
- -2019: Margin insufficient
- -1102: Missing required parameter
- -4061: Position side mismatch
- -1015: Too many orders

On 429: back off, do not retry immediately. On 418: IP banned, wait for ban to expire.

## Cross-Skill Integration

- Use Binance market-rank skill to find trending tokens, then trade them on Aster
- Use GMGN for on-chain analysis, hedge with Aster futures
- Use Four.meme sniper for BSC meme buys, hedge exposure with Aster short positions
- Use Douyin trend data to identify narrative plays, execute on Aster

## Config (dragonclaw.yaml)

```yaml
aster:
  enabled: true
  auth: v3                          # v1 or v3
  apiKey: ""                        # V1 only
  apiSecret: ""                     # V1 only
  user: ""                          # V3: wallet address
  signer: ""                        # V3: signer address
  privateKey: ""                    # V3: private key
  defaultLeverage: 5
  confirmBeforeTrade: true
  testnet: false
```

## Reference

- API Docs: https://github.com/asterdex/api-docs
- Skills Hub: https://github.com/asterdex/aster-skills-hub
- Official: https://pro.asterdex.com
- Docs: https://docs.asterdex.com
