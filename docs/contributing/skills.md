# Skill Development

Detailed guide for creating production-quality skills for DragonClaw.

## Skill Anatomy

```
my-skill/
└── SKILL.md          # Required — the only file needed
```

Optional supporting files:
```
my-skill/
├── SKILL.md          # Main instructions
├── references/       # Additional docs the agent can reference
│   └── api-spec.md
└── scripts/          # Helper scripts
    └── fetch-data.sh
```

## SKILL.md Template

```markdown
---
title: Human-Readable Skill Name
slug: kebab-case-slug
description: One sentence describing when this skill triggers. Include key terms users would say.
version: 1.0.0
author: github-username
license: MIT
---

# Skill Name

## When to Use
List the user intents this skill handles. Be specific:
- User asks about X
- User wants to do Y
- User mentions keyword Z

## Prerequisites
Note any required API keys, tools, or setup.

## Endpoints / Commands
Exact API URLs, parameters, expected responses.

## Tool Calls
Show the exact JSON format:

```tool
{"tool": "shell", "command": "curl -s 'https://...'"}
```

## Output Guidelines
How to format and present results to the user.

## Error Handling
What to do when the API fails or returns unexpected data.
```

## Keyword Matching

The skill manager matches against `title`, `slug`, and `description`. Optimize these for discovery:

```yaml
# Good — many matchable keywords
title: Uniswap V3 Large Trade Monitor
slug: uniswap-large-trades
description: Monitor large swaps on Uniswap V3. Use when user asks about whale trades, big swaps, large transactions on Uniswap, or DEX whale activity.

# Bad — too few keywords
title: DEX Monitor
slug: dex
description: Monitors DEX.
```

## Tool Types

### Shell (most flexible)
```json
{"tool": "shell", "command": "curl -s 'https://api.example.com/data' -H 'Authorization: Bearer $MY_KEY'"}
```

Environment variables in commands are expanded by the shell. 30-second timeout, 1MB output limit.

### Binance Market (public, no auth)
```json
{"tool": "binance_market", "action": "GET", "endpoint": "/bapi/defi/v1/public/...", "params": {"chainId": "CT_501"}}
```

### Binance Spot (authenticated)
```json
{"tool": "binance_spot", "action": "POST", "endpoint": "/api/v3/order", "params": {"symbol": "BTCUSDT", "side": "BUY", "type": "MARKET", "quoteOrderQty": "10"}}
```

## Testing

1. Place your skill in `~/.dragonclaw/skills/my-skill/`
2. Verify loading: `dragonclaw skills`
3. Test matching: `LOG_LEVEL=debug dragonclaw chat` — look for "Skills loaded" and skill match logs
4. Test execution: send a message that should trigger your skill

## Publishing

Share your skill:
1. Create a GitHub repo with your skill directory
2. Add a README with setup instructions
3. Others install by copying the folder: `cp -r your-skill ~/.dragonclaw/skills/`
