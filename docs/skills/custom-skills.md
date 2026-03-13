# Writing Custom Skills

Skills are how you extend DragonClaw. A skill is just a directory with a `SKILL.md` file — the same format OpenClaw uses.

## Skill Structure

```
my-skill/
└── SKILL.md
```

That's it. One file. Place the directory in `~/.dragonclaw/skills/` and DragonClaw loads it on next start.

## SKILL.md Format

```markdown
---
title: My Custom Skill
slug: my-skill
description: Short description of when this skill should be used.
version: 1.0.0
author: your-github-username
---

# My Custom Skill

## When to Use
Describe the user intents that should trigger this skill.
Use natural language — the agent loop matches keywords.

## Endpoints / APIs
List the APIs this skill calls, with exact URLs and parameters.

## Tool Call Format
Show the exact JSON the LLM should output:

```tool
{"tool": "shell", "command": "curl -s https://api.example.com/data"}
```

## Output Format
Describe how the agent should present results to the user.
```

## Key Principles

### 1. Be Specific About When to Use

The skill manager matches keywords from the `title`, `slug`, and `description` fields against the user's message. Be specific:

```yaml
# Good — clear triggers
description: Track real-time meme token launches from Pump.fun and Four.meme launchpads.

# Bad — too vague
description: Crypto stuff.
```

### 2. Include Exact API Calls

The LLM needs exact endpoints, parameters, and expected response formats. Don't be vague:

```markdown
## Endpoint
GET https://api.coingecko.com/api/v3/simple/price
Params: ids (comma-separated), vs_currencies (usd)

Example:
```tool
{"tool": "shell", "command": "curl -s 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd'"}
```
```

### 3. Define Output Format

Tell the LLM how to format results:

```markdown
## Display Guidelines
- Show token name, price, 24h change
- Use Chinese for column headers
- Flag any price change > 10% with a warning
- Round prices to 2 decimal places for tokens > $1, 6 decimals for tokens < $0.01
```

### 4. Declare Auth Requirements

If your skill needs API keys, say so explicitly:

```markdown
## Authentication
Requires `COINGECKO_API_KEY` environment variable.
If not set, tell the user: "需要配置 CoinGecko API 密钥。"
```

## Tool Types

Skills can use two tool types:

### Binance API
```json
{"tool": "binance_market", "action": "GET", "endpoint": "/bapi/...", "params": {...}}
{"tool": "binance_spot", "action": "POST", "endpoint": "/api/v3/order", "params": {...}}
```

### Shell Commands
```json
{"tool": "shell", "command": "curl -s https://api.example.com/data"}
```

Shell commands run with a 30-second timeout and 1MB output limit.

## Example: CoinGecko Price Skill

```markdown
---
title: CoinGecko Price Check
slug: coingecko-price
description: Get token prices from CoinGecko. Use when user asks about prices for tokens not on Binance.
version: 1.0.0
author: dragonclaw-community
---

# CoinGecko Price Check

## When to Use
User asks about token prices for coins not available on Binance Web3 APIs,
or specifically mentions CoinGecko.

## No API Key Required
Uses the free CoinGecko public API (rate limit: 30 calls/min).

## Endpoint
GET https://api.coingecko.com/api/v3/simple/price

## Tool Call
```tool
{"tool": "shell", "command": "curl -s 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd,cny&include_24hr_change=true'"}
```

## Display
Show: token name, USD price, CNY price, 24h change %.
```

## Testing Your Skill

1. Place in `~/.dragonclaw/skills/my-skill/SKILL.md`
2. Run `dragonclaw skills` to verify it loads
3. Run `dragonclaw chat` and test with a matching query
4. Check logs for skill matching: `LOG_LEVEL=debug dragonclaw start`

## Publishing

To share your skill with the community:

1. Create a GitHub repo with your skill directory
2. Others can install by copying the folder to their skills directory
3. Submit a PR to the DragonClaw skills registry (coming soon)
