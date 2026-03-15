# Meme Rush

**API Key Required:** No

Track real-time meme token launches from Pump.fun, Four.meme, and other launchpads. Includes AI-powered trending narrative analysis.

## What It Does

- **New Launches** — freshly created meme tokens still in bonding curve
- **Migration Watch** — tokens about to graduate from launchpad to DEX
- **Post-Migration** — just-migrated tokens with early DEX liquidity
- **Topic Rush** — AI-ranked hot market narratives with associated tokens

## Supported Chains

- Solana (chainId: `CT_501`)
- BSC (chainId: `56`)

## Example Conversations

```
你: Pump.fun上有什么新coin？
龙爪: Pump.fun 最新代币 (Solana):

     1. $DRAGONFIRE — 创建 15min前
        进度: 34% | 持有者: 89 | 开发者持有: 8%
        
     2. $NOODLECAT — 创建 42min前
        进度: 71% | 持有者: 234 | 开发者已卖出: 0%
        ⚠ 前10持有者占比 45%
        
     3. $PANDAGOLD — 创建 2h前
        进度: 92% | 即将迁移到DEX
        持有者: 567 | 开发者持有: 3%
```

```
你: 现在什么叙事最火？
龙爪: 24小时热门叙事:

     1. AI Agent 概念 — 净流入 $2.3M
        代币: VIRTUAL, AI16Z, GRIFFAIN
     2. 中国文化 Meme — 净流入 $890K
        代币: DRAGON, PANDA, NOODLE
     3. 政治概念 — 净流入 $456K
        代币: TRUMP, MAGA
```

## Data Points

For each token, the skill provides:
- Name, symbol, contract address
- Bonding curve progress (%)
- Holder count
- Developer sell percentage
- Top 10 holder concentration
- Sniper / insider / bundler percentages
- Tax rate (for Four.meme tokens)

## Filtering

You can ask for filtered results:

```
你: 找一些开发者没卖出的新meme，排除前10持有超过50%的
龙爪: 已过滤: 开发者未卖出 + 前10持有 < 50%
     ...
```
