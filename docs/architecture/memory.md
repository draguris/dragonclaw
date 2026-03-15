# Memory System

DragonClaw has persistent memory that carries across conversations and sessions. The agent remembers what you tell it.

## How It Works

Memory is stored in a SQLite database (`~/.dragonclaw/memory.db`) with the following schema:

```sql
CREATE TABLE memories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,     -- what was remembered
  userId TEXT,               -- who said it
  type TEXT DEFAULT 'general', -- preference, fact, observation
  timestamp INTEGER NOT NULL   -- when
);
```

## What Gets Stored

The agent automatically extracts and stores:

- **Preferences** — "我喜欢追踪 Solana meme", "I prefer conservative trades"
- **Facts** — "我的币安账户主要交易 BNB", "My risk tolerance is low"
- **Explicit requests** — "记住我只看BSC链上的项目"

Detection uses keyword matching on patterns like 我喜欢, 我偏好, 记住, I prefer, remember.

## How Memory Is Used

When a new message arrives:
1. Keywords are extracted from the message
2. SQLite LIKE queries find matching memories
3. Top 5 most recent matches are injected into the system prompt
4. The LLM sees them as "## Your Memory" context

This means if you said "我只关注 Solana" three days ago, and today you ask "有什么新meme？", the agent remembers to filter for Solana.

## Limits and Pruning

- **10,000 entry cap** — prevents unbounded growth
- **Auto-pruning** — when the cap is exceeded, the oldest 1,000 entries are deleted
- **WAL mode** — SQLite Write-Ahead Logging for better concurrent performance

## Fallback

If `better-sqlite3` can't be installed (some environments lack native build tools), memory falls back to a JSON file (`~/.dragonclaw/memory.json`) with the same interface.

## Cross-Platform

Memory is shared across all connectors. Tell the agent something on Telegram, it remembers when you talk to it on DingTalk.

## Privacy

All memory is stored locally. It never leaves your machine unless you explicitly back it up or sync it. Delete `~/.dragonclaw/memory.db` to wipe all memories.
