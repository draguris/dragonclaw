# System Overview

DragonClaw is structured as a modular agent runtime with five major subsystems.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Connectors                          │
│  ┌──────┐ ┌───────┐ ┌──────┐ ┌───────┐ ┌──────────┐   │
│  │ Tele │ │DingTk │ │Feishu│ │Discord│ │ WebSocket│   │
│  │ gram │ │  钉钉  │ │ 飞书  │ │      │ │   /HTTP  │   │
│  └──┬───┘ └──┬────┘ └──┬───┘ └──┬────┘ └────┬─────┘   │
│     └────────┴─────────┴────────┴────────────┘          │
│                         │                               │
│                    ┌────▼────┐                           │
│                    │ Gateway │  Auth, Rate Limit, Route  │
│                    └────┬────┘                           │
│                         │                               │
│                  ┌──────▼──────┐                         │
│                  │  Agent Loop  │                        │
│                  │              │                        │
│                  │  1. Find relevant skills              │
│                  │  2. Retrieve memory                   │
│                  │  3. Build system prompt               │
│                  │  4. Call LLM                          │
│                  │  5. Parse tool calls                  │
│                  │  6. Execute actions                   │
│                  │  7. Return response                   │
│                  └──┬───┬───┬──┘                         │
│                     │   │   │                            │
│        ┌────────────┘   │   └──────────────┐             │
│   ┌────▼───┐     ┌─────▼─────┐      ┌─────▼─────┐      │
│   │ Skills │     │    LLM    │      │  Memory   │      │
│   │        │     │           │      │           │      │
│   │Binance │     │ DeepSeek  │      │  SQLite   │      │
│   │(7 core)│     │ Qwen/Kimi │      │  10K cap  │      │
│   │+ User  │     │ GLM/GPT   │      │  Prune    │      │
│   └────────┘     │ Claude    │      └───────────┘      │
│                  └───────────┘                          │
│                                                         │
│                  ┌───────────┐                           │
│                  │   Cron    │  Heartbeats, Scheduled    │
│                  └───────────┘                           │
└─────────────────────────────────────────────────────────┘
```

## Subsystems

### Gateway (`src/core/gateway.js`)

The single entry point for all external communication. Provides a WebSocket server and REST API on port 18789 (configurable). Handles authentication (bearer token), rate limiting (token bucket per user + global), input validation (max message length, JSON schema), and CORS.

### Agent Loop (`src/core/agent-loop.js`)

The reasoning engine. For each incoming message:

1. Finds relevant skills via keyword matching on the message text
2. Retrieves related memories from SQLite
3. Builds a system prompt: agent persona + skill instructions + memory context + safety rules
4. Calls the configured LLM with the full conversation history
5. Parses the response for `tool` code blocks (Binance API calls, shell commands)
6. Executes tool calls, feeds results back to the LLM for a final human-readable response
7. Extracts any new memories (user preferences, stated facts) and stores them
8. Returns the response to the connector that originated the message

### Skill Manager (`src/core/skill-manager.js`)

Loads SKILL.md files from two sources:
- **Core skills** — 7 Binance skills hardcoded in `src/skills/binance/`
- **User skills** — any SKILL.md files in `~/.dragonclaw/skills/`

Skills are OpenClaw-compatible: YAML frontmatter + Markdown body. The body is injected into the LLM system prompt when the skill is relevant to the user's message.

### Memory (`src/core/memory.js`)

SQLite-backed persistent storage with a 10,000 entry cap and automatic pruning. Falls back to JSON file if SQLite bindings aren't available. Memories are:
- User preferences ("I prefer Solana")
- Stated facts ("My risk tolerance is conservative")
- Agent observations

Memory search is keyword-based (simple LIKE queries). Future versions may add embedding-based semantic search.

### LLM (`src/core/llm.js`)

Unified caller supporting all providers through two code paths:
- **OpenAI-compatible** — DeepSeek, Qwen, Kimi, GLM, OpenAI, OpenRouter, local models
- **Anthropic Messages API** — Claude models

Features: retry with exponential backoff, 60-second timeout, AbortController for cancellation, structured error types.

## Data Flow

```
User message → Connector → Gateway → Agent Loop → LLM
                                         ↕
                                    Skills + Memory
                                         ↕
                                    Tool Execution
                                    (Binance API, Shell)
                                         ↓
                              Response → Connector → User
```

## File Layout

```
src/
├── index.js              # Entry point, startup sequence
├── cli.js                # CLI commands (onboard, chat, doctor, skills)
├── core/
│   ├── agent-loop.js     # Reasoning engine
│   ├── binance-client.js # Binance API with HMAC signing
│   ├── config.js         # YAML loader + env var merging
│   ├── cron.js           # Scheduled tasks
│   ├── gateway.js        # WebSocket + HTTP server
│   ├── llm.js            # LLM caller (all providers)
│   ├── logger.js         # Structured JSON logging
│   ├── memory.js         # SQLite persistent memory
│   ├── rate-limiter.js   # Token bucket rate limiting
│   ├── retry.js          # Exponential backoff
│   ├── secrets.js        # AES-256 encryption at rest
│   └── skill-manager.js  # SKILL.md loader
├── connectors/
│   ├── manager.js        # Connector lifecycle
│   ├── telegram.js       # Telegram Bot API
│   ├── dingtalk.js       # DingTalk Robot webhook
│   ├── feishu.js         # Feishu Events API
│   └── discord.js        # Discord Gateway WebSocket
└── skills/binance/       # 7 hardcoded Binance skills
```
