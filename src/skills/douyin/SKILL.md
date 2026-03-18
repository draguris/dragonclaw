---
title: Douyin Hot Search & Trend-to-Trade Pipeline
slug: douyin
description: Monitor Douyin (TikTok China) hot search, trending videos, viral memes, livestream commerce, creator analytics, and trending music. DragonClaw exclusive — automatic pipeline that detects crypto-related viral trends, searches for matching tokens across Binance/Four.meme/GMGN/Aster, audits contract safety, and auto-buys or alerts. Use when user asks about Douyin, TikTok China, Chinese social media trends, viral memes, trend trading, or social-to-trade pipeline.
version: 2.0.0
author: dragonclaw
license: MIT
---

# Douyin — Hot Search & Trend-to-Trade Pipeline

## When to Use

- User asks about Douyin hot search or trending topics
- User wants to find crypto narratives from Chinese social media
- User wants to auto-trade based on viral Douyin memes
- User asks about Xiaohongshu + Douyin combined trend monitoring
- User mentions social media alpha, TikTok trading, or meme discovery

## DragonClaw Exclusive: Trend-to-Trade Pipeline

This is the feature that doesn't exist anywhere else.

Western agents can't access Douyin. OpenClaw's skills are passive — they wait for you to ask. DragonClaw's pipeline runs in the background, watching Chinese social media 24/7, and turns viral trends into trades automatically.

### How It Works

1. **Monitor**: Scans Douyin hot search + Xiaohongshu trending every 60 seconds
2. **Filter**: Checks if the trend contains crypto signals (币, meme, pump, 暴涨, etc.)
3. **Extract**: Pulls potential token tickers from the trend ($PEPE, DOGE币, etc.)
4. **Search**: Looks for matching tokens across Binance, Four.meme, GMGN, and Aster simultaneously
5. **Audit**: Runs safety check — honeypot detection, tax rate, dev holdings
6. **Execute**: Auto-buys (if enabled) or sends alert to DingTalk/Feishu/Telegram

### Start Pipeline

```tool
{"tool": "douyin_pipeline", "action": "start", "config": {
  "minViews": 5000000,
  "autoTrade": false,
  "platforms": ["binance", "fourmeme", "gmgn"],
  "xiaohongshuEnabled": true,
  "notifyOnTrend": true,
  "notifyOnMatch": true
}}
```

### Stop Pipeline

```tool
{"tool": "douyin_pipeline", "action": "stop"}
```

### Enable Auto-Trade

```tool
{"tool": "douyin_pipeline", "action": "update", "config": {
  "autoTrade": true,
  "buyAmountBnb": "0.01",
  "buyAmountUsdt": 10,
  "maxTradesPerHour": 3
}}
```

### Check Status

```tool
{"tool": "douyin_pipeline", "action": "status"}
```

### Pipeline Config

| Option | Default | Description |
|--------|---------|-------------|
| minViews | 5,000,000 | Minimum views to trigger |
| minLikes | 100,000 | Minimum likes to trigger |
| autoTrade | false | false = alert only, true = auto-buy |
| buyAmountUsdt | 10 | USDT per trade (Binance) |
| buyAmountBnb | "0.01" | BNB per trade (Four.meme) |
| platforms | all | Where to search: binance, fourmeme, gmgn, aster |
| requireAudit | true | Must pass safety check before buy |
| maxTaxRate | 5 | Max tax % for Four.meme tokens |
| cooldownMs | 300000 | 5 min cooldown per keyword |
| maxTradesPerHour | 3 | Rate limit on auto-trades |
| xiaohongshuEnabled | true | Also monitor Xiaohongshu |

### Example Flow

```
[抖音热搜] "brainrot挑战" — 1200万播放

龙爪检测到加密信号:
  关键词: brainrot
  热度: 1200万
  来源: 抖音

搜索代币 $BRAINROT:
  ✓ Four.meme: 找到 BRAINROT (BSC) — 0x1a2b...
  ✓ GMGN-SOL: 找到 BRAINROT (Solana) — 9abc...
  ✗ Binance: 未找到
  ✗ Aster: 未找到

安全审计:
  Four.meme: ✓ V2 | ✓ 无税 | ✓ 未毕业
  GMGN-SOL: ✓ 非蜜罐 | ✓ 买入税 0% | ✓ 卖出税 0%

→ 自动买入 0.01 BNB (Four.meme BSC)
→ 交易哈希: 0xabc...

来源: 抖音热搜 → 代币搜索 → 安全审计 → 自动买入
```

### Example Conversations

```
用户: 帮我监控抖音，有 meme 热搜就提醒我
龙爪: 已启动抖音趋势监控:

  来源: 抖音 + 小红书
  最低热度: 500万
  自动交易: 关闭 (仅提醒)
  搜索平台: Binance, Four.meme, GMGN, Aster

  发现加密相关热搜会自动搜索代币并通知你。
  说 "开启自动交易" 可以自动买入。
```

```
用户: 抖音上什么在火？有没有相关的币？
龙爪: 当前抖音热搜 (加密相关):

1. "brainrot挑战" — 1200万播放
   → $BRAINROT 在 Four.meme 和 Solana 上找到
   → 审计通过: 无税、非蜜罐

2. "AI画图翻车" — 890万播放
   → 未找到直接相关代币

3. "dogwifhat二创" — 650万播放
   → $WIF 在 Binance 有交易对
   → 当前价格: $1.82 (+12.3% 24h)
```

## Manual Douyin Queries

### Hot Search

```tool
{"tool": "douyin", "action": "hotSearch"}
```

### Search Videos

```tool
{"tool": "douyin", "action": "searchVideo", "params": {"keyword": "PEPE币"}}
```

### Creator Analytics

```tool
{"tool": "douyin", "action": "creatorInfo", "params": {"userId": "USER_ID"}}
```

### Trending Music

```tool
{"tool": "douyin", "action": "trendingMusic"}
```

## Display Guidelines

### Trend Alert
```
抖音热搜检测到加密信号

关键词: brainrot挑战
热度: 1200万播放
来源: 抖音
```

### Token Match
```
抖音趋势 → 代币匹配

趋势: brainrot挑战 (1200万热度)
代币: $BRAINROT
平台: Four.meme (BSC)
价格: 0.00023 BNB
合约: 0x1a2b3c...

发送 "买 BRAINROT" 手动交易
```

## Safety Rules

1. Auto-trade is OFF by default — user must explicitly enable
2. Always run token audit before any trade
3. Rate limit: max 3 auto-trades per hour
4. 5 minute cooldown per keyword to prevent duplicate trades
5. Never trade tokens that fail audit (honeypot, high tax, V1)
6. Always show trend source + audit result in notifications

## Cross-Skill Integration

- **Douyin trend → Four.meme sniper**: When trend matches a new Four.meme token, the sniper can prioritize it
- **Douyin trend → Binance spot**: Buy trending tokens on Binance if they exist
- **Douyin trend → GMGN**: Search across Solana/BSC/Base for matching tokens
- **Douyin trend → Aster**: Open futures position to ride the narrative
- **Xiaohongshu + Douyin**: Combined signal is stronger than either alone

## Config (dragonclaw.yaml)

```yaml
douyinPipeline:
  enabled: false
  autoTrade: false
  minViews: 5000000
  buyAmountBnb: "0.01"
  buyAmountUsdt: 10
  platforms: ["binance", "fourmeme", "gmgn", "aster"]
  requireAudit: true
  maxTradesPerHour: 3
  xiaohongshuEnabled: true
  notifyOnTrend: true
  notifyOnMatch: true
  notifyOnTrade: true
```

## Notes

- Douyin API may have rate limits or anti-scraping measures
- Xiaohongshu trends supplement Douyin for broader coverage
- Token tickers extracted from trends may be noisy — audit layer is critical
- Western agents literally cannot do this because they don't have Douyin access
- This is pure alpha infrastructure: social media trend → token discovery → safety audit → execution
