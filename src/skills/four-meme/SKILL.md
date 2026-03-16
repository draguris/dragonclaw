---
title: Four.meme Token Creation, Trading & Auto-Snipe (BSC)
slug: four-meme
description: Create and trade meme tokens on Four.meme (BSC). Includes auto-snipe for new launches, buy/sell with quotes, token rankings, on-chain events, TaxToken queries, transfers, and EIP-8004 NFTs. Use when user asks about Four.meme, creating meme tokens on BSC, sniping new tokens, four.meme trading, or BSC meme launches.
version: 2.0.0
author: dragonclaw
license: MIT
---

# Four.meme — Token Creation, Trading & Auto-Snipe (BSC)

## When to Use

- User wants to create/launch a meme token on BSC
- User wants to buy or sell tokens on Four.meme
- User wants to auto-snipe new token launches
- User asks about Four.meme rankings, hot tokens, or new launches
- User wants token info, quotes, events, or tax config
- User mentions Four.meme, four-meme, BSC meme token, token sniping

## DragonClaw Exclusive: Auto-Snipe

DragonClaw can watch Four.meme for new token launches 24/7 and auto-buy tokens that match your criteria. This runs in the background — no commands needed after setup.

OpenClaw's four-meme plugin can only run commands when you ask. DragonClaw's sniper watches, evaluates, and acts on its own.

### Start Auto-Snipe

When the user wants to enable sniping, configure and start:

```tool
{"tool": "four_meme_sniper", "action": "start", "config": {
  "buyAmountBnb": "0.01",
  "labels": ["Meme", "AI"],
  "excludeTaxToken": true,
  "maxConcurrent": 5,
  "notifyOnSnipe": true
}}
```

### Stop Auto-Snipe

```tool
{"tool": "four_meme_sniper", "action": "stop"}
```

### Check Sniper Status

```tool
{"tool": "four_meme_sniper", "action": "status"}
```

### Update Sniper Config

```tool
{"tool": "four_meme_sniper", "action": "update", "config": {
  "buyAmountBnb": "0.05",
  "labels": ["Meme"]
}}
```

### Sniper Config Options

| Option | Default | Description |
|--------|---------|-------------|
| buyAmountBnb | "0.01" | BNB to spend per new token |
| labels | ["Meme", "AI"] | Only snipe tokens with these labels (empty = all) |
| excludeTaxToken | true | Skip tokens with trading tax |
| maxTaxRate | 0 | Max acceptable tax % (0 = no tax) |
| maxConcurrent | 5 | Max snipes per hour |
| cooldownMs | 5000 | Wait between snipes (ms) |
| pollIntervalMs | 3000 | Block scanning interval (ms) |
| notifyOnSnipe | true | Send chat notification on successful buy |
| notifyOnSkip | false | Notify when skipping a token |

### What the Sniper Does

1. Polls BSC blocks for TokenCreate events on TokenManager2
2. For each new token:
   - Checks if V2 (V1 not supported)
   - Checks if already graduated to DEX (skip)
   - Checks tax token status (skip if tax > maxTaxRate)
   - Gets buy quote from Helper3
   - Calculates slippage protection
   - Executes buyTokenAMAP on TokenManager2
3. Sends notification to all connected chat platforms (DingTalk, Telegram, etc.)
4. Respects rate limits (maxConcurrent per hour, cooldown between buys)

### Example Conversations

```
用户: 帮我监控 Four.meme 新发币，只要 Meme 标签，每个买 0.02 BNB
龙爪: 已配置 Four.meme 自动狙击:

  平台: Four.meme (BSC)
  标签: Meme
  金额: 0.02 BNB / 每个新币
  排除税币: 是
  每小时上限: 5 个

  监控已启动。发现符合条件的新币会自动买入并通知你。
  说 "停止监控" 随时关闭。
```

```
用户: 狙击状态怎么样？
龙爪: Four.meme 狙击状态:

  状态: 运行中
  本小时已狙击: 2/5
  总计狙击: 7 个代币
  买入金额: 0.02 BNB/个
  最新区块: 48,234,567
```

```
用户: 停止 Four.meme 监控
龙爪: Four.meme 狙击已停止。共狙击 7 个代币。
```

## Manual Trading

### Get Token Info (on-chain)

```tool
{"tool": "four_meme", "action": "getTokenInfo", "params": {"tokenAddress": "TOKEN_ADDRESS"}}
```

### Token List (hot, new, graduated)

```tool
{"tool": "four_meme", "action": "tokenList", "params": {"orderBy": "Hot", "pageSize": 10}}
```

### Token Rankings

```tool
{"tool": "four_meme", "action": "tokenRankings", "params": {"orderBy": "Hot"}}
```

orderBy: Time (newest), ProgressDesc (bonding curve), TradingDesc (volume), Hot, Graduated

### Token Detail

```tool
{"tool": "four_meme", "action": "tokenGet", "params": {"tokenAddress": "TOKEN_ADDRESS"}}
```

### Buy Quote (estimate, no tx)

```tool
{"tool": "four_meme", "action": "quoteBuy", "params": {"tokenAddress": "TOKEN_ADDRESS", "fundsWei": "10000000000000000"}}
```

### Sell Quote (estimate, no tx)

```tool
{"tool": "four_meme", "action": "quoteSell", "params": {"tokenAddress": "TOKEN_ADDRESS", "amountWei": "1000000000000000000"}}
```

### Execute Buy (requires PRIVATE_KEY)

```tool
{"tool": "four_meme", "action": "buy", "params": {"tokenAddress": "TOKEN_ADDRESS", "fundsWei": "10000000000000000", "minAmountWei": "0"}}
```

### Execute Sell (requires PRIVATE_KEY)

```tool
{"tool": "four_meme", "action": "sell", "params": {"tokenAddress": "TOKEN_ADDRESS", "amountWei": "1000000000000000000"}}
```

### Get On-chain Events

```tool
{"tool": "four_meme", "action": "getEvents", "params": {"fromBlock": "48000000"}}
```

### Tax Token Info

```tool
{"tool": "four_meme", "action": "getTaxInfo", "params": {"tokenAddress": "TOKEN_ADDRESS"}}
```

### Send BNB

```tool
{"tool": "four_meme", "action": "sendBnb", "params": {"toAddress": "0x...", "amountWei": "100000000000000000"}}
```

### Send ERC20

```tool
{"tool": "four_meme", "action": "sendErc20", "params": {"tokenAddress": "TOKEN_CONTRACT", "toAddress": "0x...", "amountWei": "1000000000000000000"}}
```

### Check Balance

```tool
{"tool": "four_meme", "action": "getBalance", "params": {"tokenAddress": "TOKEN_ADDRESS"}}
```

Omit tokenAddress for BNB balance.

## Display Guidelines

### Token Info
```
TOKEN_NAME ($SYMBOL) — Four.meme BSC

版本: V2 | 进度: XX%
价格: X BNB
已筹集: X / X BNB
持有者: XX
毕业状态: 未毕业 / 已上 PancakeSwap
```

### Rankings
```
Four.meme BSC 热门代币:

1. TOKEN ($SYM) — 进度 XX% — 24h量 XX BNB
2. TOKEN ($SYM) — 进度 XX% — 24h量 XX BNB
```

### Snipe Notification
```
Four.meme 狙击成功

代币: TOKEN_NAME ($SYMBOL)
合约: 0xXXXX...
买入: 0.01 BNB
预估数量: XXXX
交易: https://bscscan.com/tx/0xXXXX...
```

### Trade Confirmation
```
确认交易:
  操作: 买入 TOKEN_NAME
  金额: 0.05 BNB
  链: BSC
  
  请回复 CONFIRM 确认执行。
```

## Safety Rules

1. Present security notice on first use (protect private key, use small wallet, move funds after trading)
2. Always confirm before manual trades (show token, amount, chain)
3. Auto-snipe uses pre-approved config — no per-trade confirmation (that's the point)
4. Only BSC. Only TokenManager V2.
5. Never log or display private keys
6. Warn about high-risk tokens (tax tokens, high dev holdings)

## Cross-Skill Integration

- **Binance token-audit**: Double-check Four.meme contracts before manual buys
- **Douyin/Xiaohongshu trends**: Find meme narratives, check if tokens exist on Four.meme
- **GMGN**: Compare Solana launches (GMGN) vs BSC launches (Four.meme)
- **Binance meme-rush**: Pump.fun (Solana) vs Four.meme (BSC) side by side
- **Auto-snipe + Douyin**: When a meme goes viral on Douyin, auto-check Four.meme for related tokens

## Config (dragonclaw.yaml)

```yaml
fourMeme:
  enabled: true
  sniper:
    enabled: false
    buyAmountBnb: "0.01"
    labels: ["Meme", "AI"]
    excludeTaxToken: true
    maxConcurrent: 5
    notifyOnSnipe: true
```

## Reference

- TokenManager2: `0x5c952063c7fc8610FFDB798152D69F0B9550762b`
- Helper3: `0xF251F83e40a78868FcfA3FA4599Dad6494E46034`
- Official docs: https://four-meme.gitbook.io/four.meme/brand/protocol-integration
- GitHub: https://github.com/four-meme-community/four-meme-ai
