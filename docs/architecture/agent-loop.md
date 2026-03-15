# Agent Loop

The Agent Loop is the brain of DragonClaw. It processes every incoming message through a seven-step cycle.

## The Cycle

```
1. Receive message (channelId, userId, text, platform)
       ↓
2. Find relevant skills (keyword matching)
       ↓
3. Retrieve memories (SQLite search)
       ↓
4. Build system prompt
   = Agent persona
   + Matched skill instructions
   + Memory context
   + Safety rules
   + Binance key status
       ↓
5. Call LLM with [system prompt + conversation history]
       ↓
6. Parse response for ```tool blocks
       ↓
7a. No tools → return text to user
7b. Tools found → execute → feed results back to LLM → return final response
```

## System Prompt Construction

The system prompt is rebuilt for every message. It includes:

1. **Agent persona** — configurable identity and behavior rules
2. **Language directive** — respond in Chinese/English/auto based on config
3. **Binance status** — whether API keys are configured, what's available
4. **Relevant skills** — SKILL.md content wrapped in `<skill>` XML tags
5. **Memory** — recent relevant memories as bullet points
6. **Tool call format** — instructions for how to output tool invocations

This means the LLM always has current, relevant context without a static prompt growing stale.

## Session Management

Each `channelId` gets its own conversation history, capped at 30 messages. Old messages are dropped from the front (FIFO). There is no limit on the number of channels, but idle channels consume minimal memory since they're just arrays in a Map.

## Tool Execution

When the LLM outputs a `tool` code block, DragonClaw:

1. Parses the JSON
2. Routes to the correct executor based on `tool` field:
   - `binance_spot` / `binance_market` / `binance_wallet` → Binance Client
   - `shell` → child_process.exec with 30s timeout
3. Executes the call
4. Feeds the raw result back to the LLM as a follow-up message
5. The LLM generates a human-readable summary

This two-pass approach (LLM → tool → LLM) produces much better responses than trying to format API results in a single pass.

## Memory Extraction

After each exchange, the loop checks if the user stated a preference or fact:
- Chinese patterns: 我喜欢, 我偏好, 记住
- English patterns: I prefer, remember, my name is

Matched statements are stored in the memory database with userId and timestamp.

## Error Handling

- LLM call failures are caught and returned as user-facing error messages in Chinese
- Tool execution failures are caught per-tool — one failing tool doesn't prevent others from running
- The session history is preserved even on errors so context isn't lost
