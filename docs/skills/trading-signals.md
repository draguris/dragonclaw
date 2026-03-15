# Trading Signals

**API Key Required:** No

Access AI-generated trading signals with trigger prices, historical backtest performance, and max profit analysis.

## Disclaimer

Trading signals are informational only. They are not financial advice. Past performance does not guarantee future results. DragonClaw always reminds you of this when presenting signals.

## What You Get

For each signal:
- Token name and chain
- Signal direction (buy/sell)
- Trigger price
- Historical backtest win rate
- Maximum historical profit from this signal type
- Time range

## Example

```
你: 有什么交易信号？
龙爪: Solana 最新交易信号:

     ⚠ 以下信号仅供参考，不构成投资建议。

     1. JUP — 买入信号
        触发价: $1.12 | 当前: $1.08
        回测胜率: 67% (30天)
        历史最大收益: +23%
     
     2. WIF — 卖出信号
        触发价: $2.50 | 当前: $2.48
        回测胜率: 58% (30天)
        历史最大收益: +15%
     
     3. BONK — 买入信号
        触发价: $0.000019 | 当前: $0.000018
        回测胜率: 72% (30天)
        历史最大收益: +34%
```

## Combining with Spot Trading

If you have a Binance API key configured, you can act on signals directly:

```
你: JUP的买入信号看起来不错，帮我在触发价买入 50 USDT
龙爪: 确认限价单:
     买入 JUP/USDT
     价格: $1.12 (限价)
     金额: 50 USDT
     预估数量: ~44.6 JUP
     
     请回复 CONFIRM 执行。
```
