---
title: PancakeSwap DEX — Swap, Liquidity & Farming
slug: pancakeswap
description: Plan and execute swaps, liquidity positions, and yield farming on PancakeSwap across BSC, Ethereum, Arbitrum, Base, zkSync, Linea, opBNB, and Monad. Supports V2, V3, StableSwap, and Infinity pools. Use when user asks about PancakeSwap, CAKE, swapping on BSC, LP positions, yield farming, syrup pools, or mentions pancakeswap/PCS.
version: 1.0.0
author: dragonclaw
license: MIT
---

# PancakeSwap — Swap, Liquidity & Farming

## When to Use

- User wants to swap tokens on PancakeSwap
- User asks about LP positions, liquidity provision, or impermanent loss
- User wants to farm CAKE or stake in syrup pools
- User asks about PancakeSwap, PCS, CAKE token, or BSC DEX
- User mentions yield farming, APY/APR, or DEX liquidity

## Overview

PancakeSwap is the largest DEX on BSC and multi-chain. This skill covers swap planning with deep links, liquidity position management (V2, V3, StableSwap), yield farming (MasterChef V2/V3, Infinity farms), CAKE staking, and on-chain data via subgraphs. Supports 9 chains.

## Supported Chains

| Chain | ID | Key | Native | Smart Router |
|-------|-----|-----|--------|-------------|
| BSC | 56 | bsc | BNB | 0x13f4EA83D0bd40E75C8222255bc855a974568Dd4 |
| Ethereum | 1 | eth | ETH | 0x13f4EA83D0bd40E75C8222255bc855a974568Dd4 |
| Arbitrum | 42161 | arb | ETH | 0x32226588378236Fd0c7c4053999F88aC0e5cAc77 |
| Base | 8453 | base | ETH | 0x678Aa4bF4E210cf2166753e054d5b7c31cc7fa86 |
| zkSync | 324 | zksync | ETH | 0xf8b59f3c3Ab33200ec80a8A58b2aA5F5D2a8944C |
| Linea | 59144 | linea | ETH | 0x678Aa4bF4E210cf2166753e054d5b7c31cc7fa86 |
| opBNB | 204 | opbnb | BNB | 0x678Aa4bF4E210cf2166753e054d5b7c31cc7fa86 |
| Monad | 143 | monad | MON | 0x21114915Ac6d5A2e156931e20B20b038dEd0Be7C |
| Polygon zkEVM | — | zkevm | ETH | 0x678Aa4bF4E210cf2166753e054d5b7c31cc7fa86 |

## Core Contract Addresses

### V3 Core (BSC, ETH, zkEVM, ARB, Linea, Base, opBNB, Monad)

| Contract | Address |
|----------|---------|
| PancakeV3Factory | 0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865 |
| PancakeV3PoolDeployer | 0x41ff9AA7e16B8B1a8a8dc4f0eFacd93D02d071c9 |
| SwapRouter V3 | 0x1b81D678ffb9C0263b24A97847620C99d213eB14 |
| NonfungiblePositionManager | 0x46A15B0b27311cedF172AB29E4f4766fbE7F4364 |
| QuoterV2 | 0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997 |

### MasterChef V3

| Chain | Address |
|-------|---------|
| BSC, ETH | 0x556B9306565093C855AEA9AE92A594704c2Cd59e |
| Arbitrum | 0x5e09ACf80C0296740eC5d6F643005a4ef8DaA694 |
| zkSync | 0x4c615E78c5fCA1Ad31e4d66eb0D8688d84307463 |
| Linea | 0x22E2f236065B780FA33EC8C4E58b99ebc8B55c57 |
| Base | 0xC6A2Db661D5a5690172d8eB0a7DEA2d3008665A3 |

### Key Tokens

| Token | BSC Address |
|-------|------------|
| CAKE | 0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82 |
| USDT | 0x55d398326f99059fF775485246999027B3197955 |
| WBNB | 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c |
| BUSD | 0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56 |

### Infinity Farms

| Contract | Address |
|----------|---------|
| CampaignManager | 0x26Bde0AC5b77b65A402778448eCac2aCaa9c9115 |
| Distributor | 0xEA8620aA40877 |

## Swap Planning

### Deep Link Format

```
https://pancakeswap.finance/swap?chain={chainKey}&inputCurrency={tokenIn}&outputCurrency={tokenOut}
```

### Examples

BNB → USDT on BSC:
```
https://pancakeswap.finance/swap?chain=bsc&inputCurrency=BNB&outputCurrency=0x55d398326f99059fF775485246999027B3197955
```

ETH → USDC on Arbitrum:
```
https://pancakeswap.finance/swap?chain=arb&inputCurrency=ETH&outputCurrency=0xaf88d065e77c8cC2239327C5EDb3A432268e5831
```

### Swap Workflow

When user asks to swap:

1. **Gather intent**: What tokens? How much? Which chain?
2. **Resolve tokens**: Verify contract addresses on-chain (call symbol(), decimals())
3. **Validate**: Check amounts, decimals, chain support
4. **Fetch price**: Use CoinGecko or on-chain QuoterV2
5. **Generate deep link**: Pre-filled PancakeSwap URL
6. **Present summary**: Prices, slippage recommendation, link

### On-Chain Quote

```tool
{"tool": "shell", "command": "curl -s 'https://fapi.asterdex.com/fapi/v1/ticker/price?symbol=BNBUSDT'"}
```

For precise quotes, use QuoterV2 contract (0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997) with quoteExactInputSingle.

### Slippage Recommendations

| Token Type | Slippage |
|-----------|----------|
| Stablecoins | 0.1% |
| Blue chips (BNB, ETH, BTC) | 0.5% |
| Standard pairs | 1% |
| New/low liquidity | 5-12% |

## Liquidity Planning

### Pool Types

| Type | Fee | Best For |
|------|-----|----------|
| V2 | 0.25% | Simple pairs, low maintenance |
| V3 | 0.01%-1% | Active management, higher yields |
| StableSwap | ~0.04% | USDT/USDC/BUSD (BSC only) |

### V3 Fee Tiers

| Fee | Best For | Examples |
|-----|----------|---------|
| 0.01% | Stablecoins | USDT/USDC |
| 0.05% | Blue chips | BNB/USDT |
| 0.25% | Standard | CAKE/BNB |
| 1% | Exotic/new | Low liquidity tokens |

### Deep Links

V3 Position:
```
https://pancakeswap.finance/add/{tokenA}/{tokenB}/{feeAmount}?chain={chainKey}
```

V2 Position:
```
https://pancakeswap.finance/v2/add/{tokenA}/{tokenB}?chain={chainKey}
```

StableSwap (BSC only):
```
https://pancakeswap.finance/stable/add/{tokenA}/{tokenB}?chain=bsc
```

### Liquidity Workflow

1. Gather intent (pair, amount, chain)
2. Resolve and verify token addresses
3. Discover available pools (V2, V3, StableSwap)
4. Assess liquidity (TVL, volume, depth)
5. Fetch APY from DefiLlama
6. Recommend price range (V3)
7. Select fee tier
8. Generate deep link
9. Present summary with IL warnings

## Yield Farming

### Farm Types

| Type | How | Reward |
|------|-----|--------|
| V2 Farms | Stake LP tokens in MasterChef V2 | CAKE |
| V3 Farms | Stake V3 NFT positions in MasterChef V3 | CAKE |
| Infinity Farms | Provide liquidity, CAKE per 8h epoch via Merkle | CAKE |
| Syrup Pools | Stake CAKE | Various tokens |

### Farm Discovery

Active Infinity farms via CampaignManager:
```tool
{"tool": "shell", "command": "cast call 0x26Bde0AC5b77b65A402778448eCac2aCaa9c9115 'campaignLength()(uint256)' --rpc-url https://bsc-dataseed1.binance.org 2>/dev/null || echo 'cast not installed'"}
```

APR data from DefiLlama:
```tool
{"tool": "shell", "command": "curl -s 'https://yields.llama.fi/pools' | head -c 5000"}
```

### Farming Deep Links

```
https://pancakeswap.finance/liquidity/pools          # All farms
https://pancakeswap.finance/pools                     # Syrup pools
https://pancakeswap.finance/cake-staking              # CAKE staking
https://pancakeswap.finance/liquidity/pools?type=1    # Infinity farms
```

### Farming Decision Guide

| User Wants | Recommend |
|-----------|-----------|
| Passive yield, no IL | CAKE staking in Syrup Pool |
| Highest APR | V3 Farm with tight range |
| Set and forget | V2 Farm (full range) |
| Partner tokens | Syrup Pools |
| Stablecoin yield | USDT-USDC StableSwap LP farm |

### Infinity Farm Reward Claiming

Merkle proof flow:
1. Fetch proof: GET https://infinity.pancakeswap.com/farms/users/{chainId}/{address}/{timestamp}
2. Call Distributor with proof: claim(ClaimParams[])

## Subgraph Endpoints

### Exchange V2

| Chain | Endpoint |
|-------|---------|
| BSC | NodeReal API Marketplace |
| ETH | thegraph.com/explorer/subgraphs/9opY17WnEPD4REcC43yHycQthSeUMQE26wyoeMjZTLEx |
| Arbitrum | thegraph.com/explorer/subgraphs/EsL7geTRcA3LaLLM9EcMFzYbUgnvf8RixoEEGErrodB3 |
| Base | thegraph.com/explorer/subgraphs/2NjL7L4CmQaGJSacM43ofmH6ARf6gJoBeBaJtz9eWAQ9 |

### Exchange V3

| Chain | Endpoint |
|-------|---------|
| BSC | thegraph.com/explorer/subgraphs/Hv1GncLY5docZoGtXjo4kwbTvxm3MAhVZqBZE4sUT9eZ |
| ETH | thegraph.com/explorer/subgraphs/CJYGNhb7RvnhfBDjqpRnD3oxgyhibzc7fkAMa38YV3oS |
| Arbitrum | thegraph.com/explorer/subgraphs/251MHFNN1rwjErXD2efWMpNS73SANZN8Ua192zw6iXve |
| Base | thegraph.com/explorer/subgraphs/BHWNsedAHtmTCzXxCCDfhPmm6iN9rxUhoRHdHKyujic3 |

## Display Guidelines

### Swap Summary
```
PancakeSwap 兑换计划

交易对: BNB → USDT
链: BSC
预估输出: ~580 USDT
滑点: 0.5%

链接: https://pancakeswap.finance/swap?chain=bsc&inputCurrency=BNB&outputCurrency=0x55d3...

点击链接在 PancakeSwap 确认交易。
```

### LP Summary
```
PancakeSwap 流动性计划

交易对: CAKE/BNB (V3)
链: BSC
费率: 0.25%
推荐价格范围: $1.80 - $2.50
预估 APR: 45.2%

链接: https://pancakeswap.finance/add/0x0E09.../BNB/2500?chain=bsc

⚠️ 无常损失风险: 中等 (波动性交易对)
```

### Farming Summary
```
PancakeSwap 农场策略

推荐: CAKE 质押 (低风险)
APR: ~12.5%
链接: https://pancakeswap.finance/pools

备选: BNB-CAKE V3 农场 (高收益)
APR: ~45%
风险: 无常损失
链接: https://pancakeswap.finance/liquidity/pools?chain=bsc
```

## Safety Rules

1. Always verify token contract addresses before generating deep links
2. Warn about tokens with transfer taxes or honeypot characteristics
3. Include impermanent loss warnings for volatile pairs
4. Recommend appropriate slippage based on token type
5. Deep links open PancakeSwap UI — user confirms in their own wallet
6. Never handle private keys for PancakeSwap operations

## Cross-Skill Integration

- **Binance**: Compare CEX price vs PancakeSwap DEX price for arbitrage opportunities
- **Four.meme**: Tokens that graduate on Four.meme list on PancakeSwap — monitor for LP opportunities
- **Douyin pipeline**: When a meme trends on Douyin and has a PancakeSwap pair, generate swap deep link
- **GMGN**: Cross-reference GMGN token security with PancakeSwap pool data
- **Whale mirror**: When a whale provides liquidity on PancakeSwap, alert the user

## Config (dragonclaw.yaml)

```yaml
pancakeswap:
  enabled: true
  defaultChain: bsc
  defaultSlippage: 0.5
  preferV3: true
```

## Reference

- GitHub: https://github.com/pancakeswap/pancake-v3-contracts
- AI Skills: https://github.com/pancakeswap/pancakeswap-ai
- Subgraphs: https://github.com/pancakeswap/pancake-subgraph
- DefiLlama: https://yields.llama.fi/pools (filter project=pancakeswap-amm-v3)
