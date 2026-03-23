---
title: Cross-Exchange Arbitrage Scanner
slug: arb-scanner
description: Monitor token prices across Binance, Aster, PancakeSwap, Four.meme, and GMGN simultaneously. Detect price gaps and auto-trade or alert when spread exceeds threshold. Use when user asks about arbitrage, price differences between exchanges, cross-exchange comparison, or mentions 套利/价差/搬砖.
version: 1.0.0
author: dragonclaw
license: MIT
---

# Cross-Exchange Arbitrage Scanner

## When to Use

- User asks about price differences between exchanges
- User wants arbitrage opportunities between DEX and CEX
- User asks to compare a token price across platforms
- User mentions 套利, 价差, 搬砖, arbitrage, or spread

## DragonClaw Exclusive

Nobody else has visibility into 5 platforms at once. Binance spot, Aster futures, PancakeSwap DEX, Four.meme, and GMGN — all checked simultaneously, every 5 seconds, for every token you configure.

## How It Works

1. **Configure tokens**: Provide the same token's identifiers across platforms
2. **Parallel price fetch**: All 5 platforms queried simultaneously every 5 seconds
3. **Spread calculation**: Find cheapest and most expensive price
4. **Threshold check**: Alert if spread exceeds configured minimum (default 2%)
5. **Auto-trade** (optional): Buy on cheap platform, sell on expensive one
6. **History tracking**: Record spread data for pattern analysis

## Commands

### Add Token to Monitor

```tool
{"tool": "arb_scanner", "action": "addToken", "params": {
  "symbol": "PEPE",
  "binanceSymbol": "PEPEUSDT",
  "asterSymbol": "PEPEUSDT",
  "pancakeAddress": "0x...",
  "pancakeChain": "bsc",
  "gmgnAddress": "...",
  "gmgnChain": "sol"
}}
```

Not all platforms needed — the scanner uses whatever you provide.

### Quick Price Check (one-shot)

```tool
{"tool": "arb_scanner", "action": "checkPrice", "params": {
  "symbol": "BTC",
  "binanceSymbol": "BTCUSDT",
  "asterSymbol": "BTCUSDT"
}}
```

### Start Scanner

```tool
{"tool": "arb_scanner", "action": "start", "config": {
  "minSpreadPercent": 2.0,
  "autoTrade": false,
  "pollIntervalMs": 5000
}}
```

### Stop Scanner

```tool
{"tool": "arb_scanner", "action": "stop"}
```

### View Active Alerts

```tool
{"tool": "arb_scanner", "action": "alerts"}
```

### View Spread History

```tool
{"tool": "arb_scanner", "action": "history", "params": {"symbol": "PEPE", "limit": 20}}
```

### Status

```tool
{"tool": "arb_scanner", "action": "status"}
```

## Config Options

| Option | Default | Description |
|--------|---------|-------------|
| pollIntervalMs | 5000 | Price check frequency (5s) |
| minSpreadPercent | 2.0 | Min gap to trigger alert |
| autoTrade | false | Auto-execute arb trades |
| tradeAmountUsdt | 50 | USDT equivalent per arb |
| maxTradesPerHour | 5 | Rate limit |
| cooldownPerPairMs | 300000 | 5 min cooldown per pair |
| trackHistory | true | Record spread data |

## Example Conversations

```
用户: 帮我监控 PEPE 在各个平台的价差
龙爪: 已添加 PEPE 到套利监控:

  Binance:     PEPEUSDT ✓
  Aster:       PEPEUSDT ✓
  PancakeSwap: 0x... (BSC) ✓
  GMGN:        ... (Solana) ✓
  Four.meme:   未配置

  最低价差阈值: 2%
  扫描频率: 每 5 秒
  
  开始监控...
```

```
[套利机会通知]

套利机会检测

代币: $PEPE
价差: 3.47%

最低: PancakeSwap @ $0.00001234
最高: Binance @ $0.00001277

全平台报价:
  PancakeSwap    $0.00001234
  GMGN-sol       $0.00001241
  Aster          $0.00001268
  Binance        $0.00001277

发送 "执行套利 PEPE" 手动操作
```

```
用户: BTCUSDT 在 Binance 和 Aster 差多少？
龙爪: BTC 跨平台价格:

  Binance:  $67,234.50
  Aster:    $67,198.20

  价差: 0.054% ($36.30)
  低于 2% 阈值，暂无套利机会。
```

## Display Guidelines

### Price Comparison
```
$TOKEN 跨平台价格:

  Binance      $X.XXXXXX
  Aster        $X.XXXXXX
  PancakeSwap  $X.XXXXXX
  GMGN-sol     $X.XXXXXX
  Four.meme    $X.XXXXXX

  价差: X.XX%
  最低: PLATFORM @ $X.XX
  最高: PLATFORM @ $X.XX
```

### Arb Alert
```
套利机会检测

代币: $TOKEN
价差: X.XX%
买入: PLATFORM @ $X.XXXXXX
卖出: PLATFORM @ $X.XXXXXX
预估利润: $X.XX (per $50)
```

### Trade Execution
```
套利交易完成

代币: $TOKEN
价差: X.XX%
买入: PLATFORM @ $X.XX → 哈希: 0x...
卖出: PLATFORM @ $X.XX
预估利润: $X.XX

累计套利: X 次 · 总利润: $X.XX
```

## Safety Rules

1. Auto-trade is OFF by default
2. 5 minute cooldown per token pair after each trade
3. Max 5 trades per hour
4. Spread must exceed configured threshold
5. Does not account for gas fees, slippage, or withdrawal fees — user should factor these in
6. CEX-DEX arb has withdrawal time risk — prices may change during transfer

## Cross-Skill Integration

- **Binance**: Spot prices as baseline reference
- **Aster**: Futures prices for futures-spot basis analysis
- **PancakeSwap**: DEX price via subgraph
- **Four.meme**: New BSC meme token prices pre-graduation
- **GMGN**: Solana/BSC/Base DEX prices
- **Whale mirror**: When a whale causes price impact on one platform, arb opportunity opens on others
- **Douyin pipeline**: Viral trend → price spike on DEX before CEX → arb window

## Config (dragonclaw.yaml)

```yaml
arbScanner:
  enabled: false
  minSpreadPercent: 2.0
  autoTrade: false
  tradeAmountUsdt: 50
  pollIntervalMs: 5000
  tokens:
    - symbol: PEPE
      binanceSymbol: PEPEUSDT
      asterSymbol: PEPEUSDT
      pancakeAddress: "0x..."
      gmgnAddress: "..."
      gmgnChain: sol
```

## Notes

- Price feeds are best-effort; some platforms may have delayed data
- Gas fees and slippage reduce actual arb profit — factor this into minSpreadPercent
- Cross-chain arb (e.g., Solana GMGN vs BSC Four.meme) requires bridging which adds time and cost
- Same-chain arb (e.g., PancakeSwap vs Four.meme on BSC) is faster and cheaper
- The scanner is most useful for detecting meme token price discrepancies where spreads are wider
