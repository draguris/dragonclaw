---
title: DragonLaunch — BSC Memecoin Launchpad
slug: dragon-launch
description: Create and launch meme tokens on BSC with bonding curve and automatic PancakeSwap graduation. No third party. Token factory + bonding curve sale + auto-liquidity migration + LP burn. Use when user asks to create a token, launch a memecoin, deploy a BEP-20, or mentions DragonLaunch/发射台/发币/launch.
version: 1.0.0
author: dragonclaw
license: MIT
---

# DragonLaunch — BSC Memecoin Launchpad

## When to Use

- User wants to create/launch a memecoin on BSC
- User asks to deploy a BEP-20 token
- User mentions 发币, 发射台, launch token, create memecoin
- User wants a bonding curve sale for their token
- User asks about graduating to PancakeSwap

## What Is DragonLaunch

DragonClaw's native token launchpad. No Four.meme. No third party. Your token, your bonding curve, straight to PancakeSwap.

1. You tell DragonClaw: "发一个币叫 DRAGONCAT"
2. DragonClaw deploys the BEP-20 token on BSC
3. 80% of supply goes to bonding curve, 20% to creator
4. Buyers send BNB → price goes up along the curve
5. When curve raises enough BNB (e.g., 24 BNB), it graduates
6. Tokens + BNB migrate to PancakeSwap V2 LP automatically
7. LP tokens are burned = permanent liquidity, can't rug

## Commands

### Create Token

```tool
{"tool": "dragon_launch", "action": "createToken", "params": {
  "name": "DragonCat",
  "symbol": "DCAT",
  "totalSupply": "1000000000000000000000000000",
  "graduationBnb": "24000000000000000000"
}}
```

totalSupply in wei (1 billion with 18 decimals = 1e27). graduationBnb in wei (24 BNB = 24e18). Use 0 for defaults.

### Buy on Bonding Curve

```tool
{"tool": "dragon_launch", "action": "buy", "params": {
  "tokenAddress": "0x...",
  "bnbAmount": "0.1"
}}
```

### Sell on Bonding Curve

```tool
{"tool": "dragon_launch", "action": "sell", "params": {
  "tokenAddress": "0x...",
  "tokenAmount": "1000000000000000000000"
}}
```

### Check Sale Progress

```tool
{"tool": "dragon_launch", "action": "saleInfo", "params": {"tokenAddress": "0x..."}}
```

### Check Migration Status

```tool
{"tool": "dragon_launch", "action": "migrationInfo", "params": {"tokenAddress": "0x..."}}
```

### List Recent Launches

```tool
{"tool": "dragon_launch", "action": "listLaunches", "params": {"limit": 10}}
```

### Get My Tokens

```tool
{"tool": "dragon_launch", "action": "myTokens"}
```

### Platform Stats

```tool
{"tool": "dragon_launch", "action": "stats"}
```

## How the Bonding Curve Works

Linear curve: `price = basePrice + slope × tokensSold`

- Price starts low, increases as more people buy
- Sell back to curve at any time (price decreases)
- Platform takes 1% fee on buy/sell to treasury
- When total BNB raised hits graduation target → auto-migrate

## Graduation to PancakeSwap

When the bonding curve raises enough BNB:

1. Curve freezes (no more buys/sells)
2. Remaining tokens + all BNB sent to DragonMigrator
3. Migrator calls PancakeSwap V2 Router `addLiquidityETH`
4. LP tokens sent to dead address (0x...dEaD) = **burned permanently**
5. Token is now tradable on PancakeSwap

**LP burn means the creator cannot rug the liquidity.** This is what makes it safe.

## Default Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| Total Supply | 1,000,000,000 (1B) | Token supply with 18 decimals |
| Curve Allocation | 80% | % of supply to bonding curve |
| Creator Allocation | 20% | % kept by creator |
| Graduation Target | 24 BNB | BNB needed to graduate |
| Creation Fee | ~0.01 BNB | Anti-spam fee |
| Platform Fee | 1% | Fee on buy/sell |

## Example Conversations

```
用户: 帮我发一个 meme 币，名字叫 DRAGONCAT，代号 DCAT
龙爪: 确认创建代币:

  名称: DragonCat
  代号: DCAT
  总量: 1,000,000,000
  分配: 80% 进入联合曲线 · 20% 给你
  毕业目标: 24 BNB
  创建费: ~0.01 BNB
  LP 处理: 毕业后自动烧毁 (不可撤回)
  链: BSC

  请回复 CONFIRM 确认创建。

[确认后]

✓ 代币已部署: 0xabc123...
✓ 联合曲线已启动
✓ 当前价格: 0.000000001 BNB
✓ 进度: 0% (0/24 BNB)

任何人现在可以通过龙爪买入 DCAT。
当筹集到 24 BNB，自动上 PancakeSwap。
```

```
用户: DCAT 现在怎么样了？
龙爪: DCAT 联合曲线状态:

  当前价格: 0.000000045 BNB (+4400%)
  已售出: 340,000,000 / 800,000,000
  已筹集: 15.3 / 24 BNB (63.8%)
  购买人数: 47

  距离毕业还需: 8.7 BNB
  毕业后自动上 PancakeSwap，LP 永久锁定。
```

```
用户: DCAT 毕业了吗？
龙爪: ✓ DCAT 已毕业！

  筹集: 24.2 BNB
  LP 对: DCAT/WBNB on PancakeSwap V2
  LP 已烧毁: 永久锁定
  
  交易链接: https://pancakeswap.finance/swap?chain=bsc&outputCurrency=0xabc123...
```

## Display Guidelines

### Token Created
```
✓ 代币已部署

名称: TOKEN_NAME ($SYMBOL)
合约: 0x...
总量: X
曲线分配: 80%
创建者分配: 20%
毕业目标: 24 BNB
```

### Curve Status
```
$SYMBOL 联合曲线状态

价格: X BNB (+X%)
已售: X / X
已筹集: X / 24 BNB (X%)
进度条: ████████░░ 63%
```

### Graduation
```
✓ $SYMBOL 毕业成功！

LP: PancakeSwap V2 (SYMBOL/WBNB)
LP 已烧毁: 永久锁定
链接: https://pancakeswap.finance/swap?chain=bsc&outputCurrency=0x...
```

## Safety Rules

1. Always confirm before creating a token
2. Show all parameters (supply, allocation, target) before CONFIRM
3. Warn that creator allocation is 20% and cannot be changed after deploy
4. Explain LP burn — creator cannot rug liquidity after graduation
5. Never deploy without explicit user confirmation
6. Show creation fee before deploy

## Smart Contract Addresses

After deployment, set these in `dragonclaw.yaml` or env:

```
DRAGON_FACTORY=0x...
DRAGON_CURVE=0x...
DRAGON_MIGRATOR=0x...
```

Contracts need to be deployed once. After that, anyone can create tokens through the factory.

## Cross-Skill Integration

- **Four.meme sniper**: Monitor DragonLaunch tokens AND Four.meme tokens simultaneously
- **Arb scanner**: When a DragonLaunch token graduates to PancakeSwap, check for arb between curve price and PCS price
- **Douyin pipeline**: Viral meme → auto-create matching token on DragonLaunch
- **Whale mirror**: When a whale buys on DragonLaunch bonding curve, copy the trade

## Config (dragonclaw.yaml)

```yaml
dragonLaunch:
  enabled: true
  factoryAddress: "0x..."
  curveAddress: "0x..."
  migratorAddress: "0x..."
  confirmBeforeCreate: true
```

## Why Not Just Use Four.meme?

| | Four.meme | DragonLaunch |
|---|---|---|
| Platform fee | 0.005 BNB + trading fees | 0.01 BNB + 1% |
| Control | Four.meme controls parameters | You control everything |
| Speed | Bonding curve → graduate → PCS | Same flow, your contracts |
| Branding | Four.meme brand | DragonClaw brand |
| Integration | Standalone platform | Built into your AI agent |
| LP handling | Locked by Four.meme | Burned (permanent) |

## Technical Notes

- Contracts use OpenZeppelin for security (ERC20, ReentrancyGuard, SafeERC20)
- PancakeSwap V2 Router: `0x10ED43C718714eb63d5aA57B78B54704E256024E`
- WBNB: `0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c`
- LP tokens burned to: `0x000000000000000000000000000000000000dEaD`
- Bonding curve is linear (not exponential like pump.fun)
- Max platform fee: 5% (hardcoded cap in contract)
