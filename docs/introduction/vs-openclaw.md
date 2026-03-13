# DragonClaw vs OpenClaw

DragonClaw is not a fork of OpenClaw. It's a new project that shares the same SKILL.md format for full skill compatibility, but has its own runtime, connectors, and defaults.

## Feature Comparison

| Feature | OpenClaw | DragonClaw |
|---------|----------|------------|
| **Skill format** | SKILL.md | SKILL.md (identical) |
| **Skill compatibility** | ClawHub ecosystem | Full OpenClaw + own skills |
| **Default LLM** | Claude / GPT | DeepSeek / Qwen |
| **Chat connectors** | WhatsApp, Telegram, Discord, Slack, iMessage, Signal, Matrix, IRC | WeChat, DingTalk, Feishu, Telegram, Discord, Slack |
| **Crypto** | Optional skill install | 7 Binance skills hardcoded |
| **Language** | English | Chinese-first, bilingual |
| **Runtime** | Node.js | Node.js |
| **Process manager** | Built-in gateway | PM2 / Docker |
| **Memory** | Custom SQLite | SQLite with auto-pruning |
| **Self-hosted** | Yes | Yes |
| **Open source** | MIT | MIT |

## What You Keep

When moving from OpenClaw to DragonClaw:

- All your installed skills work unchanged (same SKILL.md format)
- Same YAML configuration pattern
- Same concept of skills, connectors, memory, and heartbeats
- Compatible with the same LLM providers

## What's Different

- Chinese platform connectors (DingTalk, Feishu, WeChat) are first-class
- Binance skills are hardcoded in the core, not optional installs
- Chinese LLM provider endpoints are preconfigured
- Agent persona defaults to Chinese language
- Production hardening (rate limiting, auth, encrypted secrets) built into the core
- Separate deployment tooling (PM2 + Nginx instead of OpenClaw's custom gateway)

## Can I Run Both?

Yes. They use different ports (OpenClaw: varies, DragonClaw: 18789), different data directories, and different process names. You can run both on the same machine and share skills between them by symlinking the skill directories.
