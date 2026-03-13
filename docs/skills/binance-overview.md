# Built-in Binance Skills

DragonClaw ships with seven Binance skills hardcoded in the core. These are not plugins — they're available the moment you install.

## Skill Map

| Skill | What It Does | API Key Required | Chains |
|-------|-------------|-----------------|--------|
| [Spot Trading](spot-trading.md) | Place, cancel, query spot orders | Yes | CEX |
| [Meme Rush](meme-rush.md) | Real-time meme token lists from launchpads | No | Solana, BSC |
| [Market Rankings](market-rank.md) | Trending tokens, smart money, top traders | No | Solana, BSC |
| [Token Audit](token-audit.md) | Contract security scanning, scam detection | No | ETH, BSC, Sol, Base |
| [Token Info](token-info.md) | Token metadata, live prices, K-line charts | No | All |
| [Address Info](address-info.md) | Wallet holdings and portfolio value | No | BSC, Base, Solana |
| [Trading Signals](trading-signals.md) | AI-generated signals with backtest data | No | Solana, BSC |

## No Key vs Key Required

Six out of seven skills use public Binance Web3 APIs and require zero configuration. Only **Spot Trading** needs your Binance API key and secret, because it executes real trades on your behalf.

This means the moment you install DragonClaw, you can:
- Check any token price
- Audit any smart contract for scams
- Track meme coin launches in real-time
- See what smart money is buying
- View any wallet's holdings

All without creating a Binance account or configuring any keys.

## How Skills Work

Each skill is a `SKILL.md` file containing:

1. **YAML frontmatter** — name, slug, description, version
2. **Instructions** — when to use the skill, what endpoints to call, how to format the output

When you send a message, the Agent Loop scans for relevant skills based on keywords. If your message mentions "meme", "pump.fun", or "new tokens", the Meme Rush skill is injected into the LLM's system prompt. The LLM then knows exactly which Binance API endpoints to call and outputs a `tool` code block that DragonClaw executes.

```
User: "Solana上有什么新meme？"
       ↓
Agent Loop finds: meme-rush skill is relevant
       ↓
LLM sees SKILL.md instructions + user message
       ↓
LLM outputs:
  ```tool
  {"tool": "binance_market", "action": "GET", 
   "endpoint": "/bapi/.../meme-rush/rank/list",
   "params": {"chainId": "CT_501", "listType": "1"}}
  ```
       ↓
DragonClaw executes the API call
       ↓
LLM summarizes the results in Chinese
       ↓
User sees: formatted meme token list
```

## Safety Rules

For Spot Trading:
- The agent **always** confirms before placing any order
- Testnet is the default — you must explicitly switch to mainnet
- The agent shows order details (symbol, side, quantity, price) and waits for you to type `CONFIRM`
- Withdrawal permissions are never requested or used

## Adding More Crypto Skills

DragonClaw is compatible with the OpenClaw skill ecosystem. Any crypto skill from ClawHub works:

```bash
# Copy a skill to your user skills directory
cp -r some-openclaw-skill ~/.dragonclaw/skills/
dragonclaw skills  # verify it's loaded
```

You can also have the agent write skills for you:

```
你: 帮我写一个追踪 Uniswap V3 大额交易的技能
龙爪: 好的，我来为你创建这个技能...
```
